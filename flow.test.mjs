// Death/retry and controller-navigation regressions.
//
// Both areas were broken by seams between game.js and meta.js rather than by
// either file on its own, so these tests boot the real pair and drive them the
// way a player would.
//
//   * `pass-o` moved `window.mechGame.stop()` ahead of the loss branch in
//     endRun(). stop() forces state back to 'title', which overwrote the 'dead'
//     state die() had just set — so the Enter/Space retry the title screen
//     advertises could never fire. Only the mouse could redeploy.
//   * Pad focus was only re-anchored by meta.js's own screen(). game.js reveals
//     #levelup itself, so focus stayed parked on the HUD pause button and A
//     paused the run instead of choosing an upgrade.
//   * During a run the left stick is the movement stick and B is dash, yet the
//     menu driver treated both as menu input.
import test from 'node:test';
import assert from 'node:assert/strict';
import {installBrowserEnvironment} from './test-harness.mjs';

const env = installBrowserEnvironment();
await import('./public/game.js');
await import('./public/meta.js');
const game = globalThis.window.mechGame;
const $ = (sel) => env.document.querySelector(sel);

const visible = (sel) => !$(sel).classList.contains('hidden');

/** Play a run out until the frame dies and the results screen resolves. */
function playUntilDeath() {
  game.start(0);
  env.step(16);
  assert.equal(game.state, 'play');
  for (let i = 0; i < 12000; i++) {
    env.step(16);
    if (visible('#results')) return;
    // A level-up halts the simulation until a card is taken, so take one.
    if (visible('#levelup')) {
      const card = $('#choices').querySelectorAll('button')[0];
      if (card) { card.click(); env.step(16); }
    }
  }
  assert.fail('a run left alone should end within 12000 frames');
}

/** Play a run until the upgrade screen opens, steering so gems get collected. */
function playUntilLevelUp() {
  game.start(0);
  env.step(16);
  const dirs = ['KeyD', 'KeyS', 'KeyA', 'KeyW'];
  let held = null;
  for (let i = 0; i < 6000; i++) {
    if (i % 40 === 0) {
      if (held) env.keyUp(held);
      held = dirs[Math.floor(i / 40) % 4];
      env.keyDown(held);
    }
    env.step(16);
    if (visible('#levelup')) { if (held) env.keyUp(held); return true; }
  }
  if (held) env.keyUp(held);
  return false;
}

/** Leave whatever screen is up the way MAIN MENU does, from any state. */
function goToTitle() {
  $('#quit-menu').click();
  env.frames(3);
  assert.ok(visible('#title'), 'MAIN MENU should return to the title screen');
}

/** Detach the pad and clear any held inputs between tests. */
function resetInput() {
  env.setGamepadAttached(false);
  env.gamepad.axes[0] = 0;
  env.gamepad.axes[1] = 0;
  for (const b of env.gamepad.buttons) b.pressed = false;
  for (const code of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'Enter']) env.keyUp(code);
}

test('a lost run resolves into the results screen and stays dead', () => {
  resetInput();
  goToTitle();
  playUntilDeath();

  assert.equal(game.state, 'dead', 'a resolved loss must stay in the dead state');
  assert.ok(visible('#results'), 'results screen should be showing');
  assert.ok(!visible('#hud'), 'HUD should yield to the results screen');
  assert.ok($('#result-grid').innerHTML.includes('KILLS'), 'results should report the run');
});

test('Enter redeploys immediately from the death screen', () => {
  resetInput();
  goToTitle();
  playUntilDeath();

  env.keyDown('Enter');
  env.step(16);

  assert.equal(game.state, 'play', 'Enter should redeploy straight into a run');
  assert.ok(!visible('#results'), 'results screen should be gone');
  assert.equal(game.frameState().level, 1, 'the new run starts fresh');
  assert.ok(game.frameState().hp > 0, 'the new frame has integrity');
});

test('Space and the REDEPLOY button redeploy too', () => {
  resetInput();
  goToTitle();
  playUntilDeath();
  env.keyDown('Space');
  env.step(16);
  assert.equal(game.state, 'play', 'Space should redeploy');
  env.keyUp('Space');

  resetInput();
  playUntilDeath();
  $('#retry').click();
  env.step(16);
  assert.equal(game.state, 'play', 'REDEPLOY should redeploy');
});

