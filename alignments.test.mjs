// Alignments and Eclipses.
//
// The audit that started this found 9 of 60 with a real mechanical branch, 0
// partial, and 51 that did nothing at all. So the contract is deliberately
// blunt: EVERY id in the shipped list must produce an observable change, and
// for anything routed through a weapon modifier that means the RUNTIME's
// output has to move — not just a number in a table. A modifier nothing reads
// is the same bug in a nicer costume.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ALL_BLESSINGS, BLESSINGS, CORRUPTED_BLESSINGS} from './public/content-v1.js';
import {
  ALIGNMENT_EFFECTS, REWRITTEN_COPY, CUT, MERGED,
  applyAlignment, tickAlignments, onAlignmentKill, alignmentDamageScale,
  createAlignmentMods, effectTextFor, infectingAlignments,
} from './public/alignment-effects.js';
import {tickArsenal} from './public/arsenal-runtime.js';
import {ARSENAL_BY_ID} from './public/arsenal.js';

const DT = 1 / 60;
const RT_KEYS = ['rail', 'repeater', 'scatter', 'ricochet', 'hunter', 'beam', 'sweep', 'prism', 'nova', 'arc',
  'orbit', 'orbitFx', 'launchblade', 'slash', 'drill', 'missile2', 'mortar', 'cluster', 'mine2', 'plasma',
  'drone2', 'funnels', 'sentry', 'graviton', 'repulsor', 'mark', 'temporal', 'barrierFx', 'phantom'];

function freshPlayer(arsenal = {}) {
  return {
    x: 0, y: 0, r: 18, hp: 100, maxHp: 100, damage: 10, rate: 0.48, speed: 235,
    armor: 0, crit: 0, magnet: 100, regen: 0, xpBoost: 0, coinBoost: 0, areaBoost: 0,
    corruption: 0, kills: 0, dashTime: 1, dashDir: {x: 1, y: 0},
    arsenal, configurations: new Set(), blessings: new Set(),
    mods: createAlignmentMods(), _arsenalRt: Object.fromEntries(RT_KEYS.map((k) => [k, 0])), _arsenalKills: 0,
  };
}

/**
 * Everything the arsenal runtime produced for a given player, as a string.
 *
 * The fixture has to be generous enough that every family can actually fire:
 * the Death Reactor only triggers on kills since the last tick, plasma's only
 * modifier is the lifetime of the zone it leaves, and the interceptor only
 * reacts to enemy fire inside its radius. A stingy fixture would report those
 * as "nothing reads this" when the real answer is "the test never ran it".
 */
function runtimeFingerprint(player) {
  const enemies = [
    {x: 40, y: 0, r: 14, hp: 1e9, maxHp: 1e9, dead: false},
    {x: -30, y: 20, r: 14, hp: 1e9, maxHp: 1e9, dead: false},
  ];
  const shots = [];
  // Ordered FURTHEST FIRST on purpose: the interceptor stops at the first shot
  // inside its radius, so a nearby shot at the head of the list would mask any
  // change to that radius entirely.
  const enemyShots = [150, 140, 130, 118, 100, 10].map((d) => ({x: d, y: 0, r: 4, dead: false}));
  const dealt = [];
  player.kills = 3;              // the Death Reactor triggers on kills since last tick
  player._arsenalKills = 0;
  tickArsenal(player, DT, {enemies, shots, enemyShots, damageEnemy: (e, d) => { dealt.push(+d.toFixed(6)); return false; }, elapsed: 0});
  return JSON.stringify({
    dealt,
    shots: shots.map((s) => ({d: +(s.damage ?? 0).toFixed(6), r: s.r, k: s.kind, p: s.pierce ?? 0, l: +(s.life ?? 0).toFixed(4)})),
    // `life` matters: plasma's only modifier is how long its zone lingers.
    fx: (player.arsenalFx || []).map((f) => ({t: f.type, r: f.r ? +f.r.toFixed(4) : null, l: +(f.life ?? 0).toFixed(4)})),
    intercepted: enemyShots.map((s) => !!s.dead),
    mark: enemies.map((e) => e._execMarkMult ?? null),
    pos: enemies.map((e) => [+e.x.toFixed(4), +e.y.toFixed(4)]),
    rt: player._arsenalRt,
  });
}

