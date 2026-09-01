import test from 'node:test';
import assert from 'node:assert/strict';
import {generateCreatureGenome,resetRuntimeEcologies} from './public/creatures.js';

test('gameplay-style genome calls route through sector ecology',()=>{
 resetRuntimeEcologies();const early=generateCreatureGenome('2-100-0-11',{world:2,rank:'swarm',difficulty:1}),late=generateCreatureGenome('2-1900-1-12',{world:2,rank:'swarm',difficulty:2});assert.ok(early.ecology?.familyId);assert.ok(late.ecology?.familyId);assert.ok(early.signature?.motif);assert.ok(early.motion?.name);assert.ok(late.ecology.stage>=early.ecology.stage)
});

test('gameplay boss calls promote a local family into an apex descendant',()=>{
 resetRuntimeEcologies();const boss=generateCreatureGenome('3-2400-0-99',{world:3,rank:'boss',difficulty:3});assert.equal(boss.rank,'boss');assert.ok(boss.ecology?.familyId);assert.ok(boss.apex?.mutation);assert.equal(boss.lineage?.stage,3)
});