test('two runs can be played back to back without an input regression', () => {
  resetInput();
  goToTitle();
  playUntilDeath();
  $('#retry').click();
  env.step(16);
  assert.equal(game.state, 'play');

  // The second run must still take input: move, then dash.
  env.keyDown('KeyD');
  env.frames(3);
  const before = game.frameState();
  assert.ok(env.stepUntil(() => game.frameState().dashCooldown <= 0, 400));
  env.keyDown('Space');
  const dashing = game.frameState();
  assert.ok(dashing.dashTime > 0, 'dash must still work in a retried run');
  env.frames(3);
  const after = game.frameState();
  assert.ok(Math.hypot(after.x - before.x, after.y - before.y) > 0, 'the frame still moves');
  env.keyUp('Space');
  env.keyUp('KeyD');
});

test('controller focus lands on a button of the screen that is actually showing', () => {
  resetInput();
  goToTitle();
  env.setGamepadAttached(true);
  env.frames(3);

  const focused = env.focusedButton();
  assert.ok(focused, 'a connected pad should have something focused');
  assert.ok(
    env.visibleButtons().includes(focused),
    'focus must be on a button that is on screen, not one on a hidden screen',
  );
  resetInput();
});

test('the d-pad only ever cycles buttons that are on screen', () => {
  resetInput();
  goToTitle();
  env.setGamepadAttached(true);
  env.frames(3);

  const seen = new Set();
  for (let i = 0; i < 8; i++) {
    env.gamepad.buttons[15].pressed = true; // d-pad right
    env.frames(2);
    env.gamepad.buttons[15].pressed = false;
    env.frames(2);
    const focused = env.focusedButton();
    assert.ok(focused, 'focus should never be lost while navigating');
    assert.ok(env.visibleButtons().includes(focused), `step ${i} focused an off-screen button`);
    seen.add(focused);
  }
  assert.ok(seen.size > 1, 'the d-pad should actually move focus');
  resetInput();
});

test('gamepad A activates the focused button in menus', () => {
  resetInput();
  goToTitle();
  env.setGamepadAttached(true);
  env.frames(3);

  let clicked = null;
  const focused = env.focusedButton();
  focused.addEventListener('click', () => { clicked = focused; });

  env.gamepad.buttons[0].pressed = true; // A
  env.frames(2);
  env.gamepad.buttons[0].pressed = false;
  env.frames(2);

  assert.equal(clicked, focused, 'A should press the focused button');
  resetInput();
});

test('mid-run the pad drives the mech, not the menus', () => {
  resetInput();
  goToTitle();
  game.start(0);
  env.step(16);
  env.setGamepadAttached(true);
  env.frames(3);

  const focusBefore = env.focusedButton();

  // The left stick is the movement stick; sweeping it must not walk menu focus.
  for (const [x, y] of [[0.9, 0], [0, 0.9], [-0.9, 0], [0, -0.9]]) {
    env.gamepad.axes[0] = x;
    env.gamepad.axes[1] = y;
    env.frames(3);
  }
  env.gamepad.axes[0] = 0;
  env.gamepad.axes[1] = 0;
  assert.equal(env.focusedButton(), focusBefore, 'stick movement must not move menu focus mid-run');

  // A must not reach the HUD pause button.
  env.gamepad.buttons[0].pressed = true;
  env.frames(3);
  env.gamepad.buttons[0].pressed = false;
  env.frames(2);
  assert.equal(game.state, 'play', 'A must not pause the run');

  resetInput();
});

test('START pauses and resumes a run from the pad', () => {
  resetInput();
  goToTitle();
  game.start(0);
  env.step(16);
  env.setGamepadAttached(true);
  env.frames(3);

  env.gamepad.buttons[9].pressed = true; // START
  env.frames(2);
  env.gamepad.buttons[9].pressed = false;
  env.frames(2);
  assert.equal(game.state, 'paused', 'START should pause');

  env.gamepad.buttons[9].pressed = true;
  env.frames(2);
  env.gamepad.buttons[9].pressed = false;
  env.frames(2);
  assert.equal(game.state, 'play', 'START should resume');

  resetInput();
});

