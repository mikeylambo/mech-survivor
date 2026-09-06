// Commander certification.
//
// The contract being tested is that a commander RESPONDS to broad build
// pressure and never hard-counters it. That splits into three things worth
// proving: the classifier reads the build the way the spec says, the response
// table can never switch a build off, and the commander actually behaves
// differently for different builds.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARSENAL_FAMILIES} from './public/arsenal.js';
import {
  ARCHETYPES,
  SUPER_BUCKETS,
  FAMILY_ARCHETYPES,
  RESPONSES,
  NEUTRAL_PROFILE,
  DOCTRINE_LIMITS,
  SECONDARY_WEIGHT,
  PYLON_DAMAGE_SHARE,
  ANTI_SUMMON_CLEAR_SHARE,
  archetypeScores,
  bucketScores,
  blendProfiles,
  resolveCommanderDoctrine,
  doctrineLabel,
} from './public/commander-doctrine.js';
import {tickBossRuntime, applyCommanderDamage, commanderControlResist, commanderDamageScale} from './public/boss-runtime.js';

const frame = (arsenal) => ({x: 0, y: 0, arsenal});
const at = (tier, evo = 0, branch = null) => ({tier, evo, branch});

// --- classifier --------------------------------------------------------------

test('every arsenal family carries a valid archetype tag', () => {
  assert.equal(ARSENAL_FAMILIES.length, 30);
  for (const family of ARSENAL_FAMILIES) {
    const tags = FAMILY_ARCHETYPES[family.id];
    assert.ok(tags, `${family.id} has no archetype tag`);
    assert.ok(ARCHETYPES.includes(tags.primary), `${family.id} primary ${tags.primary} is not an archetype`);
    if (tags.secondary) {
      assert.ok(ARCHETYPES.includes(tags.secondary), `${family.id} secondary ${tags.secondary} is not an archetype`);
      assert.notEqual(tags.secondary, tags.primary, `${family.id} tags itself twice`);
    }
  }
  assert.equal(Object.keys(FAMILY_ARCHETYPES).length, 30, 'no tags for families that do not exist');
});

test('every archetype is reachable and every one has a response', () => {
  for (const archetype of ARCHETYPES) {
    const owners = Object.entries(FAMILY_ARCHETYPES).filter(([, t]) => t.primary === archetype);
    assert.ok(owners.length > 0, `${archetype} is not the primary tag of any family`);
    assert.ok(RESPONSES[archetype], `${archetype} has no authored response`);
  }
});

test('the super-buckets partition the archetypes exactly once each', () => {
  const members = Object.values(SUPER_BUCKETS).flat();
  assert.equal(members.length, ARCHETYPES.length, 'buckets do not cover the archetypes exactly');
  assert.deepEqual([...members].sort(), [...ARCHETYPES].sort());
});

test('score is tier level times weight, summed across owned families', () => {
  // rail is SIEGE primary + PRECISION secondary; familyPower is tier + evo*1.5.
  const scores = archetypeScores(frame({rail: at(3)}));
  assert.equal(scores.SIEGE, 3);
  assert.equal(scores.PRECISION, 3 * SECONDARY_WEIGHT);
  assert.equal(scores.CLOSE, 0);

  // An evolved family weighs more, and contributions add up.
  const heavier = archetypeScores(frame({rail: at(4, 2), mortar: at(2)}));
  assert.equal(heavier.SIEGE, 4 + 2 * 1.5 + 2);
  assert.equal(heavier.AOE_SWARM, 2 * SECONDARY_WEIGHT);
});

test('unowned and unknown families contribute nothing', () => {
  const scores = archetypeScores(frame({rail: at(0), nonsense: at(9)}));
  for (const archetype of ARCHETYPES) assert.equal(scores[archetype], 0, `${archetype} scored from nothing`);
});

test('bucket scores collapse their members', () => {
  const scores = archetypeScores(frame({rail: at(3), drill: at(2)}));
  const buckets = bucketScores(scores);
  assert.equal(buckets.RANGED, scores.PRECISION + scores.SIEGE + scores.TEMPORAL);
  assert.equal(buckets.CLOSE, scores.CLOSE + scores.MOBILE);
  assert.equal(buckets.CONTROL, scores.CONTROL + scores.SUMMON + scores.AOE_SWARM);
});

// --- resolution --------------------------------------------------------------

