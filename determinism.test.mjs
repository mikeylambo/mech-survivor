// Determinism, in two gates.
//
// Gate A: every gameplay-affecting draw goes through one seeded run stream.
// Gate B: the same seed and the same input sequence replay a 60-second run
//         exactly.
//
// Gate B was expected to need a time abstraction and might have had to stop
// short. It did not: the run loop already takes its step from a single
// `updateImpact` result, and the test harness already owns rAF and
// performance.now, so pinning the seed was the last missing piece. The negative
// controls below matter as much as the positive one — a replay test that would
// also pass with a broken RNG proves nothing.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {installBrowserEnvironment} from './test-harness.mjs';
import {createRng, setRunSeed, runRng, fxRng, srand, frand} from './public/run-rng.js';

const env = installBrowserEnvironment();
globalThis.window.__sunfallSeed = 'determinism-suite';
await import('./public/game.js');
const game = globalThis.window.mechGame;

/** Modules whose randomness can change the outcome of a run. */
const GAMEPLAY_MODULES = [
  'game.js', 'arsenal-runtime.js', 'arsenal-branch-runtime.js', 'boss-runtime.js',
  'director.js', 'director-objectives.js', 'sector-runtime.js', 'configuration-runtime.js',
  'rewards.js', 'retention.js', 'codex.js', 'endgame.js', 'alignment-effects.js',
  'orbit-identity.js', 'commander-doctrine.js',
];

/**
 * The one draw allowed to be unpredictable: choosing WHICH run to play.
 * Everything downstream of it is a pure function of the result.
 */
const SEED_SOURCE = 'Math.floor(Math.random()*1e9)';

// --- Gate A ------------------------------------------------------------------

test('Gate A: no gameplay module reaches for the global RNG or the clock', () => {
  const offenders = [];
  for (const file of GAMEPLAY_MODULES) {
    const src = fs.readFileSync(new URL(`./public/${file}`, import.meta.url), 'utf8');
    const withoutSeed = src.split(SEED_SOURCE).join('');
    if (withoutSeed.includes('Math.random(')) offenders.push(`${file}: Math.random`);
    if (withoutSeed.includes('Date.now(')) offenders.push(`${file}: Date.now`);
  }
  assert.deepEqual(offenders, [], `still nondeterministic:\n  ${offenders.join('\n  ')}`);
});

test('Gate A: the seed source is the single declared exception', () => {
  const src = fs.readFileSync(new URL('./public/game.js', import.meta.url), 'utf8');
  assert.equal(src.split('Math.random(').length - 1, 1, 'exactly one unpredictable draw should remain');
  assert.ok(src.includes(SEED_SOURCE), 'and it is the seed');
  assert.ok(src.includes('window.__sunfallSeed'), 'which can be pinned, so even that is overridable');
  assert.ok(src.includes('setRunSeed(runSeed)'), 'the run stream is seeded from it');
});

test('Gate A: simulation and presentation draw from separate streams', () => {
  // If a particle burst shared the sim stream, turning off screen shake would
  // change what the game spawned.
  setRunSeed('stream-split');
  const simOnly = [srand(), srand(), srand()];
  setRunSeed('stream-split');
  frand(); frand(); frand(); frand(); frand();       // burn cosmetic draws
  const simAfterCosmetics = [srand(), srand(), srand()];
  assert.deepEqual(simAfterCosmetics, simOnly, 'cosmetic draws must not shift the simulation');
  assert.notEqual(runRng(), fxRng(), 'the two streams are distinct objects');
});

test('Gate A: the same seed reproduces the same stream, a different one does not', () => {
  const draw = (seed) => { setRunSeed(seed); return Array.from({length: 50}, () => srand()); };
  assert.deepEqual(draw('run-a'), draw('run-a'));
  assert.notDeepEqual(draw('run-a'), draw('run-b'));
  assert.deepEqual(Array.from({length: 5}, () => createRng(9)()), Array.from({length: 5}, () => createRng(9)()));
});

// --- Gate B ------------------------------------------------------------------

const SCRIPT = [
  [0, 'KeyD'], [40, 'Space'], [55, 'KeyD'], [90, 'KeyS'], [150, 'Space'],
  [200, 'KeyS'], [260, 'KeyA'], [400, 'Space'], [520, 'KeyA'], [600, 'KeyW'],
  [900, 'KeyW'], [1200, 'KeyD'], [1500, 'Space'], [1900, 'KeyD'],
];

/** Replay `frames` of a run, sampling the full simulation once a second. */
function replay({seed = 'gate-b', frames = 3600, script = SCRIPT} = {}) {
  globalThis.window.__sunfallSeed = seed;
  game.start(0);
  env.step(16);
  const held = new Set();
  const samples = [];
  for (let i = 0; i < frames; i++) {
    for (const [at, code] of script) {
      if (at !== i) continue;
      if (held.has(code)) { env.keyUp(code); held.delete(code); }
      else { env.keyDown(code); held.add(code); }
    }
    env.step(16);
    if (i % 60 === 0) {
      const f = game.frameState();
      const s = game.summary();
      samples.push(JSON.stringify({
        f: f && [Math.round(f.x * 1e3), Math.round(f.y * 1e3), Math.round(f.hp * 1e3), f.level, f.state],
        k: s?.kills ?? null,
        t: s ? Math.round(s.time * 1e3) : null,
        c: s ? Math.round((s.corruption || 0) * 1e3) : null,
      }));
    }
  }
  for (const code of held) env.keyUp(code);
  return samples;
}

test('Gate B: the same seed and inputs replay 60 seconds exactly', () => {
  const a = replay({seed: 'gate-b-alpha'});
  const b = replay({seed: 'gate-b-alpha'});
  assert.equal(a.length, 60, 'one sample per second of a 60-second run');

  let firstDiff = -1;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) { firstDiff = i; break; }
  assert.equal(firstDiff, -1,
    firstDiff < 0 ? '' : `diverged at second ${firstDiff}\n  A: ${a[firstDiff]}\n  B: ${b[firstDiff]}`);
});

test('Gate B: a different seed produces a different run', () => {
  // Without this, a replay test would also pass if the RNG were stuck.
  const a = replay({seed: 'gate-b-alpha'});
  const c = replay({seed: 'gate-b-omega'});
  assert.notDeepEqual(a, c, 'two seeds must not play out identically');
});

test('Gate B: different inputs produce a different run', () => {
  const a = replay({seed: 'gate-b-alpha'});
  const d = replay({seed: 'gate-b-alpha', script: [[0, 'KeyW'], [30, 'Space'], [300, 'KeyA'], [800, 'Space']]});
  assert.notDeepEqual(a, d, 'the input sequence must matter');
});

test('Gate B: the replay is stable across a longer window too', () => {
  const a = replay({seed: 'long-run', frames: 5400});
  const b = replay({seed: 'long-run', frames: 5400});
  assert.deepEqual(a, b, '90 seconds must replay as exactly as 60');
});

// --- what this unlocks -------------------------------------------------------

test('a Daily Star seed produces the same sky for everyone', () => {
  // The claim the Daily Star depends on, stated as a test rather than a hope.
  const daily = 'daily-2026-09-06';
  assert.deepEqual(replay({seed: daily, frames: 1800}), replay({seed: daily, frames: 1800}));
});
