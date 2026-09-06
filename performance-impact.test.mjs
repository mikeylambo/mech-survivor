import test from 'node:test';import assert from 'node:assert/strict';
import {createPerformanceGovernor,sampleFrame,performanceTier,creatureCacheStats} from './public/performance-runtime.js';
import {createImpactRuntime,hitstop,slowmo,zoomPunch,updateImpact} from './public/impact-runtime.js';

test('performance governor degrades gracefully under frame/entity pressure',()=>{const g=createPerformanceGovernor();for(let i=0;i<30;i++)sampleFrame(g,29,270);assert.ok(g.quality<.8);assert.ok(g.entityBudget<300);assert.ok(['reduced','survival'].includes(performanceTier(g)));assert.equal(creatureCacheStats().max,180)});
test('performance governor recovers toward full quality',()=>{const g=createPerformanceGovernor();for(let i=0;i<40;i++)sampleFrame(g,30,260);const low=g.quality;for(let i=0;i<180;i++)sampleFrame(g,14,80);assert.ok(g.quality>low);assert.ok(g.quality>.8)});
test('hitstop freezes simulation while real time continues',()=>{const i=createImpactRuntime();hitstop(i,.05);assert.equal(updateImpact(i,.016).dt,0);assert.equal(updateImpact(i,.016).dt,0);assert.equal(updateImpact(i,.02).dt,0);assert.ok(updateImpact(i,.016).dt>0)});
test('slow motion scales gameplay dt and zoom punch is transient',()=>{const i=createImpactRuntime();slowmo(i,.25,.1);zoomPunch(i,.05);const a=updateImpact(i,.016);assert.ok(a.dt<.016);assert.ok(Math.abs(a.zoom)>0);for(let n=0;n<120;n++)updateImpact(i,.016);assert.ok(i.slow>.95);assert.ok(Math.abs(i.zoom)<.01)});