test('a clear leader answers alone; a close race blends the top two', () => {
  // Overwhelmingly ranged: nothing else comes close.
  const ranged = resolveCommanderDoctrine(frame({rail: at(6), missile: at(5), beam: at(4)}), {mode: 'buckets'});
  assert.equal(ranged.primary, 'RANGED');
  assert.equal(ranged.blended, false, 'a dominant build should get one response set');
  assert.equal(ranged.secondary, null);

  // Deliberately split down the middle: the lead is inside the margin.
  const split = resolveCommanderDoctrine(frame({rail: at(4), drill: at(4), orbit: at(2)}), {mode: 'buckets'});
  assert.ok(split.lead < split.margin, `lead ${split.lead} should be inside the ${split.margin} margin`);
  assert.equal(split.blended, true, 'a split build should get a blended response');
  assert.ok(split.secondary && split.secondary !== split.primary);
});

test('the margin is a relative lead and is configurable', () => {
  // Calibrate against the build's own lead rather than hand-tuned numbers, so
  // the test still means something if a family is ever re-tagged.
  const build = frame({rail: at(5), drill: at(4)});
  const measured = resolveCommanderDoctrine(build, {mode: 'buckets'});
  assert.ok(Number.isFinite(measured.lead) && measured.lead > 0, 'this fixture should have a finite lead');

  const below = resolveCommanderDoctrine(build, {mode: 'buckets', margin: measured.lead * 0.5});
  const above = resolveCommanderDoctrine(build, {mode: 'buckets', margin: measured.lead * 1.5});
  assert.equal(below.blended, false, 'a lead past the margin answers alone');
  assert.equal(above.blended, true, 'a lead inside the margin blends the top two');
  assert.equal(above.primary, below.primary, 'the leader does not change with the margin');
});

test('the full eight-archetype mode resolves too', () => {
  const doctrine = resolveCommanderDoctrine(frame({graviton: at(5), plasma: at(4)}), {mode: 'archetypes'});
  assert.equal(doctrine.mode, 'archetypes');
  assert.equal(doctrine.primary, 'CONTROL');
  assert.ok(doctrine.profile.lockdownResist > 0, 'a CONTROL commander should resist lockdown');
});

test('a build with no arsenal still gets a commander with a real window', () => {
  const doctrine = resolveCommanderDoctrine(frame({}), {mode: 'buckets'});
  assert.equal(doctrine.primary, null);
  assert.deepEqual(doctrine.profile, NEUTRAL_PROFILE);
  assert.ok(doctrine.profile.exposedWindow >= DOCTRINE_LIMITS.minExposedWindow);
  assert.equal(doctrineLabel(doctrine), 'ADAPTIVE DOCTRINE');
});

test('blending is a weighted average of the two profiles', () => {
  const a = {...NEUTRAL_PROFILE, vulnerability: 2, exposedWindow: 4};
  const b = {...NEUTRAL_PROFILE, vulnerability: 1, exposedWindow: 2};
  const mixed = blendProfiles(a, b, 0.25);
  assert.equal(mixed.vulnerability, 1.25);
  assert.equal(mixed.exposedWindow, 2.5);
  assert.deepEqual(Object.keys(mixed).sort(), Object.keys(NEUTRAL_PROFILE).sort(), 'a blend keeps the full key set');
});

// --- fairness ----------------------------------------------------------------

function assertFair(profile, label) {
  assert.ok(profile.lockdownResist <= DOCTRINE_LIMITS.maxLockdownResist, `${label} resists control too hard`);
  assert.ok(profile.exposedWindow >= DOCTRINE_LIMITS.minExposedWindow, `${label} never opens a readable window`);
  assert.ok(profile.vulnerability >= DOCTRINE_LIMITS.minVulnerability, `${label} does not pay out for taking the window`);
  if (profile.antiSummonInterval > 0) {
    assert.ok(profile.antiSummonInterval >= DOCTRINE_LIMITS.minAntiSummonInterval, `${label} pressures summons constantly`);
  }
}

test('no single response can switch a build off', () => {
  for (const archetype of ARCHETYPES) {
    assertFair({...NEUTRAL_PROFILE, ...RESPONSES[archetype]}, archetype);
  }
});

test('no blend of two responses can switch a build off either', () => {
  for (const a of ARCHETYPES) {
    for (const b of ARCHETYPES) {
      const profile = blendProfiles({...NEUTRAL_PROFILE, ...RESPONSES[a]}, {...NEUTRAL_PROFILE, ...RESPONSES[b]}, 0.5);
      assertFair(profile, `${a}+${b}`);
    }
  }
});

