import test from 'node:test';
import assert from 'node:assert/strict';
import {createVFXEngine,VFX_EASINGS} from './public/vfx-engine.js';
import {registerMechVFX} from './public/mech-vfx.js';

const palette={white:'#eaf7ff',navy:'#071323',blue:'#168fff',cyan:'#78e7ff',gold:'#d6ae52',red:'#ff4664'};

test('VFX runtime registers the cinematic mech recipe vocabulary',()=>{
  let impulse=0,screen=0;
  const fx=registerMechVFX(createVFXEngine({cameraImpulse:n=>impulse=Math.max(impulse,n),screenFlash:n=>screen=Math.max(screen,n)}),palette);
  assert.ok(fx.recipeCount>=20);
  for(const id of ['mech.dash','mech.railFire','mech.railFireHigh','mech.bladeSlash','mech.bladeSlashHigh','mech.missileLaunch','mech.missileImpact','mech.arcChain','mech.arcStorm','mech.novaPulse','mech.novaHeart','mech.synergy','mech.bossDeath'])assert.equal(fx.has(id),true,id);
  assert.equal(fx.play('missing.effect'),false);
  assert.equal(fx.play('mech.dash',{x:10,y:20,dx:1,dy:0,intensity:1}),true);
  assert.ok(fx.activeCount>0);
  assert.ok(impulse>=4);
  fx.update(1);
  assert.equal(fx.activeCount,0);
});

test('beam and procedural bolt primitives can render as recipe modules',()=>{
  const fx=createVFXEngine();
  fx.define('test.beam',{modules:[{type:'beam',life:.2,length:200,width:8,color:'#0ff',coreColor:'#fff'}]});
  fx.define('test.bolt',{modules:[{type:'bolt',life:.2,width:4,segments:8,jitter:16,color:'#fff'}]});
  assert.equal(fx.play('test.beam',{x:0,y:0,dx:1,dy:0}),true);
  assert.equal(fx.play('test.bolt',{x:0,y:0,x2:120,y2:80}),true);
  assert.equal(fx.activeCount,2);
  fx.update(.21);
  assert.equal(fx.activeCount,0);
});

test('boss death sequences screen/camera feedback and delayed modules',()=>{
  let impulse=0,screen=0;
  const fx=registerMechVFX(createVFXEngine({cameraImpulse:n=>impulse=n,screenFlash:n=>screen=n}),palette);
  fx.play('mech.bossDeath',{x:0,y:0,intensity:1});
  const initial=fx.activeCount;
  assert.ok(initial>0);
  assert.ok(impulse>=15);
  assert.ok(screen>0);
  fx.update(.1);
  assert.ok(fx.activeCount>=initial);
  fx.clear();
  assert.equal(fx.activeCount,0);
});

test('engine exposes stable easing and recipe discovery APIs',()=>{
  const fx=createVFXEngine();fx.define('a',{modules:[]}).define('b',{modules:[]});
  assert.deepEqual(VFX_EASINGS,['linear','outQuad','outCubic','inQuad','smooth']);
  assert.deepEqual(fx.recipeIds,['a','b']);
});
