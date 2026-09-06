// Mobile hardening.
//
// Orientation is tested as a PREFERENCE, not a promise. iOS Safari will not let
// a web page lock orientation, so a test that demanded a lock would fail the
// build for something the platform simply does not do. What is tested instead:
// the preference is stated everywhere it can be, the refusal path is graceful,
// and the game is still playable when the request is ignored.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {installBrowserEnvironment} from './test-harness.mjs';
import {requestPortraitLock, trackOrientation, installVisibilityPause, SAFE_AREA_VARS} from './public/mobile-runtime.js';

// One environment for the whole file: game.js and meta.js are module singletons
// bound to the document that existed when they were first imported, so a second
// installBrowserEnvironment() would leave them pointing at a dead DOM.
const env = installBrowserEnvironment();
await import('./public/game.js');
await import('./public/meta.js');
const game = globalThis.window.mechGame;
const $ = (sel) => env.document.querySelector(sel);

const read = (f) => fs.readFileSync(new URL(`./public/${f}`, import.meta.url), 'utf8');

test('the manifest states a portrait preference', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.orientation, 'portrait');
  assert.equal(manifest.display, 'fullscreen');
  assert.ok(manifest.name.includes('SUNFALL'));
  assert.ok(manifest.background_color && manifest.theme_color);
});

test('the shell links the manifest and declares itself app-capable', () => {
  const html = read('index.html');
  assert.match(html, /rel="manifest"\s+href="manifest\.webmanifest"/);
  assert.match(html, /name="theme-color"/);
  assert.match(html, /apple-mobile-web-app-capable/);
  assert.match(html, /viewport-fit=cover|user-scalable=no/, 'the viewport is pinned for a game surface');
});

test('the portrait lock is best-effort and never throws', async () => {
  // No API at all: report unsupported rather than crashing.
  delete globalThis.screen;
  assert.deepEqual(await requestPortraitLock(), {locked: false, reason: 'unsupported'});

  // The iOS case: the API exists and always rejects.
  globalThis.screen = {orientation: {lock: async () => { const e = new Error('no'); e.name = 'NotSupportedError'; throw e; }}};
  const refused = await requestPortraitLock();
  assert.equal(refused.locked, false);
  assert.equal(refused.reason, 'NotSupportedError', 'a refusal is reported, not swallowed into a crash');

  // Where it works, it works.
  let asked = null;
  globalThis.screen = {orientation: {lock: async (o) => { asked = o; }}};
  assert.deepEqual(await requestPortraitLock(), {locked: true, reason: 'locked'});
  assert.equal(asked, 'portrait');
  delete globalThis.screen;
});

test('landscape is a tracked fallback, not a failure', () => {
  const classes = new Set();
  const doc = {body: {classList: {toggle: (c, on) => { on ? classes.add(c) : classes.delete(c); }}}};
  const listeners = {};
  const win = {innerWidth: 900, innerHeight: 400, addEventListener: (t, fn) => { listeners[t] = fn; }};

  const apply = trackOrientation(doc, win);
  assert.ok(classes.has('landscape') && !classes.has('portrait'), 'wide is landscape');

  win.innerWidth = 400; win.innerHeight = 900;
  apply();
  assert.ok(classes.has('portrait') && !classes.has('landscape'), 'tall is portrait');
  assert.ok(listeners.resize && listeners.orientationchange, 'both rotation signals are watched');
});