/** States a family is exercised in; branch-only modifiers need branch states. */
const PROBE_STATES = [
  {tier: 4, branch: null, evo: 0},
  {tier: 6, branch: 'a', evo: 2},
  {tier: 6, branch: 'b', evo: 2},
];

/** Which families an entry's modifiers could reach. */
function touchedFamilies(entry) {
  const out = new Set(Object.keys(entry.family || {}));
  for (const category of Object.keys(entry.category || {})) {
    for (const [id, fam] of Object.entries(ARSENAL_BY_ID)) if (fam.category === category) out.add(id);
  }
  if (entry.all) for (const id of Object.keys(ARSENAL_BY_ID)) out.add(id);
  return [...out];
}

// --- coverage ----------------------------------------------------------------

test('the shipped list and the effect table are exactly the same set', () => {
  const shipped = ALL_BLESSINGS.map((b) => b.id);
  const implemented = Object.keys(ALIGNMENT_EFFECTS);
  assert.equal(shipped.length, 60, 'the audit counted 60');
  assert.deepEqual([...shipped].sort(), [...implemented].sort(),
    'every shipped id needs an effect, and no effect may exist for an id nobody can draw');
  assert.equal(BLESSINGS.length, 40);
  assert.equal(CORRUPTED_BLESSINGS.length, 20);
});

test('anything cut is gone from the data as well as the table', () => {
  for (const id of CUT) {
    assert.ok(!ALL_BLESSINGS.some((b) => b.id === id), `${id} was cut but is still drawable`);
    assert.ok(!ALIGNMENT_EFFECTS[id], `${id} was cut but still has an effect`);
  }
  for (const [from, to] of Object.entries(MERGED)) {
    assert.ok(!ALL_BLESSINGS.some((b) => b.id === from), `${from} was merged into ${to} but is still drawable`);
  }
});

// --- the headline contract ---------------------------------------------------

test('every id changes something observable — no silent no-ops', () => {
  const inert = [];
  for (const id of Object.keys(ALIGNMENT_EFFECTS)) {
    const player = freshPlayer();
    const before = JSON.stringify({
      stats: [player.damage, player.rate, player.speed, player.maxHp, player.hp, player.armor,
        player.crit, player.magnet, player.regen, player.xpBoost, player.coinBoost, player.corruption],
      mods: player.mods,
    });
    const result = applyAlignment(player, id);
    const after = JSON.stringify({
      stats: [player.damage, player.rate, player.speed, player.maxHp, player.hp, player.armor,
        player.crit, player.magnet, player.regen, player.xpBoost, player.coinBoost, player.corruption],
      mods: player.mods,
    });
    if (!result || !result.changed.length || before === after) inert.push(id);
  }
  assert.deepEqual(inert, [], `these still do nothing when picked:\n  ${inert.join('\n  ')}`);
});

test('every weapon modifier actually moves the runtime, not just a table', () => {
  // The important half. A modifier that no code reads is the same bug as a
  // missing branch, so each one is proved against tickArsenal's real output.
  const unread = [];
  for (const [id, entry] of Object.entries(ALIGNMENT_EFFECTS)) {
    const families = touchedFamilies(entry);
    if (!families.length) continue;

    let moved = false;
    outer:
    for (const family of families) {
      for (const probe of PROBE_STATES) {
        const state = {[family]: {...probe}};
        const control = freshPlayer(structuredClone(state));
        const treated = freshPlayer(structuredClone(state));
        applyAlignment(treated, id);
        // Only the weapon modifiers are under test here; neutralise stat changes.
        for (const key of ['damage', 'rate', 'speed', 'crit', 'magnet']) treated[key] = control[key];
        if (runtimeFingerprint(control) !== runtimeFingerprint(treated)) { moved = true; break outer; }
      }
    }
    if (!moved) unread.push(`${id} (families: ${families.slice(0, 4).join(', ')})`);
  }
  assert.deepEqual(unread, [], `these declare weapon modifiers nothing reads:\n  ${unread.join('\n  ')}`);
});

