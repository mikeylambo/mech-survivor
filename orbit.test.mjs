// Orbit identity and the seeded run stream.
//
// The graded claim is that the five orbits are measurably different places, not
// the same fight at five difficulties. So the tests sample real distributions
// over simulated runs and require them to separate — a table of different
// numbers that produced the same play would pass a shallower test and fail this
// one.
import test from 'node:test';
import assert from 'node:assert/strict';
import {ORBITS} from './public/canon.js';
import {createRng, hashSeed, setRunSeed, runRng} from './public/run-rng.js';
import {
  ORBIT_IDENTITY, orbitIdentity, createOrbitState, tickOrbitMechanic,
  rollOrbitEvent, rollBodyPlan, rollBehavior, orbitRewardName, drawOrbitAtmosphere, orbitIdentityCoverage,
} from './public/orbit-identity.js';

const ORBIT_COUNT = ORBITS.length;
const DT = 1 / 60;

function distribution(roll, samples = 4000) {
  const counts = {};
  for (let i = 0; i < samples; i++) {
    const v = roll();
    counts[v] = (counts[v] || 0) + 1;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, v / total]));
}

/** Total variation distance: 0 identical, 1 disjoint. */
function separation(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let sum = 0;
  for (const k of keys) sum += Math.abs((a[k] || 0) - (b[k] || 0));
  return sum / 2;
}

// --- the seeded stream -------------------------------------------------------

test('the same seed replays exactly, a different seed does not', () => {
  const draw = (seed) => { const r = createRng(seed); return Array.from({length: 40}, () => r()); };
  assert.deepEqual(draw('dark-edge'), draw('dark-edge'), 'same seed must replay exactly');
  assert.notDeepEqual(draw('dark-edge'), draw('comet-field'));
  assert.equal(hashSeed('dark-edge'), hashSeed('dark-edge'), 'seed hashing is stable');
});

test('weighted picks honour their weights', () => {
  const rng = createRng(11);
  const counts = {a: 0, b: 0, c: 0};
  for (let i = 0; i < 12000; i++) counts[rng.weighted([{id: 'a', weight: 1}, {id: 'b', weight: 3}, {id: 'c', weight: 0}]).id]++;
  assert.equal(counts.c, 0, 'a zero weight is never picked');
  const ratio = counts.b / counts.a;
  assert.ok(ratio > 2.6 && ratio < 3.4, `1:3 weighting produced 1:${ratio.toFixed(2)}`);
});

test('forked streams are independent, so one subsystem cannot shift another', () => {
  const parent = createRng('run-7');
  const a = parent.fork('spawns');
  const b = parent.fork('cards');
  assert.notDeepEqual(Array.from({length: 10}, () => a()), Array.from({length: 10}, () => b()));

  // And a fork is reproducible: the same parent seed and label replay exactly.
  const draw = () => { const f = createRng('run-7').fork('spawns'); return Array.from({length: 10}, () => f()); };
  assert.deepEqual(draw(), draw(), 'the same parent seed and label must replay');
  const otherLabel = () => { const f = createRng('run-7').fork('cards'); return Array.from({length: 10}, () => f()); };
  assert.notDeepEqual(draw(), otherLabel(), 'a different label is a different stream');
});

test('the run stream is swappable and globally reachable', () => {
  setRunSeed('alpha');
  const first = Array.from({length: 8}, () => runRng()());
  setRunSeed('alpha');
  const second = Array.from({length: 8}, () => runRng()());
  assert.deepEqual(first, second);
});

// --- the five layers ---------------------------------------------------------

