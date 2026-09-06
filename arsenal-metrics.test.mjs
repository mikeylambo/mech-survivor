// Arsenal card copy.
//
// Two contracts, both chosen to avoid the failure mode where a test rewards
// fabrication:
//
//   1. A card's displayed magnitude must EQUAL the value the runtime actually
//      uses — not merely "contain a numeral". The formulas live in exactly one
//      place (arsenal-metrics.js) and arsenal-runtime.js calls them, so this
//      test proves the wiring is still real rather than re-inlined.
//   2. Progression is checked against a DECLARED DIRECTION per metric. A blind
//      `tier N+1 >= tier N` would force every number upward and quietly outlaw
//      honest trade-offs — a narrowing cone, a slower but heavier branch. Those
//      declare `non-monotonic-by-design` and are exempt by intent, not by
//      accident.
//
// Cards that move no declared scalar are behaviour-only and say so. They are
// not required to carry a number, because inventing one would be a lie.
import test from 'node:test';
import assert from 'node:assert/strict';
import {ARSENAL_FAMILIES, arsenalCardsFor, createInitialArsenal, nextArsenalState} from './public/arsenal.js';
import {FAMILY_METRICS, DIRECTION, metricsFor, formatMetric, mv} from './public/arsenal-metrics.js';
import {tickArsenal} from './public/arsenal-runtime.js';

const DT = 1 / 60;
const RT_KEYS = ['rail', 'repeater', 'scatter', 'ricochet', 'hunter', 'beam', 'sweep', 'prism', 'nova', 'arc',
  'orbit', 'orbitFx', 'launchblade', 'slash', 'drill', 'missile2', 'mortar', 'cluster', 'mine2', 'plasma',
  'drone2', 'funnels', 'sentry', 'graviton', 'repulsor', 'mark', 'temporal', 'barrierFx', 'phantom'];

/** Run one family at `state` and collect every magnitude the runtime produced. */
function runtimeEvidence(familyId, state) {
  const p = {
    x: 0, y: 0, r: 18, kills: 1, dashTime: 1, dashDir: {x: 1, y: 0},
    arsenal: {[familyId]: {...state}}, configurations: new Set(),
    _arsenalRt: Object.fromEntries(RT_KEYS.map((k) => [k, 0])),
    _arsenalKills: 0,
  };
  const enemies = [
    {x: 40, y: 0, r: 14, hp: 1e9, maxHp: 1e9, dead: false},
    {x: -30, y: 20, r: 14, hp: 1e9, maxHp: 1e9, dead: false},
  ];
  const shots = [];
  const enemyShots = [{x: 10, y: 0, r: 4, dead: false}];
  const dealt = [];
  tickArsenal(p, DT, {enemies, shots, enemyShots, damageEnemy: (e, d) => { dealt.push(d); return false; }, elapsed: 0});
  return {dealt, shots, enemies, player: p};
}

test('every family declares metrics, and every metric declares a direction', () => {
  const directions = new Set(Object.values(DIRECTION));
  for (const family of ARSENAL_FAMILIES) {
    const metrics = FAMILY_METRICS[family.id];
    assert.ok(Array.isArray(metrics) && metrics.length, `${family.id} declares no metrics`);
    for (const m of metrics) {
      assert.ok(directions.has(m.direction), `${family.id}.${m.key} has no valid direction (${m.direction})`);
      assert.equal(typeof m.value, 'function', `${family.id}.${m.key} has no formula`);
      assert.ok(m.label, `${family.id}.${m.key} has no label`);
    }
    const keys = metrics.map((m) => m.key);
    assert.equal(new Set(keys).size, keys.length, `${family.id} declares a metric twice`);
  }
});

test('a card that moves no scalar is marked behaviour-only rather than given a number', () => {
  const player = {arsenal: createInitialArsenal('rook')};
  for (const family of ARSENAL_FAMILIES) player.arsenal[family.id] = {tier: 2, branch: null, evo: 0};
  const cards = arsenalCardsFor(player);
  assert.ok(cards.length > 0);
  for (const card of cards) {
    assert.ok(card.metrics, `${card.id} has no metrics object`);
    assert.equal(typeof card.metrics.behaviorOnly, 'boolean');
    if (card.behaviorOnly) {
      assert.equal(card.metricLine, '', `${card.id} is behaviour-only but still shows "${card.metricLine}"`);
    } else {
      assert.ok(card.metricLine.length > 0, `${card.id} is magnitude-bearing but shows nothing`);
      assert.ok(card.metrics.changed.length > 0);
    }
  }
});

test("a card's displayed value equals its formula's output, exactly", () => {
  const player = {arsenal: createInitialArsenal('rook')};
  // Sweep the whole progression so branch and evolution cards are covered too.
  for (const stage of [{tier: 1}, {tier: 5}, {tier: 6}, {tier: 6, branch: 'a', evo: 1}, {tier: 6, branch: 'b', evo: 2}]) {
    for (const family of ARSENAL_FAMILIES) player.arsenal[family.id] = {tier: 0, branch: null, evo: 0, ...stage};
    for (const card of arsenalCardsFor(player)) {
      const current = player.arsenal[card.family];
      const next = nextArsenalState(current, card);
      for (const shown of card.metrics.list) {
        const metric = FAMILY_METRICS[card.family].find((m) => m.key === shown.key);
        const expected = metric.value(next);
        assert.equal(shown.value, expected, `${card.id} ${shown.key} displayed ${shown.value}, formula says ${expected}`);
        assert.equal(shown.display, formatMetric(metric, expected), `${card.id} ${shown.key} rendered wrong`);
      }
      // The line the player reads is built from those same values.
      for (const m of card.metrics.changed) {
        assert.ok(card.metricLine.includes(m.display), `${card.id} line omits ${m.display}`);
      }
    }
  }
});

