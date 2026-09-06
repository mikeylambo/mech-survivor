import test from 'node:test';
import assert from 'node:assert/strict';
import {createRunDirector,OBJECTIVE_ARCHETYPES} from './public/director.js';
import {createSpatialObjective,updateSpatialObjective} from './public/director-objectives.js';

const player={x:0,y:0};
const event=(mechanic,target=10)=>({mechanic,metric:'custom',target,progress:0});

test('director archetypes expose real gameplay mechanics',()=>{
 assert.equal(OBJECTIVE_ARCHETYPES.hold.mechanic,'hold');
 assert.equal(OBJECTIVE_ARCHETYPES.defend.mechanic,'defend');
 assert.equal(OBJECTIVE_ARCHETYPES.extract.mechanic,'extract');
 assert.equal(OBJECTIVE_ARCHETYPES.escort.mechanic,'escort');
 const d=createRunDirector({world:1,seed:'depth-test'});
 assert.ok(d.slots.every(x=>x.mechanic&&x.instruction));
});

test('hold objective only progresses while occupying its field',()=>{
 const e=event('hold',5),f=createSpatialObjective(e,player,{random:()=>0});
 const inside={x:f.x,y:f.y};
 updateSpatialObjective(f,e,inside,2);assert.equal(f.progress,2);
 updateSpatialObjective(f,e,{x:f.x+500,y:f.y},1);assert.ok(f.progress<2);
});

test('extract requires reaching a distant field',()=>{
 const e=event('extract',3),f=createSpatialObjective(e,player,{random:()=>0});
 assert.ok(Math.hypot(f.x-player.x,f.y-player.y)>=400);
 updateSpatialObjective(f,e,player,2);assert.equal(f.progress,0);
 updateSpatialObjective(f,e,{x:f.x,y:f.y},2);assert.equal(f.progress,2);
});

test('defend relay can fail under pressure',()=>{
 const e=event('defend',20),f=createSpatialObjective(e,player,{random:()=>0}),threats=Array.from({length:30},()=>({dead:false}));
 const p={x:f.x+500,y:f.y};
 for(let i=0;i<10&&!f.failed;i++)updateSpatialObjective(f,e,p,1,{nearbyEnemies:()=>threats});
 assert.equal(f.failed,true);
});

test('escort advances only when player stays with courier',()=>{
 const e=event('escort',5),f=createSpatialObjective(e,player,{random:()=>0}),startX=f.x;
 updateSpatialObjective(f,e,{x:f.x+400,y:f.y},1);assert.equal(f.progress,0);assert.equal(f.x,startX);
 updateSpatialObjective(f,e,{x:f.x,y:f.y},1);assert.equal(f.progress,1);assert.notEqual(f.x,startX);
});