test('every conditional rule is reachable and does what it says', () => {
  const ruled = Object.entries(ALIGNMENT_EFFECTS).filter(([, e]) => e.rule);
  assert.ok(ruled.length >= 8, `only ${ruled.length} conditional rules exist`);

  // second_wind: only below the threshold.
  let p = freshPlayer();
  applyAlignment(p, 'second_wind');
  p.hp = 90;
  tickAlignments(p, {elapsed: 0, moving: true}, DT);
  assert.equal(p._alignScale, null, 'healthy frames get nothing');
  p.hp = 20;
  tickAlignments(p, {elapsed: 0, moving: true}, DT);
  assert.ok(p._alignScale?.speed > 1 && p._alignScale?.rate < 1, 'a hurt frame moves and fires faster');

  // full_output: only inside the God Window.
  p = freshPlayer();
  applyAlignment(p, 'full_output');
  tickAlignments(p, {elapsed: 100, godWindowStart: 390}, DT);
  assert.equal(alignmentDamageScale(p, {}), 1);
  tickAlignments(p, {elapsed: 400, godWindowStart: 390}, DT);
  assert.ok(alignmentDamageScale(p, {}) > 1, 'the God Window pays out');

  // formation_reader: only during a director event.
  p = freshPlayer();
  applyAlignment(p, 'formation_reader');
  tickAlignments(p, {elapsed: 10, directorActive: false}, DT);
  assert.equal(alignmentDamageScale(p, {}), 1);
  tickAlignments(p, {elapsed: 10, directorActive: true}, DT);
  assert.ok(alignmentDamageScale(p, {}) > 1);

  // vector_patience: standing still long enough widens reach.
  p = freshPlayer();
  applyAlignment(p, 'vector_patience');
  for (let i = 0; i < 30; i++) tickAlignments(p, {moving: true}, DT);
  const moving = p.mods.all.radius ?? 1;
  for (let i = 0; i < 120; i++) tickAlignments(p, {moving: false}, DT);
  assert.ok((p.mods.all.radius ?? 1) > moving, 'patience widens reach');

  // moving_target: resist only while moving.
  p = freshPlayer();
  applyAlignment(p, 'moving_target');
  tickAlignments(p, {moving: false}, DT);
  assert.equal(p._alignArmor, 0);
  tickAlignments(p, {moving: true}, DT);
  assert.ok(p._alignArmor > 0);
});

test('on-kill rules fire on the right kills', () => {
  // clean_cycle repairs on a cadence, not every kill.
  let p = freshPlayer();
  applyAlignment(p, 'clean_cycle');
  let heals = 0;
  for (let i = 0; i < 74; i++) for (const fx of onAlignmentKill(p, {t: 'swarm'})) if (fx.heal) heals++;
  assert.equal(heals, 2, `expected 2 repairs across 74 kills, got ${heals}`);

  // execution_dividend clears cooldowns, but only for elites and commanders.
  p = freshPlayer();
  applyAlignment(p, 'execution_dividend');
  p._arsenalRt.rail = 5;
  onAlignmentKill(p, {t: 'swarm'});
  assert.equal(p._arsenalRt.rail, 5, 'trash kills pay nothing');
  const paid = onAlignmentKill(p, {t: 'elite'});
  assert.equal(p._arsenalRt.rail, 0, 'an elite kill clears cooldowns');
  assert.ok(paid.some((fx) => fx.toast), 'and tells the player');
});

test('target-type damage applies to what it names and nothing else', () => {
  const p = freshPlayer();
  applyAlignment(p, 'boss_hunter');
  tickAlignments(p, {elapsed: 0}, DT);
  assert.ok(alignmentDamageScale(p, {t: 'elite'}) > 1, 'elites take more');
  assert.ok(alignmentDamageScale(p, {t: 'boss'}) > 1, 'commanders take more');
  assert.equal(alignmentDamageScale(p, {t: 'swarm'}), 1, 'trash is unaffected');
});

test('crit detonation and cache repair are registered where the runtime reads them', () => {
  let p = freshPlayer();
  applyAlignment(p, 'critical_mass');
  assert.ok(p.crit > 0, 'the flat crit lands');
  assert.ok(p.mods.critBlast?.radius > 0 && p.mods.critBlast?.damage > 0, 'the blast is registered for the damage path');

  p = freshPlayer();
  const before = p.mods.cacheHeal;
  applyAlignment(p, 'recovery_protocol');
  assert.ok(p.mods.cacheHeal > before, 'cache repair is scaled');
});