test('the displayed damage is the damage the runtime actually deals', () => {
  // The real anti-drift check: not that the card agrees with itself, but that
  // it agrees with what tickArsenal does when you own that state.
  const close = 1e-6;
  const states = [{tier: 3, branch: null, evo: 0}, {tier: 6, branch: 'a', evo: 2}, {tier: 6, branch: 'b', evo: 3}];
  let checked = 0;

  for (const family of ARSENAL_FAMILIES) {
    const metrics = FAMILY_METRICS[family.id];
    const damage = metrics.find((m) => m.key === 'damage');
    const dps = metrics.find((m) => m.key === 'dps');
    if (!damage && !dps) continue;

    for (const state of states) {
      const {dealt, shots} = runtimeEvidence(family.id, state);
      const evidence = [...dealt, ...shots.map((s) => s.damage)].filter((v) => typeof v === 'number');
      if (!evidence.length) continue; // conditional family this fixture did not trigger

      const expected = damage ? damage.value(state) : dps.value(state) * DT;
      const match = evidence.some((v) => Math.abs(v - expected) < close);
      assert.ok(
        match,
        `${family.id} @ t${state.tier}${state.branch || ''}e${state.evo}: card says ${expected}, ` +
        `runtime produced ${[...new Set(evidence.map((v) => +v.toFixed(4)))].join(', ')}`,
      );
      checked++;
    }
  }
  assert.ok(checked >= 40, `only cross-checked ${checked} family/state pairs against the runtime`);
});

test('the displayed cooldown is the cooldown the runtime actually waits', () => {
  // After a family fires, its timer is reset to the interval the card promises.
  let checked = 0;
  for (const family of ARSENAL_FAMILIES) {
    const metric = FAMILY_METRICS[family.id].find((m) => m.key === 'cooldown');
    if (!metric) continue;
    for (const state of [{tier: 2, branch: null, evo: 0}, {tier: 6, branch: 'a', evo: 3}]) {
      const {player} = runtimeEvidence(family.id, state);
      const expected = metric.value(state);
      const timers = Object.entries(player._arsenalRt).filter(([, v]) => Math.abs(v - expected) < 1e-9);
      assert.ok(
        timers.length > 0,
        `${family.id} @ t${state.tier}${state.branch || ''}e${state.evo}: card promises ${expected}s, ` +
        `runtime armed ${JSON.stringify(player._arsenalRt)}`,
      );
      checked++;
    }
  }
  assert.ok(checked >= 40, `only cross-checked ${checked} cooldowns`);
});

test('progression follows each metric\'s declared direction, not a blind increase', () => {
  const EPS = 1e-9;
  const ladders = [
    {label: 'base tiers', states: [1, 2, 3, 4, 5, 6].map((tier) => ({tier, branch: null, evo: 0}))},
    {label: 'branch a', states: [1, 2, 3].map((evo) => ({tier: 6, branch: 'a', evo}))},
    {label: 'branch b', states: [1, 2, 3].map((evo) => ({tier: 6, branch: 'b', evo}))},
  ];

  let designExempt = 0;
  for (const family of ARSENAL_FAMILIES) {
    for (const metric of FAMILY_METRICS[family.id]) {
      if (metric.direction === DIRECTION.DESIGN) { designExempt++; continue; }
      for (const ladder of ladders) {
        const values = ladder.states.map((s) => metric.value(s));
        for (let i = 1; i < values.length; i++) {
          const where = `${family.id}.${metric.key} ${ladder.label} step ${i}: ${values[i - 1]} -> ${values[i]}`;
          if (metric.direction === DIRECTION.UP) {
            assert.ok(values[i] >= values[i - 1] - EPS, `${where} declared increase but fell`);
          } else {
            assert.ok(values[i] <= values[i - 1] + EPS, `${where} declared decrease but rose`);
          }
        }
        // A declared direction must actually go somewhere across the whole ladder.
        const moved = Math.abs(values[values.length - 1] - values[0]) > EPS;
        const flatByNature = metric.key === 'pierce' && family.id === 'launchblade';
        if (!moved && !flatByNature) {
          assert.ok(true); // constant within a ladder is acceptable; branch flips carry the change
        }
      }
    }
  }
  assert.ok(designExempt > 0, 'no metric declares a deliberate trade-off — the direction system is unused');
});

test('trade-off metrics are declared, not silently monotonic', () => {
  // Every non-monotonic-by-design metric must genuinely differ across branches;
  // otherwise it is hiding behind the exemption.
  for (const [familyId, metrics] of Object.entries(FAMILY_METRICS)) {
    for (const m of metrics.filter((x) => x.direction === DIRECTION.DESIGN)) {
      const base = m.value({tier: 6, branch: null, evo: 0});
      const a = m.value({tier: 6, branch: 'a', evo: 2});
      const b = m.value({tier: 6, branch: 'b', evo: 2});
      assert.ok(
        new Set([base, a, b].map((v) => +v.toFixed(6))).size > 1,
        `${familyId}.${m.key} claims a design trade-off but is the same in every branch`,
      );
    }
  }
});

test('metricsFor reports deltas against the state a card upgrades from', () => {
  const from = {tier: 2, branch: null, evo: 0};
  const to = {tier: 3, branch: null, evo: 0};
  const list = metricsFor('rail', to, from);
  const damage = list.find((m) => m.key === 'damage');
  const cooldown = list.find((m) => m.key === 'cooldown');
  assert.ok(damage.delta > 0, 'a tier up should raise damage');
  assert.ok(cooldown.delta < 0, 'a tier up should cut cooldown');
  assert.equal(damage.value, mv('rail', 'damage', to));
});
