import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const game=()=>fs.readFileSync(new URL('./public/game.js',import.meta.url),'utf8');
const meta=()=>fs.readFileSync(new URL('./public/meta.js',import.meta.url),'utf8');
const html=()=>fs.readFileSync(new URL('./public/index.html',import.meta.url),'utf8');

test('Pass A combat readability is present',()=>{const s=game();for(const token of ['hurtPlayer','healPlayer','combatText','ringFx','combat-vignette','hue:350','g.px=g.x','drawCombatText','drawRingFx'])assert.ok(s.includes(token),token+' missing');assert.ok(html().includes('pass-ab.css'));});

test('frames start with distinct combat kits',()=>{const s=game(),m=meta();for(const token of ['startingModules','base.orbit=1','base.thruster=1','base.armor=1','base.pulse=1','if(player.modules.beam<=0)return'])assert.ok(s.includes(token),token+' missing');for(const token of ['Starts with Cobalt Rail','Starts with Aegis Blades + Vector Thrusters','Starts with Argent Plating + Nova Pulse'])assert.ok(m.includes(token),token+' missing');});

test('all upgrade families have synergy depth and banish exists',()=>{const s=game();for(const token of ['TEMPEST RELAY','NANITE BASTION','tempestrelay','nanitebastion','banishes:1','banished:new Set','banishChoice','BANISH ·'])assert.ok(s.includes(token),token+' missing');});
