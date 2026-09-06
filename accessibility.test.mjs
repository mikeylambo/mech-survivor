// Accessibility.
//
// The colour claim is the one worth testing properly. "Colourblind-friendly" is
// usually asserted; here it is measured — the three dichromat conditions are
// simulated with the Viénot matrices and each alternate palette has to beat the
// shipped one under its own condition. The first attempt at these palettes was
// WORSE than the default under the very condition it was designed for, and this
// test is what caught it.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULTS, LIMITS, DANGER_PALETTES, ASSIST_KEYS,
  normalise, dangerColors, applyPresentation, assistMetadata, comparableRuns,
  perceptualDistance, simulateCvd, hexToRgb, CVD_MATRICES,
} from './public/accessibility.js';
import {installBrowserEnvironment} from './test-harness.mjs';

const CONDITIONS = ['protanopia', 'deuteranopia', 'tritanopia'];
const minSeparation = (pal, type) => Math.min(
  perceptualDistance(pal.danger, pal.safe, type),
  perceptualDistance(pal.danger, pal.warn, type),
  perceptualDistance(pal.safe, pal.warn, type),
);

test('flash and shake reduction actually reduce, and clamp', () => {
  assert.equal(normalise({flashScale: 0}).flashScale, 0, 'flash can be turned off entirely');
  assert.equal(normalise({shakeScale: 0}).shakeScale, 0, 'shake can be turned off entirely');
  assert.equal(normalise({flashScale: 5}).flashScale, 1, 'and cannot be turned up past shipped');
  assert.equal(normalise({shakeScale: -3}).shakeScale, 0);
  assert.ok(normalise({}).flashScale === 1 && normalise({}).shakeScale === 1, 'default is the shipped look');
});

test('text scale is bounded to something still laid out', () => {
  const [lo, hi] = LIMITS.textScale;
  assert.equal(normalise({textScale: 0.1}).textScale, lo);
  assert.equal(normalise({textScale: 9}).textScale, hi);
  assert.ok(hi >= 1.5, 'the ceiling is worth having');
});

test('presentation settings reach the document', () => {
  const props = {};
  const classes = new Set();
  const doc = {
    documentElement: {style: {setProperty: (k, v) => { props[k] = v; }}},
    body: {classList: {toggle: (c, on) => { on ? classes.add(c) : classes.delete(c); }}},
  };
  applyPresentation({textScale: 1.4, flashScale: 0.2, shakeScale: 0}, doc);
  assert.equal(props['--text-scale'], '1.4');
  assert.ok(classes.has('reduce-flash') && classes.has('reduce-shake'));

  applyPresentation({}, doc);
  assert.equal(props['--text-scale'], '1');
  assert.ok(!classes.has('reduce-flash') && !classes.has('reduce-shake'));
});

test('the colour-vision simulation is real maths, not a stub', () => {
  assert.deepEqual(hexToRgb('#ffffff'), [1, 1, 1]);
  assert.deepEqual(hexToRgb('#000000'), [0, 0, 0]);
  for (const type of CONDITIONS) assert.equal(CVD_MATRICES[type].length, 3);
  // Red and green are the pair red-green blindness collapses.
  const normal = perceptualDistance('#ff0000', '#00ff00', 'none');
  const deut = perceptualDistance('#ff0000', '#00ff00', 'deuteranopia');
  assert.ok(deut < normal * 0.6, `red/green should collapse under deuteranopia (${normal.toFixed(0)} -> ${deut.toFixed(0)})`);
  // Blue and yellow survive it.
  assert.ok(perceptualDistance('#0000ff', '#ffff00', 'deuteranopia') > 60, 'blue/yellow survives red-green loss');
  assert.notDeepEqual(simulateCvd('#ff0000', 'protanopia'), simulateCvd('#ff0000', 'none'));
});

