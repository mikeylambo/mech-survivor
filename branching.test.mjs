import test from 'node:test';
import assert from 'node:assert/strict';
import {generateEvolutionTree,branchCreatureGenome} from './public/branching-v6.js';

test('branching trees preserve ancestry while specializing final forms',()=>{
 const tree=generateEvolutionTree('branch-root',{morphotype:'hunter'});assert.equal(tree.branches.length,3);assert.ok(tree.branches.every(g=>g.signature.motif===tree.root.signature.motif));assert.ok(new Set(tree.branches.map(g=>g.branch.role)).size===3)
});

test('specialization changes combat expression rather than labels only',()=>{
 const tree=generateEvolutionTree('branch-stats',{morphotype:'heavy-biped'}),bulwark=branchCreatureGenome(tree.root,'bulwark'),artillery=branchCreatureGenome(tree.root,'artillery');assert.ok(bulwark.stats.hp>tree.root.stats.hp);assert.ok(artillery.stats.projectiles>tree.root.stats.projectiles);assert.ok(artillery.organs.some(o=>o.type==='lance'))
});
