import test from 'node:test';
import assert from 'node:assert/strict';
import {BRANCH_BEHAVIOR,branchBehaviorCoverage,tickBranchIdentity,applyBranchDamageModifiers} from './public/arsenal-branch-runtime.js';

const player=(id,branch,evo=1)=>({x:0,y:0,r:18,speed:235,dashTime:0,dashDir:{x:1,y:0},kills:0,arsenal:{[id]:{tier:6,branch,evo}},arsenalFx:[]});
const enemy=(x=80,y=0,t='swarm')=>({x,y,r:14,hp:100,maxHp:100,t,dead:false});
const hit=(e,d)=>{e.hp-=d;if(e.hp<=0)e.dead=true;return e.dead};

test('all 30 families expose two authored branch behavior contracts',()=>{
 assert.equal(branchBehaviorCoverage().length,60);
 for(const [id,b] of Object.entries(BRANCH_BEHAVIOR)){assert.ok(id.includes(':'));assert.ok(b.name.length>2);assert.ok(b.rule.length>20)}
});

test('Siege Rail rewards a stationary stance with a transformed shot',()=>{
 const p=player('rail','a',2),shots=[];for(let i=0;i<30;i++)tickBranchIdentity(p,.1,{enemies:[enemy(300)],shots,damageEnemy:hit,input:{x:0,y:0}});
 shots.push({kind:'rail',damage:20,pierce:1,r:3,vx:900,vy:0});tickBranchIdentity(p,.016,{enemies:[enemy(300)],shots,damageEnemy:hit,input:{x:0,y:0}});
 assert.ok(shots[0].damage>35);assert.ok(shots[0].pierce>=4);assert.ok(shots[0].r>=6);
});

test('Nova Heart charges from surround pressure and releases a panic clear',()=>{
 const p=player('nova','a',2),enemies=Array.from({length:8},(_,i)=>enemy(Math.cos(i)*60,Math.sin(i)*60));
 for(let i=0;i<20;i++)tickBranchIdentity(p,.1,{enemies,shots:[],damageEnemy:hit,input:{x:0,y:0}});
 assert.ok(enemies.some(e=>e.hp<100));assert.ok(p.arsenalFx.some(x=>x.type==='ring'));
});

test('Singularity Mine physically pulls enemies toward armed territory',()=>{
 const p=player('mine','b',2),e=enemy(100,0),shots=[{kind:'mine',x:0,y:0}];const before=e.x;
 tickBranchIdentity(p,.5,{enemies:[e],shots,damageEnemy:hit,input:{x:0,y:0}});assert.ok(e.x<before);
});

test('Fortress Node converts holding ground into an independent emplacement',()=>{
 const p=player('sentry','b',2),shots=[],enemies=[enemy(220,0)];
 for(let i=0;i<30;i++)tickBranchIdentity(p,.1,{enemies,shots,damageEnemy:hit,input:{x:0,y:0}});
 assert.ok(shots.some(s=>s.kind==='sentry'&&s.r>=6));
});

test('Time Fracture duplicates projectiles that enter the fracture field',()=>{
 const p=player('temporal','b',2),shots=[];tickBranchIdentity(p,.1,{enemies:[],shots,damageEnemy:hit,input:{x:1,y:0}});const f=p._branchRt.fracture;shots.push({x:f.x,y:f.y,kind:'rail',damage:20,life:1,vx:10,vy:0});tickBranchIdentity(p,.1,{enemies:[],shots,damageEnemy:hit,input:{x:1,y:0}});assert.ok(shots.length>=2);
});

test('execution branch damage modifier converts distance/mark state into damage',()=>{
 const p=player('mark','a',2),e=enemy(200);e._hunterMark=true;assert.ok(applyBranchDamageModifiers(p,e,10)>10);
});
