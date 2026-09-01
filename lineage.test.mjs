import test from 'node:test';
import assert from 'node:assert/strict';
import {generateCreatureGenome,generateEvolutionLine,evolveCreatureGenome,breedCreatureGenomes} from './public/lineage-v4.js';

test('evolution line preserves root morphotype and lineage identity',()=>{
 const line=generateEvolutionLine('LINE-A',{world:0,morphotype:'quadruped',role:'predator'});
 assert.equal(line.length,3);
 assert.deepEqual(line.map(x=>x.morphotype),['quadruped','quadruped','quadruped']);
 assert.deepEqual(line.map(x=>x.lineage.stage),[1,2,3]);
 assert.ok(line.every(x=>x.lineage.rootSeed==='LINE-A'));
 assert.equal(line[2].lineage.role,'predator');
 assert.ok(line[2].presentation.scale>line[0].presentation.scale);
});

test('specialization changes combat profile rather than labels only',()=>{
 const root=generateCreatureGenome('LINE-B',{world:0,morphotype:'heavy-biped'});
 const artillery=evolveCreatureGenome(root,3,{role:'artillery'});
 const bulwark=evolveCreatureGenome(root,3,{role:'bulwark'});
 assert.ok(artillery.stats.projectiles>root.stats.projectiles);
 assert.ok(bulwark.stats.hp>root.stats.hp);
 assert.ok(bulwark.stats.armor>=root.stats.armor);
});

test('breeding preserves a parent silhouette while inheriting recessive traits',()=>{
 const a=generateCreatureGenome('PARENT-A',{morphotype:'avian',world:2});
 const b=generateCreatureGenome('PARENT-B',{morphotype:'insectoid',world:2});
 const child=breedCreatureGenomes(a,b,{seed:'CHILD-AB'});
 assert.ok(['avian','insectoid'].includes(child.morphotype));
 assert.equal(child.lineage.hybrid,true);
 assert.match(child.lineage.parentSeed,/PARENT-A\+PARENT-B/);
 assert.equal(child.seed,'CHILD-AB');
});
