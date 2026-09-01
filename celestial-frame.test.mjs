import test from 'node:test';
import assert from 'node:assert/strict';
import {frameVisualGenome} from './public/celestial-frame.js';

test('frame visual genome exposes build silhouette systems',()=>{
 const g=frameVisualGenome({modules:{beam:4,missile:3,drone:2,orbit:4,armor:3,thruster:4,reactor:3,magnet:2,pulse:2,arc:2,mine:1}});assert.equal(g.rails,4);assert.equal(g.missiles,3);assert.equal(g.blades,4);assert.ok(g.halo>0);assert.ok(g.wings>0)
});

test('final-tier modules trigger ascended visual state',()=>{
 assert.equal(frameVisualGenome({modules:{reactor:5}}).ascended,true);assert.equal(frameVisualGenome({modules:{armor:5}}).ascended,true);assert.equal(frameVisualGenome({modules:{beam:1}}).ascended,false)
});
