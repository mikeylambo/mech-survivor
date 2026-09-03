import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRunDirector,FORMATIONS,OBJECTIVE_ARCHETYPES,DIRECTOR_SLOTS,formationOffsets} from './public/director.js';
import {generateRunSalvage,SALVAGE_SLOTS,SALVAGE_RARITIES,salvageDismantleValue} from './public/rewards.js';

test('director exposes reusable formations objectives and three run punctuation slots',()=>{
 assert.ok(Object.keys(FORMATIONS).length>=6);
 assert.ok(Object.keys(OBJECTIVE_ARCHETYPES).length>=8);
 assert.equal(DIRECTOR_SLOTS.length,3);
 assert.deepEqual(DIRECTOR_SLOTS.map(x=>x.kind),['opportunity','opportunity','crisis']);
 const d=createRunDirector({world:2,seed:'contract'});
 assert.equal(d.slots.length,3);
 for(const e of d.slots){assert.ok(e.target>0);assert.ok(e.payout>0);assert.ok(FORMATIONS[e.formation])}
 assert.ok(formationOffsets('pincer').length>=4);
});

test('every completed run produces persistent salvage-shaped objects',()=>{
 const summary={world:1,kills:180,level:14,corruption:.4,director:{completed:2}};
 const items=generateRunSalvage(summary,false,'guaranteed-contract');
 assert.ok(items.length>=1);
 for(const item of items){assert.ok(SALVAGE_SLOTS.some(x=>x.id===item.slot));assert.ok(SALVAGE_RARITIES.some(x=>x.id===item.rarity));assert.ok(item.affixes.length>=1);assert.ok(salvageDismantleValue(item)>=1)}
});

test('runtime integrates director objective payouts and retention loop',()=>{
 const game=fs.readFileSync('./public/game.js','utf8'),meta=fs.readFileSync('./public/meta.js','utf8');
 for(const token of ['createRunDirector','tickRunDirector','spawnFormation','OPPORTUNITY','CRISIS','director-objective','director:{completed'])assert.ok(game.includes(token),token+' missing');
 for(const token of ['generateRunSalvage','reward-reveal','GARAGE','renderGarage','reliquary','DISMANTLE','salvage:[]'])assert.ok(meta.includes(token),token+' missing');
});