test('the fairness constants themselves stay inside their limits', () => {
  assert.ok(PYLON_DAMAGE_SHARE >= DOCTRINE_LIMITS.minPylonDamageShare, 'pylons must gate damage, never stop it');
  assert.ok(ANTI_SUMMON_CLEAR_SHARE <= DOCTRINE_LIMITS.maxAntiSummonClearShare, 'an anti-summon pulse must not wipe the field');
});

test('control tools always move the core', () => {
  for (const archetype of ARCHETYPES) {
    const boss = {_doctrine: {profile: {...NEUTRAL_PROFILE, ...RESPONSES[archetype]}}};
    const share = commanderControlResist(boss);
    assert.ok(share > 0, `${archetype} makes the core completely immovable`);
    assert.ok(share >= 1 - DOCTRINE_LIMITS.maxLockdownResist - 1e-9, `${archetype} resists past the limit`);
  }
  assert.equal(commanderControlResist({}), 1, 'an ordinary enemy resists nothing');
});

// --- runtime -----------------------------------------------------------------

function makeBoss() {
  return {t: 'boss', dead: false, x: 300, y: 0, r: 40, hp: 4000, maxHp: 4000, damage: 20, bossPhases: [0.75, 0.5, 0.25]};
}

function makeContext(player, boss, overrides = {}) {
  const enemies = [boss];
  return {
    world: 0,
    enemies,
    enemyShots: [],
    shots: [],
    player,
    dt: 1 / 60,
    elapsed: 0,
    spawnEnemy: () => { enemies.push({t: 'add', dead: false, x: 0, y: 0, r: 12, hp: 40, maxHp: 40}); },
    damageEnemy: () => false,
    burst: () => {},
    toast: () => {},
    doctrineOptions: {mode: 'archetypes'},
    ...overrides,
  };
}

/** Run the commander for `seconds` and collect what it did. */
function runCommander(player, seconds, overrides = {}) {
  const boss = makeBoss();
  const ctx = makeContext(player, boss, overrides);
  const events = [];
  let exposedFrames = 0;
  for (let i = 0; i < Math.round(seconds * 60); i++) {
    ctx.elapsed = i / 60;
    const result = tickBossRuntime(ctx);
    if (result?.state?.event) events.push(result.state.event);
    if (result?.state?.exposed) exposedFrames++;
  }
  return {boss, ctx, events, exposedFrames, shots: ctx.enemyShots.length, adds: ctx.enemies.length - 1};
}

test('the build is read once, at spawn, and never again mid-fight', () => {
  const player = frame({rail: at(6)});
  const boss = makeBoss();
  const ctx = makeContext(player, boss);
  tickBossRuntime(ctx);
  const resolved = boss._doctrine;
  assert.ok(resolved);
  assert.equal(resolved.primary, 'SIEGE');

  // The player completely rebuilds mid-fight. The commander must not notice.
  player.arsenal = {drill: at(6), orbit: at(6), slash: at(6)};
  for (let i = 0; i < 600; i++) { ctx.elapsed = i / 60; tickBossRuntime(ctx); }

  assert.equal(boss._doctrine, resolved, 'the doctrine object was replaced mid-fight');
  assert.equal(boss._doctrine.primary, 'SIEGE', 'the commander re-read the build mid-fight');
});

test('a doctrine resolved at spawn is respected rather than recomputed', () => {
  const boss = makeBoss();
  boss._doctrine = resolveCommanderDoctrine(frame({temporal: at(6)}), {mode: 'archetypes'});
  const ctx = makeContext(frame({rail: at(6)}), boss);
  tickBossRuntime(ctx);
  assert.equal(boss._doctrine.primary, 'TEMPORAL', 'the pre-resolved doctrine was overwritten');
});

test('every archetype opens a window to ordinary play within 25 seconds', () => {
  // The fairness claim end to end: whatever the build, the commander it summons
  // becomes takeable by doing the ordinary things a run does — shooting the
  // commander and clearing what it puts on the field. A response that never
  // opened under that pressure would be a hard counter.
  for (const archetype of ARCHETYPES) {
    const boss = makeBoss();
    const base = resolveCommanderDoctrine(frame({}), {mode: 'archetypes'});
    boss._doctrine = {...base, primary: archetype, profile: {...NEUTRAL_PROFILE, ...RESPONSES[archetype]}};
    const ctx = makeContext(frame({}), boss);
    let opened = false;
    for (let i = 0; i < 60 * 25 && !opened; i++) {
      ctx.elapsed = i / 60;
      applyCommanderDamage(boss, 12);
      // Whatever the commander puts on the field, the player clears it.
      for (const e of ctx.enemies) if (e !== boss && !e.dead) e.dead = true;
      const result = tickBossRuntime(ctx);
      if (result?.state?.exposed) opened = true;
    }
    assert.ok(opened, `${archetype} never opened a window in 25 seconds of ordinary play`);
  }
});