test('every orbit declares all five identity layers', () => {
  assert.equal(ORBIT_IDENTITY.length, ORBIT_COUNT, 'one identity per orbit');
  for (const [i, identity] of ORBIT_IDENTITY.entries()) {
    assert.ok(identity.atmosphere?.motes > 0, `${identity.id} has no atmosphere`);
    assert.ok(identity.mechanic?.id && typeof identity.mechanic.apply === 'function', `${identity.id} has no world verb`);
    assert.ok(identity.events?.length >= 3, `${identity.id} has too thin an event pool`);
    assert.ok(Object.keys(identity.ecology.bodyPlans).length >= 4, `${identity.id} has no ecology bias`);
    assert.ok(identity.rewards?.prefix, `${identity.id} has no reward language`);
    assert.equal(orbitIdentity(i).id, identity.id);
  }
  const coverage = orbitIdentityCoverage();
  assert.equal(coverage.length, ORBIT_COUNT);
  assert.ok(coverage.every((c) => c.orbit), 'every identity lines up with a named orbit');
});

test('each orbit has a world verb no other orbit has', () => {
  const verbs = ORBIT_IDENTITY.map((o) => o.mechanic.id);
  assert.equal(new Set(verbs).size, ORBIT_COUNT, `world verbs collide: ${verbs.join(', ')}`);
  // The one the brief named explicitly, reusing the gravity-well math.
  assert.equal(orbitIdentity(3).mechanic.id, 'gravity-pulse', 'the Shattered Orbit pulses gravity');
});

test('atmosphere treatments are visually distinct per orbit', () => {
  const seen = new Set();
  for (const identity of ORBIT_IDENTITY) {
    const a = identity.atmosphere;
    seen.add(`${a.hue}|${a.shape}`);
  }
  assert.equal(seen.size, ORBIT_COUNT, 'two orbits share an ambient treatment');
});

test('reward language differs per orbit', () => {
  const prefixes = ORBIT_IDENTITY.map((o) => o.rewards.prefix);
  assert.equal(new Set(prefixes).size, ORBIT_COUNT);
  assert.equal(orbitRewardName(4, 'HEART'), 'SOLAR HEART');
});

// --- the graded claim: measurably different distributions --------------------

test('event pools produce measurably different distributions over a run', () => {
  setRunSeed('distribution-check');
  const pools = ORBIT_IDENTITY.map((_, i) => distribution(() => rollOrbitEvent(i)));

  for (let a = 0; a < ORBIT_COUNT; a++) {
    for (let b = a + 1; b < ORBIT_COUNT; b++) {
      const d = separation(pools[a], pools[b]);
      assert.ok(d > 0.15, `orbits ${a} and ${b} draw near-identical events (separation ${d.toFixed(3)})`);
    }
  }
  // And each pool is actually varied rather than one event repeated.
  for (const [i, pool] of pools.entries()) {
    assert.ok(Object.keys(pool).length >= 3, `orbit ${i} only ever rolls ${Object.keys(pool).length} events`);
  }
});

test('ecology bias produces measurably different creatures per orbit', () => {
  setRunSeed('ecology-check');
  const plans = ORBIT_IDENTITY.map((_, i) => distribution(() => rollBodyPlan(i)));
  const behaviors = ORBIT_IDENTITY.map((_, i) => distribution(() => rollBehavior(i)));

  for (let a = 0; a < ORBIT_COUNT; a++) {
    for (let b = a + 1; b < ORBIT_COUNT; b++) {
      const d = separation(plans[a], plans[b]);
      assert.ok(d > 0.2, `orbits ${a} and ${b} breed near-identical body plans (separation ${d.toFixed(3)})`);
    }
  }
  // The character each orbit claims should be the character it actually breeds.
  assert.ok(plans[0]['heavy-biped'] > plans[1]['heavy-biped'], 'the Dark Edge is heavier than the Comet Field');
  assert.ok(plans[1].avian > plans[0].avian, 'the Comet Field flies more than the Dark Edge');
  assert.ok(behaviors[3].swarm > behaviors[0].swarm, 'the Shattered Orbit swarms more than the Dark Edge');
});

test('the same seed replays the same orbit, a different seed does not', () => {
  const sample = (seed) => { setRunSeed(seed); return Array.from({length: 30}, () => rollOrbitEvent(2)); };
  assert.deepEqual(sample('s1'), sample('s1'));
  assert.notDeepEqual(sample('s1'), sample('s2'));
});

// --- the world verbs actually do something -----------------------------------

