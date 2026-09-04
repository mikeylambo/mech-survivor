import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ARSENAL_FAMILIES,createInitialArsenal} from './public/arsenal.js';
import {CONFIGURATIONS,evaluateBuildIdentity} from './public/configurations.js';
import {frameHardwareSummary} from './public/arsenal-visuals.js';

test('all arsenal families have visible hardpoint grammar coverage',()=>{
 const src=fs.readFileSync('./public/arsenal-visuals.js','utf8');
 for(const f of ARSENAL_FAMILIES)assert.ok(src.includes("case'"+f.id+"'"),f.id+' visual grammar missing');
});

test('frame hardware summary tracks installed evolved and exotic systems',()=>{
 const p={arsenal:createInitialArsenal('rook')};
 p.arsenal.temporal={tier:6,branch:'a',evo:2};p.arsenal.rail={tier:5,branch:null,evo:0};
 const h=frameHardwareSummary(p);assert.ok(h.installed>=3);assert.ok(h.heavy>=2);assert.equal(h.evolved,1);assert.equal(h.exotic,1);
});

test('all 36 configurations have explicit runtime behavior coverage',()=>{
 const src=fs.readFileSync('./public/configuration-runtime.js','utf8');
 assert.equal(CONFIGURATIONS.length,36);
 for(const c of CONFIGURATIONS)assert.ok(src.includes("has('"+c.id+"')"),c.id+' runtime behavior missing');
});

test('apex configuration recognition survives full investment',()=>{
 const arsenal=createInitialArsenal('rook');
 for(const id of['temporal','prism','funnels'])arsenal[id]={tier:6,branch:'a',evo:3};
 const r=evaluateBuildIdentity(arsenal,new Set());
 assert.ok(r.active.has('broken-heaven'));assert.equal(r.primary?.id,'broken-heaven');
});

test('generated runtime integrates hardpoints and configuration mechanics',()=>{
 const game=fs.readFileSync('./public/game.js','utf8');
 for(const token of['drawArsenalHardpoints','tickConfigurations','configurationDamageModifier'])assert.ok(game.includes(token),token+' missing');
});
