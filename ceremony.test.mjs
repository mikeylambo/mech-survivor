// Commander ceremony.
//
// The exit criteria here are presentation ones, so they are tested as
// presentation: what is on screen, what the camera is doing, and — the one that
// matters most — that none of it takes the controls away from the player.
import test from 'node:test';
import assert from 'node:assert/strict';
import {installBrowserEnvironment} from './test-harness.mjs';

const env = installBrowserEnvironment();
const game = await import('./public/game.js').then(() => globalThis.window.mechGame);
const {
  createCommanderCeremony,
  beginCommanderCeremony,
  updateCommanderCeremony,
  skipCommanderCeremony,
  commanderPhaseBreak,
  resolveCommanderCeremony,
  clearCommanderCeremony,
  duckAudio,
  hasMetCommander,
  drawCommanderTells,
} = await import('./public/commander-ceremony.js');
const {resolveCommanderDoctrine} = await import('./public/commander-doctrine.js');

const $ = (sel) => env.document.querySelector(sel);
const body = () => env.document.body;
const doctrine = resolveCommanderDoctrine({arsenal: {rail: {tier: 5, evo: 0}}}, {mode: 'buckets'});

function spec(id = 'crown-breaker', name = 'CROWN BREAKER') {
  return {id, name};
}

function fresh() {
  localStorage.clear();
  const ceremony = createCommanderCeremony();
  clearCommanderCeremony(ceremony);
  return ceremony;
}

test('a first meeting names the commander and its doctrine', () => {
  const ceremony = fresh();
  beginCommanderCeremony(ceremony, {spec: spec(), doctrine});

  const card = $('#commander-card');
  assert.ok(card.classList.contains('showing'), 'the card should be up');
  assert.ok(card.classList.contains('first'), 'a first meeting gets the full card');
  assert.ok(card.innerHTML.includes('CROWN BREAKER'), 'the commander is named');
  assert.ok(card.innerHTML.includes('DOCTRINE'), 'the doctrine it chose is stated');
  assert.ok(card.innerHTML.includes('SKIP'), 'the first card says it can be skipped');
  assert.ok(hasMetCommander('crown-breaker'), 'meeting it is remembered');

  clearCommanderCeremony(ceremony);
});

test('a commander already met gets the abbreviated card', () => {
  const ceremony = fresh();
  beginCommanderCeremony(ceremony, {spec: spec(), doctrine});
  const firstDuration = ceremony.duration;
  clearCommanderCeremony(ceremony);

  const second = createCommanderCeremony();
  beginCommanderCeremony(second, {spec: spec(), doctrine});
  const card = $('#commander-card');

  assert.ok(second.duration < firstDuration, 'the repeat intro is shorter');
  assert.ok(card.classList.contains('known'), 'the repeat card is the compact one');
  assert.ok(card.innerHTML.includes('CROWN BREAKER'), 'it still names the commander');
  assert.ok(!card.innerHTML.includes('SKIP'), 'the skip hint is only worth showing once');

  clearCommanderCeremony(second);
});

test('any input skips the card', () => {
  const ceremony = fresh();
  beginCommanderCeremony(ceremony, {spec: spec('glass-oracle', 'GLASS ORACLE'), doctrine});
  updateCommanderCeremony(ceremony, 0.2);
  assert.ok($('#commander-card').classList.contains('showing'));

  env.keyDown('KeyQ');
  updateCommanderCeremony(ceremony, 0.016);

  assert.ok(!$('#commander-card').classList.contains('showing'), 'a key press dismisses the card');
  clearCommanderCeremony(ceremony);
});

test('the press that spawned the commander does not skip its own card', () => {
  const ceremony = fresh();
  beginCommanderCeremony(ceremony, {spec: spec(), doctrine});
  assert.equal(skipCommanderCeremony(ceremony), false, 'a skip on the opening frame is ignored');
  assert.ok($('#commander-card').classList.contains('showing'));
  clearCommanderCeremony(ceremony);
});

test('the HUD yields for the intro and comes back after it', () => {
  const ceremony = fresh();
  beginCommanderCeremony(ceremony, {spec: spec(), doctrine});
  assert.ok($('#hud').classList.contains('yield'), 'the HUD steps back');

  updateCommanderCeremony(ceremony, ceremony.duration + 0.1);
  assert.ok(!$('#hud').classList.contains('yield'), 'the HUD returns once the card is gone');
  assert.ok(body().classList.contains('commander-present'), 'the sky stays dark while it lives');

  clearCommanderCeremony(ceremony);
});

