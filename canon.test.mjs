// Cosmic naming.
//
// Scope is deliberately narrow: PLAYER-FACING SHIPPED STRINGS ONLY. The README,
// code comments and internal docs keep their historical names — purging those
// buys nothing and costs review time. What matters is what a player reads.
//
// The other half of the contract is the one that protects saves: IDs NEVER
// CHANGE. Every rename here is a display name keyed off an unchanged id, so a
// player's shop upgrades, codex entries, retention store and equipped salvage
// all survive the rename. The frozen id lists below fail loudly if a key is
// ever renamed along with its label.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  TITLE, CURRENCY, CURRENCY_MARK, ORBITS, COMMANDER_NAMES, DECK_NAMES,
  FINAL_COMMANDER, FINAL_ORBIT, OBSERVATORY, commanderName, orbitName, isFinalCommander,
} from './public/canon.js';
import {BOSSES, SECTOR_DECKS, SALVAGE_FAMILIES} from './public/sector-content.js';
import {ALL_BLESSINGS} from './public/content-v1.js';

// --- string extraction -------------------------------------------------------
// A small scanner rather than a regex: it tracks whether it is inside a string,
// a template literal or a comment, so a comment containing quotes cannot be
// mistaken for copy and a string containing `//` (like 'FRAME // SOVEREIGN')
// cannot be mistaken for a comment.
function stringLiterals(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
    if (c === "'" || c === '"' || c === '`') {
      const quote = c;
      let value = '';
      i++;
      while (i < src.length && src[i] !== quote) {
        if (src[i] === '\\') { value += src[i + 1] === 'n' ? ' ' : src[i + 1]; i += 2; continue; }
        // Skip template interpolations; they are code, not copy.
        if (quote === '`' && src[i] === '$' && src[i + 1] === '{') {
          let depth = 1; i += 2;
          while (i < src.length && depth > 0) { if (src[i] === '{') depth++; else if (src[i] === '}') depth--; i++; }
          value += ' ';
          continue;
        }
        value += src[i]; i++;
      }
      i++;
      out.push(value);
      continue;
    }
    i++;
  }
  return out;
}

