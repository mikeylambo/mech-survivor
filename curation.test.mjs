import test from 'node:test';
import assert from 'node:assert/strict';
import {generateCuratedGenome,generateCuratedLine,scoreGenome,scoreLine} from './public/curation-v5.js';

test('curated genomes expose quality metadata and preserve readable identity',()=>{
 const g=generateCuratedGenome('quality',{morphotype:'small-biped'},6);const s=scoreGenome(g);assert.ok(g.curation);assert.ok(s.score>=80);assert.ok(g.signature?.motif);assert.ok(g.motion?.name)
});

test('curated evolution lines preserve morphotype and signature',()=>{
 const line=generateCuratedLine('quality-line',{morphotype:'avian'},5),s=scoreLine(line);assert.equal(line.length,3);assert.ok(s.identityRetention);assert.ok(s.morphRetention);assert.ok(line.every(g=>g.curation?.lineScore===s.score))
});
