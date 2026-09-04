import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const retention=fs.readFileSync('public/retention.js','utf8'),meta=fs.readFileSync('public/meta.js','utf8'),rewards=fs.readFileSync('public/rewards.js','utf8'),pass=fs.readFileSync('pass-l.mjs','utf8');
test('garage supports equipment calibration discoveries and prototypes',()=>{for(const token of['equipped','calibration','discoveredConfigurations','prototypes','getLoadoutBonuses'])assert.ok(retention.includes(token),token)});
test('authored salvage families feed recovered items',()=>{assert.ok(rewards.includes('familyName'));assert.ok(rewards.includes('bossForWorld'));assert.ok(rewards.includes('SALVAGE_FAMILIES'))});
test('meta bonuses consume garage loadout and reset both saves',()=>{assert.ok(meta.includes('getLoadoutBonuses'));assert.ok(meta.includes('MechRetention?.reset'))});
test('boss relic prototype seeds a compatible run weapon',()=>{assert.ok(pass.includes('GARAGE PROTOTYPE //'));assert.ok(pass.includes('startFamily'));assert.ok(pass.includes('player.arsenal'))});