test('each alternate palette beats the default under its own condition', () => {
  const base = DANGER_PALETTES.default;
  for (const type of CONDITIONS) {
    const alt = DANGER_PALETTES[type];
    assert.ok(alt, `no palette for ${type}`);
    const improved = minSeparation(alt, type);
    const shipped = minSeparation(base, type);
    assert.ok(improved > shipped,
      `${type}: alternate separates by ${improved.toFixed(1)}, default already does ${shipped.toFixed(1)} — the alternate is not helping`);
  }
});

test('every palette keeps danger, warn and safe apart under every condition', () => {
  // 25 is roughly where two colours stop being confusable at a glance.
  const FLOOR = 25;
  for (const [name, pal] of Object.entries(DANGER_PALETTES)) {
    for (const type of [...CONDITIONS, 'none']) {
      const sep = minSeparation(pal, type);
      assert.ok(sep >= FLOOR, `${name} under ${type}: hues only ${sep.toFixed(1)} apart`);
    }
  }
});

test('high-contrast is the best choice for someone who does not know their type', () => {
  const worst = (pal) => Math.min(...[...CONDITIONS, 'none'].map((t) => minSeparation(pal, t)));
  assert.ok(worst(DANGER_PALETTES['high-contrast']) > worst(DANGER_PALETTES.default),
    'high-contrast should beat the default in its worst case');
});

test('an unknown palette degrades to the shipped one instead of crashing', () => {
  assert.equal(normalise({dangerPalette: 'nonsense'}).dangerPalette, 'default');
  assert.deepEqual(dangerColors({dangerPalette: 'nonsense'}), DANGER_PALETTES.default);
  assert.deepEqual(dangerColors({dangerPalette: 'protanopia'}), DANGER_PALETTES.protanopia);
});

// --- assists -----------------------------------------------------------------

test('assists are recorded in run metadata, never blocked', () => {
  const clean = assistMetadata({});
  assert.equal(clean.assisted, false);
  assert.deepEqual(clean.assists, {});
  assert.equal(clean.label, 'UNASSISTED');

  const helped = assistMetadata({damageTaken: 0.5, gameSpeed: 0.8});
  assert.equal(helped.assisted, true);
  assert.deepEqual(helped.assists, {damageTaken: 0.5, gameSpeed: 0.8});
  assert.match(helped.label, /DMG 50%/);
  assert.match(helped.label, /SPEED 80%/);

  // And they are still permitted at full range — recording is not gatekeeping.
  assert.equal(normalise({damageTaken: 0.25}).damageTaken, 0.25);
  assert.equal(normalise({gameSpeed: 0.6}).gameSpeed, 0.6);
});

test('presentation settings are NOT recorded as assists', () => {
  // Turning off screen shake does not change the run, so it is nobody's business.
  const meta = assistMetadata({flashScale: 0, shakeScale: 0, textScale: 1.6, dangerPalette: 'protanopia'});
  assert.equal(meta.assisted, false, 'presentation choices are not assists');
  assert.deepEqual(meta.assists, {});
  for (const key of ASSIST_KEYS) assert.ok(key in DEFAULTS, `${key} must have a default to compare against`);
});

test('two runs are only directly comparable when played the same way', () => {
  const plain = assistMetadata({});
  const alsoPlain = assistMetadata({flashScale: 0});
  const helped = assistMetadata({damageTaken: 0.5});

  assert.equal(comparableRuns(plain, alsoPlain), true, 'presentation differences do not break comparison');
  assert.equal(comparableRuns(plain, helped), false, 'an assisted run is not the same contest');
  assert.equal(comparableRuns(helped, assistMetadata({damageTaken: 0.5})), true, 'same assists, comparable again');
});

// --- wired into the actual runtime -------------------------------------------
//
// Everything above tests the module. These test that the module is CONNECTED:
// a setting nobody reads is a setting that does not exist. Each one drives the
// real game with a pinned seed, so a difference can only come from the setting.

