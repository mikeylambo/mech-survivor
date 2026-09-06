// Radar.
//
// The design rule is a negative one and therefore the important thing to test:
// NEVER individual swarm dots. A radar that plots every trash enemy is a
// second, worse view of the playfield.
import test from 'node:test';
import assert from 'node:assert/strict';
import {radarContacts, drawRadar, CONTACT_STYLE, NEVER_PLOTTED, DEFAULT_RANGE} from './public/radar.js';

const player = {x: 0, y: 0};

function field() {
  return {
    player,
    enemies: [
      {t: 'boss', x: 600, y: 0, dead: false},
      {t: 'elite', x: -300, y: 200, dead: false},
      {t: 'elite', x: 100, y: -400, dead: true},   // dead: not a contact
      ...Array.from({length: 120}, (_, i) => ({t: 'swarm', x: i * 7, y: i * 3, dead: false})),
      ...Array.from({length: 20}, (_, i) => ({t: 'brute', x: -i * 9, y: i * 4, dead: false})),
    ],
    caches: [{x: 250, y: 250}, {x: -800, y: 100, taken: true}],
    objective: {x: 0, y: 900},
  };
}

test('the radar never plots individual swarm dots', () => {
  const contacts = radarContacts(field());
  const kinds = new Set(contacts.map((c) => c.kind));
  for (const banned of NEVER_PLOTTED) {
    assert.ok(!kinds.has(banned), `${banned} reached the radar`);
  }
  assert.deepEqual([...kinds].sort(), ['cache', 'commander', 'elite', 'objective']);
  // 140 trash enemies on the field, four contacts on the radar.
  assert.equal(contacts.length, 4, `expected 4 contacts, got ${contacts.length}`);
});

test('it plots exactly what the brief asked for', () => {
  const contacts = radarContacts(field());
  const byKind = Object.fromEntries(contacts.map((c) => [c.kind, c]));
  assert.ok(byKind.commander, 'the commander is on the radar');
  assert.ok(byKind.elite, 'elites are on the radar');
  assert.ok(byKind.cache, 'caches are on the radar');
  assert.ok(byKind.objective, 'the active objective is on the radar');
  assert.equal(contacts.filter((c) => c.kind === 'elite').length, 1, 'a dead elite is not a contact');
  assert.equal(contacts.filter((c) => c.kind === 'cache').length, 1, 'a taken cache is not a contact');
});

test('the commander outranks everything else on the display', () => {
  const contacts = radarContacts(field());
  assert.equal(contacts[0].kind, 'commander', 'the commander sorts first');
  for (const kind of Object.keys(CONTACT_STYLE)) {
    assert.ok(Number.isFinite(CONTACT_STYLE[kind].priority), `${kind} has no priority`);
  }
});

test('the player is always the centre', () => {
  const off = {x: 5000, y: -3000};
  const contacts = radarContacts({player: off, enemies: [{t: 'boss', x: 5300, y: -3000, dead: false}]});
  assert.equal(contacts.length, 1);
  assert.equal(Math.round(contacts[0].dx), 300, 'contacts are relative to the frame, not the world origin');
  assert.equal(Math.round(contacts[0].dy), 0);
});

test('out-of-range contacts become rim markers instead of lies or omissions', () => {
  const far = radarContacts({player, enemies: [{t: 'boss', x: DEFAULT_RANGE * 4, y: 0, dead: false}]});
  assert.equal(far.length, 1, 'a distant commander is still reported');
  assert.equal(far[0].edge, true, 'and is flagged as off-range');
  assert.ok(Math.abs(Math.hypot(far[0].dx, far[0].dy) - DEFAULT_RANGE) < 1e-6, 'clamped to the rim, not plotted beyond it');
  assert.ok(far[0].dist > DEFAULT_RANGE, 'the true distance is preserved for anyone who wants it');

  const near = radarContacts({player, enemies: [{t: 'boss', x: 100, y: 0, dead: false}]});
  assert.equal(near[0].edge, false);
});

test('an empty field draws a radar with nothing on it rather than nothing at all', () => {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : (o[k] = (...a) => calls.push(k))),
    set: (o, k, v) => { o[k] = v; return true; },
  });
  const contacts = drawRadar(ctx, {cx: 100, cy: 100, player, enemies: [], caches: []});
  assert.deepEqual(contacts, []);
  assert.ok(calls.includes('arc'), 'the housing and the frame marker are still drawn');
  assert.ok(calls.includes('save') && calls.includes('restore'), 'canvas state is balanced');
});

test('drawing reports back exactly what the player was shown', () => {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : (o[k] = (...a) => calls.push(k))),
    set: (o, k, v) => { o[k] = v; return true; },
  });
  const contacts = drawRadar(ctx, {cx: 0, cy: 0, ...field()});
  assert.equal(contacts.length, 4);
  assert.ok(calls.filter((c) => c === 'arc').length >= 5, 'housing, frame and each in-range contact');
  assert.ok(!contacts.some((c) => NEVER_PLOTTED.includes(c.kind)));
});

test('no player, no radar contacts', () => {
  assert.deepEqual(radarContacts({}), []);
  assert.deepEqual(radarContacts({player: null, enemies: [{t: 'boss', x: 1, y: 1}]}), []);
});
