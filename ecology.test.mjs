import test from 'node:test';
import assert from 'node:assert/strict';
import {generateRunEcology,genomeFromEcology,ecologyStage} from './public/ecology-v4.js';

test('run ecology is deterministic and contains distinct bestiary slots',()=>{
 const a=generateRunEcology('RUN-001',{world:1,size:6}),b=generateRunEcology('RUN-001',{world:1,size:6});
 assert.deepEqual(a,b);
 assert.equal(a.families.length,6);
 assert.deepEqual(a.families.map(x=>x.slot),['common','fast','heavy','ranged','support','rare']);
});

test('pressure promotes existing species instead of replacing their lineage',()=>{
 const eco=generateRunEcology('RUN-002',{world:0,size:5});
 const early=genomeFromEcology(eco,{spawnSeed:'A',elapsed:10,rank:'swarm'});
 const late=genomeFromEcology(eco,{spawnSeed:'A',elapsed:210,rank:'swarm'});
 assert.equal(early.ecology.familyId,late.ecology.familyId);
 assert.equal(early.lineage.rootSeed,late.lineage.rootSeed);
 assert.equal(early.ecology.stage,1);
 assert.equal(late.ecology.stage,3);
});

test('bosses and elites enter as evolved descendants',()=>{
 assert.equal(ecologyStage(5,'boss',0),3);
 assert.equal(ecologyStage(80,'elite',0),2);
 assert.equal(ecologyStage(150,'elite',0),3);
});
