import test from 'node:test';
import assert from 'node:assert/strict';
import {generateCreatureGenome} from './public/species-v5.js';
import {createApexGenome,apexPhase,APEX_MUTATIONS} from './public/apex-v5.js';

test('apex keeps species identity while gaining boss grammar',()=>{
 const base=generateCreatureGenome('APEX-A',{morphotype:'kaiju',world:2});
 const boss=createApexGenome(base,{seed:'APEX-A-BOSS',mutation:'multi-core'});
 assert.equal(boss.morphotype,base.morphotype);
 assert.equal(boss.signature.motif,base.signature.motif);
 assert.equal(boss.rank,'boss');
 assert.equal(boss.apex.mutation,'multi-core');
 assert.ok(boss.presentation.scale>base.presentation.scale);
 assert.ok(boss.stats.hp>base.stats.hp);
});

test('apex phase grammar maps hp thresholds to anatomy-linked behaviors',()=>{
 const base=generateCreatureGenome('APEX-B',{morphotype:'avian'});
 const boss=createApexGenome(base,{mutation:'wing-mantle'});
 assert.equal(apexPhase(boss,.9).phase,1);
 assert.equal(apexPhase(boss,.5).phase,2);
 assert.equal(apexPhase(boss,.1).phase,3);
 assert.deepEqual(boss.apex.phaseGenes,['strafe','swoop','storm']);
});

test('all apex mutations are selectable',()=>assert.ok(APEX_MUTATIONS.length>=7));