// --- Eclipses ----------------------------------------------------------------

test('every Eclipse costs something and shows on the frame', () => {
  const eclipses = ALL_BLESSINGS.filter((b) => b.kind === 'corrupted');
  assert.equal(eclipses.length, 20);
  const infecting = new Set(infectingAlignments());

  for (const eclipse of eclipses) {
    const entry = ALIGNMENT_EFFECTS[eclipse.id];
    assert.equal(entry.kind, 'eclipse', `${eclipse.id} is not marked as an Eclipse`);
    assert.ok(entry.corruption > 0, `${eclipse.id} costs no corruption`);
    assert.ok(infecting.has(eclipse.id), `${eclipse.id} does not infect the frame`);

    // Corruption is what the frame renderer blends on, so it must actually land.
    const p = freshPlayer();
    applyAlignment(p, eclipse.id);
    assert.ok(p.corruption > 0, `${eclipse.id} did not raise corruption`);
    assert.ok(p.corruption <= 1, 'corruption stays inside its range');
  }
});

test('an Eclipse is a trade, not a free upgrade', () => {
  const downsideless = [];
  for (const eclipse of ALL_BLESSINGS.filter((b) => b.kind === 'corrupted')) {
    const entry = ALIGNMENT_EFFECTS[eclipse.id];
    const values = [
      ...Object.entries(entry.stats || {}),
      ...Object.values(entry.family || {}).flatMap((m) => Object.entries(m)),
      ...Object.values(entry.category || {}).flatMap((m) => Object.entries(m)),
      ...Object.entries(entry.all || {}),
    ];
    // A cost is a multiplier below 1 on something good, or above 1 on a cooldown.
    const hasCost = values.some(([key, v]) =>
      (key === 'cooldown' && v > 1) || (!key.startsWith('+') && key !== 'cooldown' && v < 1) || (key.startsWith('+') && v < 0));
    if (!hasCost) downsideless.push(eclipse.id);
  }
  assert.deepEqual(downsideless, [], `these Eclipses are pure upside:\n  ${downsideless.join('\n  ')}`);
});

test('Alignments never charge corruption', () => {
  for (const blessing of ALL_BLESSINGS.filter((b) => b.kind === 'blessing')) {
    const entry = ALIGNMENT_EFFECTS[blessing.id];
    assert.ok(!entry.corruption, `${blessing.id} is an Alignment but charges corruption`);
    assert.ok(!entry.infect, `${blessing.id} is an Alignment but infects the frame`);
  }
});

// --- copy --------------------------------------------------------------------

test('card copy is generated from the numbers the effect applies', () => {
  for (const [id, entry] of Object.entries(ALIGNMENT_EFFECTS)) {
    const text = effectTextFor(entry);
    assert.ok(text.length > 0, `${id} renders no effect line`);
    assert.ok(!/undefined|NaN|\[object/.test(text), `${id} renders "${text}"`);
    if (entry.corruption) assert.match(text, /Corruption/, `${id} hides its corruption cost`);
  }
});

test('rewritten copy is declared rather than quietly changed', () => {
  assert.ok(REWRITTEN_COPY.length > 0, 'the rewrite list should not be empty — some copy promised what nothing did');
  for (const id of REWRITTEN_COPY) {
    assert.ok(ALIGNMENT_EFFECTS[id], `${id} is listed as rewritten but has no effect`);
  }
});

test('the generated runtime calls the table instead of its old nine branches', () => {
  const source = fs.readFileSync(new URL('./public/game.js', import.meta.url), 'utf8');
  assert.match(source, /applyAlignment\(player,b\.id\)/, 'the table is what applies a pick');
  assert.doesNotMatch(source, /b\.id==='seraphic_conduction'/, 'the hardcoded nine are gone');
  assert.doesNotMatch(source, /b\.id==='fractured_aegis'/, 'the hardcoded nine are gone');
  for (const token of ['tickAlignments(player,', 'onAlignmentKill(player,e)', 'alignmentDamageScale(player,e)']) {
    assert.ok(source.includes(token), `${token} is not wired into the run loop`);
  }
});
