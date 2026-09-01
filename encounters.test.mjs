import test from 'node:test';
import assert from 'node:assert/strict';
import {generateRunEcology} from './public/ecology-v4.js';
import {makeEncounterPlan,ENCOUNTER_PATTERNS} from './public/encounters-v5.js';

test('encounter patterns build coherent groups from run ecology',()=>{
 const ecology=generateRunEcology('encounter-eco',{world:2,size:6});
 for(const pattern of ENCOUNTER_PATTERNS){const plan=makeEncounterPlan(ecology,{seed:pattern,elapsed:190,intensity:1.2,pattern});assert.equal(plan.pattern,pattern);assert.ok(plan.members.length>=2);assert.ok(plan.members.every(m=>m.genome.ecology?.familyId))}
});

test('apex retinue includes a boss descendant and supporting family members',()=>{
 const ecology=generateRunEcology('apex-eco',{world:3,size:6}),plan=makeEncounterPlan(ecology,{pattern:'apex-retinue',elapsed:220,intensity:1.5});assert.equal(plan.members[0].rank,'boss');assert.ok(plan.members[0].genome.apex);assert.ok(plan.members.some(m=>m.rank!=='boss'))
});
