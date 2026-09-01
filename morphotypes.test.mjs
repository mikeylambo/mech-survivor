import test from 'node:test';
import assert from 'node:assert/strict';
import {generateCreatureGenome,mutateCreatureGenome,creatureParts} from './public/morphotypes-v4.js';

test('morphotype grammar exposes the intended readable monster shapes',()=>{
  for(const m of ['small-biped','heavy-biped','hunter','quadruped','avian','insectoid','serpent','orb-blob','aquatic','plant-beast','kaiju'])assert.ok(creatureParts.morphotypes.includes(m),m);
});

test('forcing a morphotype is deterministic and preserves its silhouette family',()=>{
  for(const morphotype of creatureParts.morphotypes.filter(x=>x!=='mixed')){
    const a=generateCreatureGenome('shape-test',{world:2,morphotype});
    const b=generateCreatureGenome('shape-test',{world:2,morphotype});
    assert.equal(a.morphotype,morphotype);
    assert.deepEqual(a,b);
  }
});

test('small and heavy bipeds establish meaningfully different proportions',()=>{
  const small=generateCreatureGenome('same',{world:0,morphotype:'small-biped'});
  const heavy=generateCreatureGenome('same',{world:0,morphotype:'heavy-biped'});
  assert.ok(small.anatomy.proportions.head>heavy.anatomy.proportions.head);
  assert.ok(heavy.anatomy.proportions.thickness>small.anatomy.proportions.thickness);
  assert.ok(heavy.anatomy.proportions.shoulder>small.anatomy.proportions.shoulder);
});

test('specialized morphotypes carry coherent anatomical rules',()=>{
  const bird=generateCreatureGenome('bird',{world:1,morphotype:'avian'});
  const bug=generateCreatureGenome('bug',{world:1,morphotype:'insectoid'});
  const plant=generateCreatureGenome('plant',{world:2,morphotype:'plant-beast'});
  const fish=generateCreatureGenome('fish',{world:1,morphotype:'aquatic'});
  assert.ok(bird.appendages.some(x=>x.type==='fin'));
  assert.equal(bug.anatomy.structure.extraArms,true);
  assert.ok(plant.appendages.some(x=>x.type==='tendril'));
  assert.equal(fish.bodyPlan,'serpent');
});

test('mutation preserves a creature lineage and morphotype',()=>{
  const parent=generateCreatureGenome('lineage',{world:3,morphotype:'quadruped'});
  const child=mutateCreatureGenome(parent,1234);
  assert.equal(child.morphotype,parent.morphotype);
  assert.notEqual(child.seed,parent.seed);
});