test('clearing a summon commander\'s pylons is what opens it', () => {
  const boss = makeBoss();
  boss._doctrine = resolveCommanderDoctrine(frame({drone: at(6), funnels: at(5)}), {mode: 'archetypes'});
  assert.equal(boss._doctrine.primary, 'SUMMON');
  const ctx = makeContext(frame({}), boss);

  tickBossRuntime(ctx);
  const pylons = ctx.enemies.filter((e) => e._pylonOf === boss);
  assert.equal(pylons.length, boss._doctrine.profile.pylons, 'the multi-point mechanic should be placed');

  // Standing pylons gate damage without stopping it.
  const gated = commanderDamageScale(boss);
  assert.ok(gated < 1 && gated >= DOCTRINE_LIMITS.minPylonDamageShare, `pylons gated damage to ${gated}`);

  for (let i = 0; i < 60 && !(boss._exposed > 0); i++) { ctx.elapsed = i / 60; tickBossRuntime(ctx); }
  assert.ok(!(boss._exposed > 0), 'the core should not open while its pylons stand');

  for (const p of pylons) p.dead = true;
  tickBossRuntime(ctx);
  assert.ok(boss._exposed > 0, 'clearing the pylons should open the core');
});

test('different builds get materially different commanders', () => {
  const siege = runCommander(frame({rail: at(6), missile: at(5), mortar: at(4)}), 24);
  const close = runCommander(frame({drill: at(6), orbit: at(5), slash: at(4)}), 24);
  const swarm = runCommander(frame({cluster: at(6), nova: at(5), death: at(4)}), 24);

  assert.equal(siege.boss._doctrine.primary, 'SIEGE');
  assert.equal(close.boss._doctrine.primary, 'CLOSE');
  assert.equal(swarm.boss._doctrine.primary, 'AOE_SWARM');

  // Each answers with its own signature rather than a reskin of the same fight.
  assert.ok(siege.events.includes('DISPLACE'), 'a siege build should be answered with displacement');
  assert.ok(close.events.includes('RING'), 'a close build should be answered with an outer ring');
  assert.ok(swarm.adds > close.adds, 'a swarm build should be answered with formations');

  assert.ok(!close.events.includes('DISPLACE'), 'the close response should not borrow displacement');
  assert.ok(!siege.events.includes('RING'), 'the siege response should not borrow the outer ring');
});

test('vulnerability multiplies damage only while the window is open', () => {
  const boss = makeBoss();
  boss._doctrine = resolveCommanderDoctrine(frame({rail: at(6)}), {mode: 'archetypes'});
  assert.equal(commanderDamageScale(boss), 1, 'a closed commander takes ordinary damage');

  boss._exposed = 1;
  const open = commanderDamageScale(boss);
  assert.ok(open > 1, 'an open commander takes more');
  assert.equal(open, boss._doctrine.profile.vulnerability);

  boss._exposed = 0;
  assert.equal(commanderDamageScale(boss), 1, 'the window closes again');
  assert.equal(applyCommanderDamage({}, 10), 10, 'ordinary enemies are untouched');
});

test('precision plates convert aimed damage into an execution window', () => {
  const boss = makeBoss();
  boss._doctrine = resolveCommanderDoctrine(frame({mark: at(6), hunter: at(5)}), {mode: 'archetypes'});
  assert.equal(boss._doctrine.primary, 'PRECISION');
  const ctx = makeContext(frame({}), boss);
  tickBossRuntime(ctx);

  const plates = boss._plates;
  assert.ok(plates > 0, 'a precision commander should carry break plates');

  // Chip the first plate off.
  for (let i = 0; i < 200 && boss._plates === plates; i++) applyCommanderDamage(boss, 40);
  assert.equal(boss._plates, plates - 1, 'sustained aimed damage should break a plate');
  assert.ok(boss._exposed > 0, 'breaking a plate should open a window');
});