/** Copy a player could read, as opposed to an id, a selector or a class name. */
function looksLikeCopy(s) {
  if (!s || s.length < 3) return false;
  if (/^[#.][\w-]+$/.test(s)) return false;                 // selectors
  if (/^[a-z][a-z0-9]*([-_][a-z0-9]+)*$/.test(s)) return false; // ids / keys
  if (/^[\w-]+\.(js|css|html|mjs|json)$/.test(s)) return false;  // module paths
  if (/^(hsl|rgba?|#[0-9a-f]{3,8})/i.test(s)) return false;      // colours
  return /[A-Z]{2,}/.test(s) || /[A-Za-z]\s+[A-Za-z]/.test(s);
}

function htmlText(html) {
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const text = body.replace(/<[^>]+>/g, '');
  const attrs = [...body.matchAll(/\b(?:title|aria-label|placeholder|alt)\s*=\s*"([^"]*)"/gi)].map((m) => m[1]);
  return [...text.split(''), ...attrs].map((s) => s.trim()).filter(Boolean);
}

/** Every shipped surface a player reads from. Never README, never comments. */
function playerFacingStrings() {
  const out = [];
  const dir = new URL('./public/', import.meta.url);
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir.pathname, file);
    if (file.endsWith('.js')) {
      for (const s of stringLiterals(fs.readFileSync(full, 'utf8'))) {
        if (looksLikeCopy(s)) out.push({file, text: s});
      }
    } else if (file.endsWith('.html')) {
      for (const s of htmlText(fs.readFileSync(full, 'utf8'))) out.push({file, text: s});
    }
  }
  return out;
}

// Retired vocabulary. Matched as whole words, case-insensitively.
const RETIRED = [
  'mech survivor', 'frame zero',
  'salvage', 'sector', 'sectors',
  'blessing', 'blessings', 'blight', 'blighted',
  'crown breaker', 'glass oracle', 'war foundry', 'void regent', 'last engine',
];

/**
 * Markup hooks inside a copy string are ids, not words. `id="garage-salvage-tab"`
 * MUST keep its name — the brief's whole point is that keys stay stable while
 * labels change — so the lint reads past them to the text between the tags.
 */
function copyOnly(text) {
  return text.replace(/\b(?:id|class|data-[\w-]+|href|src|for|name)\s*=\s*(?:"[^"]*"|'[^']*')/gi, ' ');
}

test('no retired name survives on a surface a player reads', () => {
  const offenders = [];
  for (const {file, text: raw} of playerFacingStrings()) {
    const text = copyOnly(raw);
    for (const term of RETIRED) {
      const re = new RegExp(`\\b${term.replace(/ /g, '\\s+')}\\b`, 'i');
      if (re.test(text)) offenders.push(`${file}: "${raw.slice(0, 90)}" (${term})`);
    }
  }
  assert.deepEqual(offenders, [], `retired names still shipped:\n  ${offenders.join('\n  ')}`);
});

test('the lint can actually see player copy', () => {
  // A lint that matches nothing is not a lint. Prove it reads real surfaces.
  const strings = playerFacingStrings();
  assert.ok(strings.length > 200, `only extracted ${strings.length} player-facing strings`);
  const joined = strings.map((s) => s.text).join('\n');
  assert.match(joined, /ORBIT/, 'orbit vocabulary should be present');
  assert.match(joined, /STARDUST/, 'the currency should be present');
  assert.ok(strings.some((s) => s.file === 'index.html'), 'index.html should contribute copy');
});

test('the lint reads copy past markup hooks that must keep their names', () => {
  // The id stays `garage-salvage-tab` forever; only the label between the tags
  // is player-facing, and only that is linted.
  const markup = '<button id="garage-salvage-tab" class="sector-tab">STARDUST</button>';
  assert.doesNotMatch(copyOnly(markup), /salvage/i, 'an id is not copy');
  assert.doesNotMatch(copyOnly(markup), /sector/i, 'a class name is not copy');
  assert.match(copyOnly(markup), /STARDUST/, 'the label still is');
});

test('the lint ignores ids, selectors and module paths', () => {
  assert.equal(looksLikeCopy('sector-1'), false);
  assert.equal(looksLikeCopy('#shop-open'), false);
  assert.equal(looksLikeCopy('./arsenal.js'), false);
  assert.equal(looksLikeCopy('blighted_halo'), false);
  assert.equal(looksLikeCopy('SELECT ORBIT'), true);
});

test('the lint reads strings, not comments, and survives // inside a string', () => {
  const src = [
    "// SECTOR SALVAGE BLESSING in a comment must be ignored",
    "/* SECTOR in a block comment too */",
    "const a='FRAME // SOVEREIGN';",
    "const b=`ORBIT ${x} CLEAR`;",
  ].join('\n');
  const found = stringLiterals(src);
  assert.ok(found.includes('FRAME // SOVEREIGN'), 'a string containing // must survive intact');
  assert.ok(found.some((s) => s.includes('ORBIT') && s.includes('CLEAR')), 'template copy is extracted');
  assert.ok(!found.some((s) => s.includes('in a comment')), 'comments are not copy');
});

// --- ids stay stable ---------------------------------------------------------

test('renaming never touched an id', () => {
  // These lists are frozen on purpose. Saves, the codex and the retention store
  // key off them; a rename that reached a key would orphan real progress.
  assert.deepEqual(BOSSES.map((b) => b.id), ['crown-breaker', 'glass-oracle', 'war-foundry', 'void-regent', 'last-engine']);
  assert.deepEqual(SECTOR_DECKS.map((d) => d.id), ['sector-1', 'sector-2', 'sector-3', 'sector-4', 'sector-5']);
  assert.deepEqual(SALVAGE_FAMILIES.map((s) => s.id).slice(0, 5), ['crown', 'oracle', 'foundry', 'regent', 'engine']);
  for (const id of ['seraphic_conduction', 'aegis_memory', 'blighted_halo', 'warped_reactor', 'fractured_aegis']) {
    assert.ok(ALL_BLESSINGS.some((b) => b.id === id), `${id} must keep its id`);
  }
});

test('every commander id has a cosmic display name and keeps its own identity', () => {
  for (const boss of BOSSES) {
    assert.ok(COMMANDER_NAMES[boss.id], `${boss.id} has no canon name`);
    assert.equal(boss.name, COMMANDER_NAMES[boss.id], `${boss.id} ships a name canon does not know`);
  }
  const names = BOSSES.map((b) => b.name);
  assert.equal(new Set(names).size, 5, 'the five commanders must stay five distinct names');
  const patterns = BOSSES.map((b) => b.pattern);
  assert.equal(new Set(patterns).size, 5, 'the five commanders must keep five distinct patterns');
  const rewards = BOSSES.map((b) => b.rewardFamily);
  assert.equal(new Set(rewards).size, 5, 'the five commanders must keep five distinct reward lines');
});

test('the False Sun is the final commander, in the Heart of the Sun', () => {
  const final = BOSSES.find((b) => b.id === FINAL_COMMANDER);
  assert.ok(final, 'the final commander must exist');
  assert.equal(final.name, 'THE FALSE SUN');
  assert.equal(final.world, FINAL_ORBIT, 'the False Sun sits in the last orbit');
  assert.equal(orbitName(FINAL_ORBIT), 'The Heart of the Sun');
  assert.equal(isFinalCommander('last-engine'), true);
  // And it is the only one. The other four are its approach, not copies of it.
  for (const boss of BOSSES.filter((b) => b.id !== FINAL_COMMANDER)) {
    assert.doesNotMatch(boss.name, /FALSE SUN/, `${boss.id} should not be a second False Sun`);
  }
});

test('the five orbits are named, ordered and complete', () => {
  assert.equal(ORBITS.length, 5);
  assert.deepEqual(ORBITS.map((o) => o.name), [
    'The Dark Edge', 'The Comet Field', 'The Broken Belt', 'The Shattered Orbit', 'The Heart of the Sun',
  ]);
  for (const orbit of ORBITS) {
    assert.ok(orbit.sub && orbit.color, `${orbit.id} is missing flavour or colour`);
  }
  assert.equal(new Set(ORBITS.map((o) => o.id)).size, 5);
  assert.equal(Object.keys(DECK_NAMES).length, 5);
});

// --- the Observatory is a structure, not a label -----------------------------

test('the Observatory is a hub with four real spaces', () => {
  const html = fs.readFileSync(new URL('./public/index.html', import.meta.url), 'utf8');
  assert.match(html, /id="observatory"/, 'the hub needs its own screen');
  assert.match(html, /id="observatory-open"/, 'the title needs one way into the hub');
  assert.equal(OBSERVATORY.spaces.length, 4);

  for (const space of OBSERVATORY.spaces) {
    const id = space.screen.slice(1);
    assert.match(html, new RegExp(`id="${id}"`), `${space.name} points at #${id}, which does not exist`);
    assert.ok(space.desc, `${space.name} has no description`);
  }
  // Each space's entry button lives inside the hub, not loose on the title.
  const hub = html.slice(html.indexOf('id="observatory"'), html.indexOf('id="worlds"'));
  for (const id of ['shop-open', 'class-open', 'awards-open', 'creature-lab-open']) {
    assert.ok(hub.includes(`id="${id}"`), `${id} should live inside the Observatory`);
  }
  const title = html.slice(html.indexOf('id="title"'), html.indexOf('id="observatory"'));
  for (const id of ['shop-open', 'class-open', 'awards-open', 'creature-lab-open']) {
    assert.ok(!title.includes(`id="${id}"`), `${id} should no longer sit on the title screen`);
  }
});

test('canon is the only place the names live', () => {
  assert.equal(TITLE, 'SUNFALL');
  assert.equal(CURRENCY, 'STARDUST');
  assert.equal(CURRENCY_MARK, '✦');
  assert.equal(commanderName('war-foundry'), 'BELT FORGE');
  assert.equal(commanderName('unknown-id'), 'UNKNOWN-ID', 'an unknown id degrades rather than throwing');
});
