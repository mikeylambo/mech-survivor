// Dash is the game's only defensive verb and it has been broken twice by the
// string-rewrite build:
//
//   1. `pass-s` anchored on `const m=input();`, which occurs in both `tryDash()`
//      and `update(dt)`. The first match wins, so `tickBranchIdentity(player,dt,
//      ...)` was injected into `tryDash()`, where `dt` is not in scope. Every
//      dash threw `ReferenceError: dt is not defined` before moving the player,
//      and no arsenal branch identity ever ticked.
//   2. `pass-q` anchored on text `pass-c` had since split with an `audio.cue`
//      call, so the dash VFX recipe was silently skipped.
//
// Both were invisible to a static test that greps the generated source, so
// these tests actually boot the built game and press the button. They fail on
// any unbound identifier in the dash path, which is what makes them worth the
// harness.
import test from 'node:test';
import assert from 'node:assert/strict';
import {installBrowserEnvironment} from './test-harness.mjs';

const env = installBrowserEnvironment();
const game = await import('./public/game.js').then(() => globalThis.window.mechGame);

/** Start a fresh run and settle the first frame. */
function startRun() {
  env.setGamepadAttached(false);
  game.start(0);
  env.step(16);
  assert.equal(game.state, 'play', 'run should be in play state');
  return game.frameState();
}

/** Frames until the dash is off cooldown again. */
function waitForDashReady(limit = 400) {
  for (let i = 0; i < limit; i++) {
    if (game.frameState().dashCooldown <= 0) return true;
    env.step(16);
  }
  return false;
}

test('keyboard dash moves the frame and arms its cooldown', () => {
  startRun();
  assert.ok(waitForDashReady(), 'dash should start ready');

  // Hold a direction so the dash has a vector, then press Space.
  env.keyDown('KeyD');
  env.step(16);
  const before = game.frameState();
  assert.equal(before.dashTime, 0, 'not dashing yet');

  env.keyDown('Space');
  const armed = game.frameState();

  assert.ok(armed.dashTime > 0, 'Space should start a dash');
  assert.ok(armed.dashCooldown > 0, 'Space should arm the dash cooldown');
  assert.ok(armed.invuln > 0, 'dash should grant its i-frames');

  // The dash must actually displace the frame, not just set a flag.
  env.step(16);
  env.step(16);
  const after = game.frameState();
  const travelled = Math.hypot(after.x - before.x, after.y - before.y);
  assert.ok(travelled > 0, `dash should move the player, moved ${travelled}`);

  env.keyUp('KeyD');
  env.keyUp('Space');
});

test('dash is faster than a normal move over the same frames', () => {
  startRun();
  assert.ok(waitForDashReady());

  env.keyDown('KeyD');
  env.frames(4);
  const walkStart = game.frameState();
  env.frames(4);
  const walkEnd = game.frameState();
  const walked = Math.hypot(walkEnd.x - walkStart.x, walkEnd.y - walkStart.y);

  assert.ok(waitForDashReady());
  const dashStart = game.frameState();
  env.keyDown('Space');
  env.frames(4);
  const dashEnd = game.frameState();
  const dashed = Math.hypot(dashEnd.x - dashStart.x, dashEnd.y - dashStart.y);

  assert.ok(dashed > walked, `dash (${dashed}) should outrun a walk (${walked})`);
  env.keyUp('KeyD');
  env.keyUp('Space');
});

test('Shift dashes as well as Space', () => {
  startRun();
  assert.ok(waitForDashReady());
  env.keyDown('KeyW');
  env.step(16);
  env.keyDown('ShiftLeft');
  assert.ok(game.frameState().dashTime > 0, 'ShiftLeft should dash');
  env.keyUp('ShiftLeft');
  env.keyUp('KeyW');
});

test('dash respects its cooldown and recharges', () => {
  startRun();
  assert.ok(waitForDashReady());

  env.keyDown('KeyD');
  env.step(16);
  env.keyDown('Space');
  const first = game.frameState();
  assert.ok(first.dashCooldown > 0);

  // A second press while cooling down must be rejected, not re-arm the timer.
  env.keyUp('Space');
  env.frames(10);
  const cooling = game.frameState();
  env.keyDown('Space');
  const rejected = game.frameState();
  assert.ok(
    rejected.dashCooldown <= cooling.dashCooldown,
    'a dash on cooldown must not re-arm the cooldown',
  );

  env.keyUp('Space');
  assert.ok(waitForDashReady(), 'dash should recharge');
  assert.equal(game.frameState().dashCooldown, 0);
  env.keyUp('KeyD');
});

test('gamepad B and RB dash, with a rising edge required', () => {
  startRun();
  env.setGamepadAttached(true);
  env.gamepad.axes[0] = 0.9; // hold right on the stick so the dash has a vector
  assert.ok(waitForDashReady());

  const before = game.frameState();
  env.gamepad.buttons[1].pressed = true; // B
  env.step(16);
  const afterB = game.frameState();
  assert.ok(afterB.dashTime > 0, 'gamepad B should dash');
  assert.ok(afterB.dashCooldown > 0, 'gamepad dash should arm the cooldown');

  env.frames(3);
  const moved = game.frameState();
  assert.ok(
    Math.hypot(moved.x - before.x, moved.y - before.y) > 0,
    'gamepad dash should move the player',
  );

  // Holding the button must not chain-dash once the cooldown expires; the game
  // latches on the rising edge only.
  assert.ok(waitForDashReady(), 'dash should recharge while B is still held');
  env.step(16);
  assert.equal(game.frameState().dashTime, 0, 'held B must not auto-dash');

  env.gamepad.buttons[1].pressed = false;
  env.step(16);
  env.gamepad.buttons[5].pressed = true; // RB
  env.step(16);
  assert.ok(game.frameState().dashTime > 0, 'gamepad RB should dash');

  env.gamepad.buttons[5].pressed = false;
  env.gamepad.axes[0] = 0;
  env.setGamepadAttached(false);
});

test('dash works in both input modes within one run', () => {
  startRun();

  assert.ok(waitForDashReady());
  env.keyDown('KeyA');
  env.step(16);
  env.keyDown('Space');
  assert.ok(game.frameState().dashTime > 0, 'keyboard dash');
  env.keyUp('Space');
  env.keyUp('KeyA');

  env.setGamepadAttached(true);
  assert.ok(waitForDashReady());
  env.gamepad.axes[1] = 0.9;
  env.gamepad.buttons[1].pressed = true;
  env.step(16);
  assert.ok(game.frameState().dashTime > 0, 'gamepad dash in the same run');

  env.gamepad.buttons[1].pressed = false;
  env.gamepad.axes[1] = 0;
  env.setGamepadAttached(false);
});

test('dash is inert outside play state', () => {
  startRun();
  assert.ok(waitForDashReady());
  game.pause();
  env.keyDown('Space');
  assert.equal(game.frameState().dashTime, 0, 'paused runs must not dash');
  env.keyUp('Space');
  game.resume();
});
