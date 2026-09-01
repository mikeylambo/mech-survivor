import test from 'node:test';
import assert from 'node:assert/strict';
import {generateCreatureGenome,generateEvolutionLine,breedCreatureGenomes,GAITS} from './public/motion-v5.js';

test('every morphotype maps to a deterministic gait profile',()=>{
 for(const morph of Object.keys(GAITS)){const a=generateCreatureGenome('motion-seed',{morphotype:morph}),b=generateCreatureGenome('motion-seed',{morphotype:morph});assert.equal(a.motion.name,GAITS[morph].name);assert.deepEqual(a.motion,b.motion)}
});

test('evolution exaggerates gait while preserving identity',()=>{
 const line=generateEvolutionLine('runner-line',{morphotype:'quadruped'});assert.equal(line[0].motion.name,'bound');assert.equal(line[2].motion.name,'bound');assert.ok(line[2].motion.bob>line[0].motion.bob);assert.ok(line[2].motion.stride>line[0].motion.stride)
});

test('breeding inherits a coherent dominant gait',()=>{
 const a=generateCreatureGenome('a',{morphotype:'avian'}),b=generateCreatureGenome('b',{morphotype:'heavy-biped'}),child=breedCreatureGenomes(a,b,{seed:'child'});assert.ok(['glide','lumber'].includes(child.motion.name));assert.ok(child.motion.cadence>0)
});