test('control pressure breaks the core instead of being resisted away', () => {
  const boss = makeBoss();
  boss._doctrine = resolveCommanderDoctrine(frame({graviton: at(6), plasma: at(5), mine: at(4)}), {mode: 'archetypes'});
  assert.equal(boss._doctrine.primary, 'CONTROL');
  assert.ok(commanderControlResist(boss) > 0, 'control still moves the core');

  let broke = false;
  for (let i = 0; i < 400 && !broke; i++) {
    applyCommanderDamage(boss, 30);
    if (boss._exposed > 0) broke = true;
  }
  assert.ok(broke, 'sustained pressure should convert into a break');
});

test('anti-summon pressure thins autonomous units without erasing them', () => {
  const player = frame({drone: at(6), funnels: at(5), sentry: at(4)});
  const boss = makeBoss();
  const ctx = makeContext(player, boss);
  ctx.shots = Array.from({length: 40}, () => ({kind: 'drone', dead: false}));
  tickBossRuntime(ctx);
  assert.equal(boss._doctrine.primary, 'SUMMON');

  const interval = boss._doctrine.profile.antiSummonInterval;
  for (let i = 0; i < Math.round(interval * 60) + 4; i++) { ctx.elapsed = i / 60; tickBossRuntime(ctx); }

  const alive = ctx.shots.filter((s) => !s.dead).length;
  assert.ok(alive < 40, 'the pulse should have thinned the swarm');
  assert.ok(alive >= 40 * (1 - ANTI_SUMMON_CLEAR_SHARE) - 1, `the pulse cleared too many (${40 - alive} of 40)`);
});

test('control families still move a resisting commander, just less', async () => {
  const {tickArsenal} = await import('./public/arsenal-runtime.js');

  // Inside the well's radius, and run enough frames for its timer to fire.
  const START = 90;
  const push = (controlResist) => {
    const target = {x: START, y: 0, r: 14, hp: 999, dead: false, controlResist};
    const player = {x: 0, y: 0, kills: 0, arsenal: {graviton: at(5)}, configurations: new Set()};
    // Seed the family's own timer so both runs fire on exactly the same ticks;
    // it is otherwise randomised per player and the comparison would be noisy.
    player._arsenalRt = {graviton: 0};
    const ctx = {enemies: [target], shots: [], enemyShots: [], damageEnemy: () => false, elapsed: 0};
    for (let i = 0; i < 30; i++) tickArsenal(player, 1 / 60, ctx);
    return START - target.x;
  };

  const free = push(0);
  const resisted = push(DOCTRINE_LIMITS.maxLockdownResist);
  assert.ok(free > 0, 'a graviton pulls an ordinary enemy');
  assert.ok(resisted > 0, 'and still pulls a commander that resists');
  assert.ok(resisted < free, 'a resisting commander is simply harder to move');
  assert.ok(resisted / free >= 1 - DOCTRINE_LIMITS.maxLockdownResist - 1e-9, 'and never past the fairness limit');
});

test('the built runtime actually wires the commander in', () => {
  // pass-u runs last in the chain and its anchors are checked at build time,
  // but the point of the pass is the behaviour it installs — assert the wiring
  // exists in the shipped file rather than trusting the pass ran.
  const source = readFileSync(new URL('./public/game.js', import.meta.url), 'utf8');
  for (const [token, what] of [
    ["from './commander-doctrine.js'", 'doctrine module'],
    ["from './commander-ceremony.js'", 'ceremony module'],
    ['resolveCommanderDoctrine(player,COMMANDER_DOCTRINE)', 'doctrine resolved at spawn'],
    ['beginCommanderCeremony(commanderCeremony', 'arrival ceremony'],
    ['applyCommanderDamage(e,d)', 'vulnerability applied to damage'],
    ['onPhaseBreak:', 'phase break feedback'],
    ['resolveCommanderCeremony(commanderCeremony)', 'death resolves the world'],
    ['drawCommanderTells(ctx,e,elapsed,palette)', 'vulnerability is drawn'],
    ['commanderCam', 'camera pull-back'],
  ]) {
    assert.ok(source.includes(token), `${what} is missing from the built runtime`);
  }

  // Resolution must happen at spawn, in the spawn block — not per frame.
  assert.equal(source.split('resolveCommanderDoctrine(player').length - 1, 1, 'doctrine should be resolved in exactly one place');
  const spawnAt = source.indexOf('finalBossSpawned=true');
  const resolveAt = source.indexOf('resolveCommanderDoctrine(player,COMMANDER_DOCTRINE)');
  assert.ok(resolveAt > spawnAt && resolveAt - spawnAt < 400, 'the doctrine is resolved in the commander spawn block');
});