test('the pad can choose an upgrade on the screen game.js raises itself', () => {
  resetInput();
  goToTitle();
  env.setGamepadAttached(true);
  assert.ok(playUntilLevelUp(), 'a moving run should reach an upgrade screen');
  env.frames(3);

  // game.js reveals #levelup directly rather than through meta.js's screen(),
  // so focus used to stay parked on the HUD pause button and A paused the run.
  const focused = env.focusedButton();
  assert.ok(focused, 'the upgrade screen should take pad focus');
  assert.ok(
    focused.closest('#levelup'),
    `pad focus should be inside the upgrade screen, was ${focused.id || focused.textContent}`,
  );

  env.gamepad.buttons[0].pressed = true; // A
  env.frames(2);
  env.gamepad.buttons[0].pressed = false;
  env.frames(2);

  assert.ok(!visible('#levelup'), 'A should take the upgrade and close the screen');
  assert.equal(game.state, 'play', 'the run resumes after choosing');
  resetInput();
});

test('after death the pad can reach REDEPLOY', () => {
  resetInput();
  goToTitle();
  playUntilDeath();
  env.setGamepadAttached(true);
  env.frames(3);

  const focused = env.focusedButton();
  assert.ok(focused, 'the results screen should take pad focus');
  assert.ok(focused.closest('#results'), 'pad focus should be on the results screen');

  // Walk to REDEPLOY and press A.
  for (let i = 0; i < 6 && env.focusedButton().id !== 'retry'; i++) {
    env.gamepad.buttons[15].pressed = true;
    env.frames(2);
    env.gamepad.buttons[15].pressed = false;
    env.frames(2);
  }
  assert.equal(env.focusedButton().id, 'retry', 'the pad should reach REDEPLOY');

  env.gamepad.buttons[0].pressed = true;
  env.frames(2);
  env.gamepad.buttons[0].pressed = false;
  env.frames(2);
  assert.equal(game.state, 'play', 'A on REDEPLOY should start a new run');

  resetInput();
});

test('the pad can reach a space inside the Observatory and back out to it', () => {
  resetInput();
  goToTitle();
  env.setGamepadAttached(true);
  env.frames(3);

  const walkTo = (id, limit = 10) => {
    for (let i = 0; i < limit && env.focusedButton()?.id !== id; i++) {
      env.gamepad.buttons[15].pressed = true;
      env.frames(2);
      env.gamepad.buttons[15].pressed = false;
      env.frames(2);
    }
    assert.equal(env.focusedButton()?.id, id, `the pad should reach #${id}`);
  };
  const pressA = () => {
    env.gamepad.buttons[0].pressed = true;
    env.frames(2);
    env.gamepad.buttons[0].pressed = false;
    env.frames(3);
  };

  // Title -> the hub.
  walkTo('observatory-open');
  pressA();
  assert.ok(visible('#observatory'), 'A should open the Observatory');
  assert.ok(!visible('#title'), 'the title screen yields to the hub');

  // Hub -> the Hangar, one of its four spaces.
  walkTo('shop-open');
  pressA();
  assert.ok(visible('#shop'), 'A should open the Hangar');
  assert.ok(env.focusedButton()?.closest('#shop'), 'focus should follow into the Hangar');

  // BACK returns to the hub it was opened from, not the title.
  env.gamepad.buttons[1].pressed = true;
  env.frames(2);
  env.gamepad.buttons[1].pressed = false;
  env.frames(3);
  assert.ok(visible('#observatory'), 'B should return to the Observatory, not the title');
  assert.ok(!visible('#title'), 'the hub is not the title screen');

  // And BACK again leaves the hub entirely.
  env.gamepad.buttons[1].pressed = true;
  env.frames(2);
  env.gamepad.buttons[1].pressed = false;
  env.frames(3);
  assert.ok(visible('#title'), 'B from the hub returns to the title');
  resetInput();
});