test('the commander dies and takes its sky with it', () => {
  const ceremony = fresh();
  beginCommanderCeremony(ceremony, {spec: spec(), doctrine});
  assert.ok(body().classList.contains('commander-present'));

  assert.equal(resolveCommanderCeremony(ceremony), true);
  assert.ok(!body().classList.contains('commander-present'), 'the dark sky clears');
  assert.ok(body().classList.contains('commander-resolved'), 'the world visibly changes');

  updateCommanderCeremony(ceremony, 2);
  assert.ok(!body().classList.contains('commander-resolved'), 'and settles back to normal');
});

test('the camera eases back while the commander holds the field, then returns', () => {
  const ceremony = fresh();
  assert.equal(updateCommanderCeremony(ceremony, 0.016).scale, 1, 'no commander, no pull-back');

  beginCommanderCeremony(ceremony, {spec: spec(), doctrine});
  const early = updateCommanderCeremony(ceremony, 0.5).scale;
  const settled = updateCommanderCeremony(ceremony, 2).scale;

  assert.ok(settled < 1, 'the camera pulls back');
  assert.ok(settled < early, 'and eases into it rather than snapping');
  assert.ok(settled > 0.85, 'but only slightly — this is a pull-back, not a zoom out');

  resolveCommanderCeremony(ceremony);
  assert.equal(updateCommanderCeremony(ceremony, 0.016).scale, 1, 'the camera returns when it dies');
  clearCommanderCeremony(ceremony);
});

test('a phase break flashes the frame and ducks the mix', () => {
  const ceremony = fresh();
  const impact = {freeze: 0, slow: 1, slowFor: 0, zoom: 0, zoomVel: 0, rumbleCooldown: 0, enabled: true, haptics: false};

  let ducked = null;
  const audio = {
    ctx: {currentTime: 4},
    master: {gain: {
      value: 0.8,
      cancelScheduledValues() {},
      setValueAtTime(v) { ducked = v; },
      linearRampToValueAtTime(v, t) { this.ramps = [...(this.ramps || []), [v, t]]; },
    }},
  };

  commanderPhaseBreak(ceremony, impact, audio);

  assert.ok(impact.freeze > 0, 'a phase break lands with hitstop');
  assert.ok(impact.zoom > 0, 'and a zoom punch');
  assert.ok(impact.slow < 1, 'and a beat of slow motion');
  assert.ok(body().classList.contains('commander-break'), 'and a frame flash');
  assert.equal(ducked, 0.8, 'the mix is ducked from its current level');
  const [down, back] = audio.master.gain.ramps;
  assert.ok(down[0] < 0.8, 'the duck goes down');
  assert.ok(back[0] === 0.8 && back[1] > down[1], 'and comes back up');

  // The hitstop budget has to stay short enough that the controls never feel gone.
  assert.ok(impact.freeze <= 0.09, `hitstop of ${impact.freeze}s would obscure input`);

  clearCommanderCeremony(ceremony);
});

test('duckAudio is inert without a real audio graph', () => {
  assert.equal(duckAudio(null), false);
  assert.equal(duckAudio({}), false);
});

test('the ceremony never takes the controls away', () => {
  // The whole intro plays over live gameplay. This is the exit criterion that
  // matters: raise a commander mid-run and the frame must still move and dash.
  const ceremony = fresh();
  env.setGamepadAttached(false);
  game.start(0);
  env.step(16);
  assert.equal(game.state, 'play');

  beginCommanderCeremony(ceremony, {spec: spec('war-foundry', 'WAR FOUNDRY'), doctrine});
  assert.equal(game.state, 'play', 'the run is not paused for the ceremony');

  env.keyDown('KeyD');
  const before = game.frameState();
  env.frames(4);
  const moved = game.frameState();
  assert.ok(Math.hypot(moved.x - before.x, moved.y - before.y) > 0, 'the frame still moves during the intro');

  assert.ok(env.stepUntil(() => game.frameState().dashCooldown <= 0, 400));
  env.keyDown('Space');
  assert.ok(game.frameState().dashTime > 0, 'the frame can still dash during the intro');

  env.keyUp('Space');
  env.keyUp('KeyD');
  clearCommanderCeremony(ceremony);
});

test('doctrine tells draw only for a commander that has one', () => {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : (o[k] = (...args) => calls.push([k, ...args]))),
    set: (o, k, v) => { o[k] = v; return true; },
  });

  drawCommanderTells(ctx, {x: 0, y: 0, r: 40}, 1, {gold: '#d6ae52'});
  assert.equal(calls.length, 0, 'an ordinary enemy has no tells');

  const boss = {x: 0, y: 0, r: 40, _doctrine: {profile: {weakpoints: 4}}, _exposed: 1, _plates: 2, _telegraph: 0.5};
  drawCommanderTells(ctx, boss, 1, {gold: '#d6ae52', cyan: '#78e7ff'});
  assert.ok(calls.some(([k]) => k === 'arc'), 'an exposed commander is visibly marked');
  assert.ok(calls.some(([k]) => k === 'setLineDash'), 'a telegraph reads differently from an open window');
});
