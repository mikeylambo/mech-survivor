import test from 'node:test';
import assert from 'node:assert/strict';
import {createVFXEngine,VFX_EASINGS} from './public/vfx-engine.js';
import {registerMechVFX} from './public/mech-vfx.js';

const palette={white:'#eaf7ff',navy:'#071323',blue:'#168fff',cyan:'#78e7ff',gold:'#d6ae52',red:'#ff4664'};

test('VFX runtime registers and plays data-driven recipes',()=>{
  let impulse=0,screen=0;
  const fx=registerMechVFX(createVFXEngine({cameraImpulse:n=>impulse=Math.max(impulse,n),screenFlash:n=>screen=Math.max(screen,n)}),palette);
  assert.ok(fx.recipeCount>=12);
  assert.equal(fx.has('mech.dash'),true);
  assert.equal(fx.has('mech.bossDeath'),true);
  assert.equal(fx.play('missing.effect'),false);
  assert.equal(fx.play('mech.dash',{x:10,y:20,dx:1,dy:0,intensity:1}),true);
  assert.ok(fx.activeCount>0);
  assert.ok(impulse>=4);
  fx.update(1);
  assert.equal(fx.activeCount,0);
});

test('boss death sequences screen/camera feedback and delayed modules',()=>{
  let impulse=0,screen=0;
  const fx=registerMechVFX(createVFXEngine({cameraImpulse:n=>impulse=n,screenFlash:n=>screen=n}),palette);
  fx.play('mech.bossDeath',{x:0,y:0,intensity:1});
  const initial=fx.activeCount;
  assert.ok(initial>0);
  assert.ok(impulse>=12);
  assert.ok(screen>0);
  fx.update(.1);
  assert.ok(fx.activeCount>=initial);
  fx.clear();
  assert.equal(fx.activeCount,0);
});

test('engine exposes stable easing vocabulary',()=>{
  assert.deepEqual(VFX_EASINGS,['linear','outQuad','outCubic','inQuad','smooth']);
});
