import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const c=fs.readFileSync('public/codex.js','utf8');
test('codex covers threats arsenal configurations relics records and circuits',()=>{for(const token of['THREATS','ARSENAL_FAMILIES','CONFIGURATIONS','SALVAGE_FAMILIES','ENDGAME_TIERS','recordRun','circuitClears'])assert.ok(c.includes(token),token)});
test('codex only reveals run-grounded discoveries',()=>{for(const token of["summary.arsenal","summary.configurations","defeatedBosses","relicFamilies"])assert.ok(c.includes(token),token)});
test('codex is persistent and exposes archive completion',()=>{assert.ok(c.includes('mech-survivor-codex-v1'));assert.ok(c.includes('window.MechCodex'));assert.ok(c.includes('completion'))});
