import test from 'node:test';
import assert from 'node:assert/strict';
import {generateEvolutionLine} from './public/motion-v5.js';
import {applySpeciesAppearance} from './public/appearance-v6.js';

test('species appearance follows hereditary palette and markings',()=>{
 const line=generateEvolutionLine('appearance',{morphotype:'small-biped'}).map(applySpeciesAppearance);assert.ok(line.every(g=>g.appearance.palette===line[0].appearance.palette));assert.ok(line.every(g=>g.presentation.hue===line[0].presentation.hue));assert.ok(line[2].appearance.markingStrength>=line[0].appearance.markingStrength)
});

test('surface mutations influence material read',()=>{
 const g=applySpeciesAppearance(generateEvolutionLine('shell-look',{morphotype:'heavy-biped'})[0]);g.mutations.push('shell');applySpeciesAppearance(g);assert.equal(g.appearance.material,'carapace')
});