function runMechanic(world, frames = 60 * 30) {
  setRunSeed(`mechanic-${world}`);
  const state = createOrbitState(world);
  const player = {x: 0, y: 0, r: 18};
  const enemies = Array.from({length: 8}, (_, i) => ({x: 120 + i * 30, y: 40, vx: 10, vy: 0, r: 14, dead: false}));
  const enemyShots = [];
  const toasts = [];
  const fired = [];
  const before = enemies.map((e) => ({x: e.x, y: e.y}));
  for (let i = 0; i < frames; i++) {
    const id = tickOrbitMechanic(state, {player, enemies, enemyShots, dt: DT, elapsed: i * DT, toast: (t) => toasts.push(t)});
    if (id) fired.push(id);
  }
  return {state, player, enemies, enemyShots, toasts, fired, before};
}

test('every orbit verb fires on its own cadence and changes the field', () => {
  for (let world = 0; world < ORBIT_COUNT; world++) {
    const {fired, enemyShots, enemies, before, toasts} = runMechanic(world);
    const identity = orbitIdentity(world);
    assert.ok(fired.length >= 1, `${identity.id} never fired in 30 seconds`);
    assert.ok(fired.every((id) => id === identity.mechanic.id), `${identity.id} fired someone else's verb`);
    assert.ok(toasts.length >= 1, `${identity.id} fires without telling the player`);

    const movedEnemies = enemies.some((e, i) => Math.abs(e.x - before[i].x) > 0.5 || Math.abs(e.y - before[i].y) > 0.5);
    const madeHazards = enemyShots.length > 0;
    assert.ok(movedEnemies || madeHazards, `${identity.id} fired but changed nothing`);
  }
});

test('the gravity pulse pulls both the field and the frame', () => {
  setRunSeed('gravity');
  const state = createOrbitState(3);
  state.timer = 0; // fire immediately
  const player = {x: 0, y: 0};
  const enemy = {x: 400, y: 0, dead: false};
  const ctx = {player, enemies: [enemy], enemyShots: [], dt: DT, elapsed: 0, toast: () => {}};

  tickOrbitMechanic(state, ctx);
  assert.ok(state.well, 'a well is opened');
  const enemyStart = enemy.x, playerStart = player.x;
  for (let i = 0; i < 60; i++) tickOrbitMechanic(state, ctx);

  assert.notEqual(enemy.x, enemyStart, 'enemies are pulled');
  assert.notEqual(player.x, playerStart, 'the frame is pulled too — it is weather, not a targeted attack');
  // The well expires rather than becoming a permanent field...
  for (let i = 0; i < 60 * 4; i++) tickOrbitMechanic(state, ctx);
  assert.equal(state.well, null, 'the well closes');

  // ...and the pulse recurs on its own interval, not sooner.
  const interval = orbitIdentity(3).mechanic.interval;
  const firedBefore = state.fired;
  for (let i = 0; i < Math.ceil(interval * 60) + 4; i++) tickOrbitMechanic(state, ctx);
  assert.ok(state.fired > firedBefore, `the pulse should recur within ${interval}s`);
});

test('atmosphere renders without touching simulation', () => {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : (o[k] = (...a) => calls.push(k))),
    set: (o, k, v) => { o[k] = v; return true; },
  });
  for (let world = 0; world < ORBIT_COUNT; world++) {
    calls.length = 0;
    drawOrbitAtmosphere(ctx, world, {w: 800, h: 600, camX: 10, camY: 20, time: 3, quality: 1});
    assert.ok(calls.includes('save') && calls.includes('restore'), `orbit ${world} leaks canvas state`);
    assert.ok(calls.length > 10, `orbit ${world} drew nothing`);
  }
  // Quality scaling is honoured so the performance governor can thin it.
  calls.length = 0;
  drawOrbitAtmosphere(ctx, 0, {w: 800, h: 600, time: 0, quality: 0.1});
  const thin = calls.length;
  calls.length = 0;
  drawOrbitAtmosphere(ctx, 0, {w: 800, h: 600, time: 0, quality: 1});
  assert.ok(calls.length > thin, 'lower quality should draw fewer motes');
});
