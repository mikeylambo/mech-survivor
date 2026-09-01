import test from 'node:test';
import assert from 'node:assert/strict';
import {generateEvolutionLine} from './public/motion-v5.js';
import {deriveCombatKit} from './public/combat-v6.js';

test('species unlock additional body-justified moves across evolution',()=>{
 const line=generateEvolutionLine('combat-line',{morphotype:'serpent',role:'predator'}).map(deriveCombatKit);assert.ok(line[0].combatKit.moves.some(m=>m.id==='coil-lunge'));assert.ok(line[2].combatKit.moves.length>=line[0].combatKit.moves.length);assert.equal(line[2].combatKit.role,'predator')
});

test('combat kits feed existing behavior and stat seams',()=>{
 const g=deriveCombatKit(generateEvolutionLine('artillery-line',{morphotype:'avian',role:'artillery'})[2]);assert.equal(g.behavior,'strafe');assert.ok(g.stats.projectiles>=2);assert.ok(g.combatKit.moves.some(m=>m.id==='wing-swoop'))
});
