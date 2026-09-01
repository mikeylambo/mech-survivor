import test from 'node:test';
import assert from 'node:assert/strict';
import {generateCreatureGenome,mutateCreatureGenome,creatureParts} from './public/anatomy-v3.js';

test('creature genomes remain deterministic',()=>{
 const a=generateCreatureGenome('PARENT-001',{world:3,rank:'elite',family:'humanoid',parent:'hunter'});
 const b=generateCreatureGenome('PARENT-001',{world:3,rank:'elite',family:'humanoid',parent:'hunter'});
 assert.deepEqual(a,b);
});

test('humanoid parent can be forced and survives into genome',()=>{
 for(const parent of ['balanced','heavy','hunter','runner']){
  const g=generateCreatureGenome(`FORCE-${parent}`,{world:0,family:'humanoid',parent});
  assert.equal(g.bodyPlan,'humanoid');
  assert.equal(g.parent,parent);
  assert.equal(g.anatomy.parent,parent);
 }
 assert.deepEqual(creatureParts.parents,['mixed','balanced','heavy','hunter','runner']);
});

test('parent morphologies create meaningfully different silhouettes',()=>{
 const balanced=generateCreatureGenome('SHAPE',{world:0,family:'humanoid',parent:'balanced'}).anatomy.proportions;
 const heavy=generateCreatureGenome('SHAPE',{world:0,family:'humanoid',parent:'heavy'}).anatomy.proportions;
 const hunter=generateCreatureGenome('SHAPE',{world:0,family:'humanoid',parent:'hunter'}).anatomy.proportions;
 const runner=generateCreatureGenome('SHAPE',{world:0,family:'humanoid',parent:'runner'});
 assert.ok(heavy.shoulder>balanced.shoulder);
 assert.ok(heavy.thickness>balanced.thickness);
 assert.ok(hunter.arm>balanced.arm);
 assert.equal(runner.anatomy.structure.digitigrade,true);
 assert.ok(runner.anatomy.proportions.leg>balanced.leg);
});

test('tier zero preserves readable humanoid parent anatomy',()=>{
 for(let i=0;i<30;i++){
  const g=generateCreatureGenome(`LOW-${i}`,{world:0,family:'humanoid',parent:'balanced'});
  assert.equal(g.anatomy.structure.extraArms,false);
  assert.equal(g.anatomy.structure.splitTorso,false);
  assert.equal(g.anatomy.structure.twinHead,false);
  assert.equal(g.symmetry,'near');
 }
});

test('later tiers are allowed to attack the parent anatomy',()=>{
 const traits=new Set();
 for(let i=0;i<120;i++){
  const g=generateCreatureGenome(`HIGH-${i}`,{world:4,rank:i%9===0?'elite':'swarm',family:'humanoid'});
  for(const [key,value] of Object.entries(g.anatomy.structure))if(value===true)traits.add(key);
 }
 assert.ok(traits.has('extraArms')||traits.has('twinHead')||traits.has('splitTorso'));
 assert.ok(traits.size>=3);
});

test('mutation changes specimen without losing its parent lineage',()=>{
 const g=generateCreatureGenome('LINEAGE',{world:2,family:'humanoid',parent:'hunter'});
 const m=mutateCreatureGenome(g,42);
 assert.notEqual(m.seed,g.seed);
 assert.equal(m.bodyPlan,g.bodyPlan);
 assert.equal(m.parent,g.parent);
 assert.equal(m.anatomy.parent,g.anatomy.parent);
});