test('the landscape fallback has real styling rather than being ignored', () => {
  const css = fs.readFileSync(new URL('./public/style.css', import.meta.url), 'utf8');
  const rules = [...css.matchAll(/body\.landscape\s+([^{]+)\{/g)].map((m) => m[1].trim());
  assert.ok(rules.length >= 4, `landscape only restyles ${rules.length} things`);
  assert.ok(rules.some((r) => r.includes('#hud')), 'the HUD reflows in landscape');
  assert.ok(rules.some((r) => r.includes('#touch-dash')), 'the dash button moves in landscape');
});

test('backgrounding the tab pauses a live run', () => {
  let hidden = 0;
  const listeners = {};
  const doc = {visibilityState: 'visible', addEventListener: (t, fn) => { listeners[t] = fn; }};
  const prevAdd = globalThis.addEventListener;
  globalThis.addEventListener = (t, fn) => { listeners['win:' + t] = fn; };

  installVisibilityPause(doc, () => hidden++);
  listeners.visibilitychange();
  assert.equal(hidden, 0, 'still visible, nothing to do');

  doc.visibilityState = 'hidden';
  listeners.visibilitychange();
  assert.equal(hidden, 1, 'hiding the tab pauses');

  assert.ok(listeners['win:pagehide'], 'pagehide is covered too — iOS often skips visibilitychange');
  globalThis.addEventListener = prevAdd;
});

test('safe-area variables the layout depends on are actually defined', () => {
  const css = fs.readFileSync(new URL('./public/style.css', import.meta.url), 'utf8');
  for (const name of SAFE_AREA_VARS) {
    assert.ok(css.includes(`${name}:env(safe-area-inset-`), `${name} is not bound to a real inset`);
  }
  // And something notch-adjacent actually consumes them.
  assert.match(css, /var\(--safe-t\)/, 'the top inset is used');
  assert.match(css, /var\(--safe-b\)/, 'the bottom inset is used');
});

test('cold launch reaches the first input in one tap', () => {
  // Start where a cold launch starts: the title screen.
  $('#quit-menu').click();
  env.frames(3);
  assert.ok(!$('#title').classList.contains('hidden'), 'cold launch lands on the title');

  $('#start').click();
  env.step(16);
  assert.equal(game.state, 'play', 'one tap should be playing, not browsing a list');

  // Choosing a different orbit is still available, one button away.
  $('#quit-menu').click();
  env.frames(3);
  $('#orbit-select').click();
  env.frames(3);
  assert.ok(!$('#worlds').classList.contains('hidden'), 'SELECT ORBIT still lists the orbits');
});

test('a run survives without ever dashing', () => {
  // Dash is a keyboard/controller verb; a touch player may never press it. The
  // run must stay playable rather than becoming an instant loss without it.
  game.start(0);
  env.step(16);
  const dirs = ['KeyD', 'KeyS', 'KeyA', 'KeyW'];
  let held = null;
  let survived = 0;
  for (let i = 0; i < 3600; i++) {
    if (i % 30 === 0) {
      if (held) env.keyUp(held);
      held = dirs[Math.floor(i / 30) % 4];
      env.keyDown(held);
    }
    env.step(16);
    if (game.state !== 'play') break;
    survived = i;
  }
  if (held) env.keyUp(held);
  assert.equal(game.frameState()?.dashCooldown, 0, 'the dash was never spent');
  assert.ok(survived > 900, `a no-dash run only lasted ${survived} frames`);
});

test('the phone gets a WIDER field of view than desktop, not a narrower one', () => {
  // This shipped backwards: mobile zoomed IN 18%, on the platform with the
  // least screen to spare. A horde survivor is read peripherally — what is
  // about to reach you matters more than what is already on top of you — so
  // the smaller screen has to compensate by showing more of the field, not
  // less. The direction is what this locks; the exact value is a tuning knob.
  const src = fs.readFileSync(new URL('./public/game.js', import.meta.url), 'utf8');
  const match = src.match(/const mobileCamera=W<760,camZoom=\(?mobileCamera\?([0-9.]+):1\)?/);
  assert.ok(match, 'the mobile camera zoom should still be one readable expression');

  const zoom = Number(match[1]);
  assert.ok(zoom < 1, `mobile must zoom out, not in — found ${zoom}`);
  // A floor as well as a ceiling: past this the mech and the HUD stop reading.
  assert.ok(zoom >= 0.8, `${zoom} is too wide to keep sprites and HUD legible`);
});
