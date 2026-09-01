import test from 'node:test';
import assert from 'node:assert/strict';
import {generateCreatureGenome} from './public/motion-v5.js';
import {adaptGenome,adaptLine,BIOMES} from './public/adaptation-v5.js';

test('regional adaptations preserve species identity while changing environment pressure',()=>{
 const base=generateCreatureGenome('regional',{morphotype:'hunter'}),veil=adaptGenome(base,1,{seed:'veil'}),forge=adaptGenome(base,2,{seed:'forge'});assert.equal(veil.morphotype,base.morphotype);assert.equal(veil.signature.motif,base.signature.motif);assert.notEqual(veil.presentation.hue,base.presentation.hue);assert.ok(forge.stats.armor>=base.stats.armor)
});

test('adapted evolution lines retain lineage signatures',()=>{
 const line=[1,2,3].map(stage=>generateCreatureGenome(`line-${stage}`,{morphotype:'plant-beast'})),adapted=adaptLine(line,4,{seed:'crown'});assert.equal(adapted.length,3);assert.ok(adapted.every(g=>g.adaptation.biome===BIOMES[4].id))
});