const env = installBrowserEnvironment();
globalThis.window.__sunfallSeed = 'a11y-suite';
await import('./public/game.js');
await import('./public/meta.js');
const game = globalThis.window.mechGame;
const a11y = globalThis.window.mechA11y;

/** Run `frames` of a pinned run under `settings`, and report what happened. */
function runUnder(settings, frames = 900) {
  a11y.apply({...DEFAULTS, ...settings});
  game.start(0);
  env.step(16);
  for (let i = 0; i < frames; i++) env.step(16);
  const f = game.frameState();
  return {hp: f?.hp ?? 0, elapsed: game.summary()?.time ?? 0, summary: game.summary()};
}

test('the runtime exposes the settings it is actually using', () => {
  assert.ok(a11y, 'game.js should publish the live accessibility state');
  const applied = a11y.apply({textScale: 1.4, dangerPalette: 'protanopia'});
  assert.equal(applied.textScale, 1.4);
  assert.equal(a11y.settings().dangerPalette, 'protanopia');
  a11y.apply({...DEFAULTS});
});

test('the danger palette reaches the renderer, not just localStorage', () => {
  a11y.apply({...DEFAULTS, dangerPalette: 'default'});
  const before = a11y.palette();
  assert.equal(before.red, DANGER_PALETTES.default.danger, 'default danger hue is the shipped red');

  a11y.apply({dangerPalette: 'deuteranopia'});
  const after = a11y.palette();
  assert.equal(after.red, DANGER_PALETTES.deuteranopia.danger, 'the renderer palette follows the setting');
  assert.equal(after.cyan, DANGER_PALETTES.deuteranopia.safe);
  assert.notEqual(after.red, before.red, 'switching palette must change something');
  a11y.apply({...DEFAULTS});
});

test('the damage assist changes how much a run costs, on the same seed', () => {
  const full = runUnder({damageTaken: 1});
  const eased = runUnder({damageTaken: 0.25});
  assert.ok(full.hp < 100, 'the pinned run should take some damage at all — otherwise this proves nothing');
  assert.ok(eased.hp > full.hp, `0.25x damage should leave more hp (${eased.hp} vs ${full.hp})`);
  a11y.apply({...DEFAULTS});
});

test('the game speed assist changes how far the same frames get', () => {
  const normal = runUnder({gameSpeed: 1});
  const slow = runUnder({gameSpeed: 0.6});
  assert.ok(normal.elapsed > 1, 'the run should have advanced');
  const ratio = slow.elapsed / normal.elapsed;
  assert.ok(Math.abs(ratio - 0.6) < 0.05, `0.6x speed should advance ~60% as far, got ${ratio.toFixed(3)}`);
  a11y.apply({...DEFAULTS});
});

test('presentation settings do NOT change the run', () => {
  // The whole reason the two categories are separated: turning off screen shake
  // must not be an assist, so it must not alter the simulation.
  const plain = runUnder({});
  const quiet = runUnder({flashScale: 0, shakeScale: 0, textScale: 1.6, dangerPalette: 'high-contrast'});
  assert.equal(quiet.hp, plain.hp, 'a presentation change must not alter what the run did');
  assert.equal(quiet.elapsed, plain.elapsed);
  a11y.apply({...DEFAULTS});
});

test('the run summary carries what the run was played under', () => {
  const plain = runUnder({}, 120);
  assert.equal(plain.summary.assists.assisted, false);
  assert.equal(plain.summary.assists.label, 'UNASSISTED');

  const assisted = runUnder({damageTaken: 0.5, gameSpeed: 0.8}, 120);
  assert.equal(assisted.summary.assists.assisted, true);
  assert.deepEqual(assisted.summary.assists.assists, {damageTaken: 0.5, gameSpeed: 0.8});
  assert.equal(assisted.summary.assists.label, 'DMG 50% · SPEED 80%');
  assert.ok(!comparableRuns(plain.summary.assists, assisted.summary.assists),
    'a board must be able to tell these two rows apart');
  a11y.apply({...DEFAULTS});
});
