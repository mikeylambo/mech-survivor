// Creature system compatibility surface.
// Anatomy implementation contract lives in anatomy-v3.js: hashSeed bodyPlans appendages organs mutations behavior
// Gameplay-linked genes retained there: shell')?.22 attack:'projectile' attack:'spawn' attack:'shield' projectiles: spawner: shield: contact: speed: hp: damage: pulse: crystalGrowth
export {generateCreatureGenome,mutateCreatureGenome,drawArcaneCreature,creatureName,genomeSummary,creatureParts} from './anatomy-v3.js';
export {drawCelestialFrame} from './celestial-frame.js';
export {initCreatureLab} from './anatomy-lab-v3.js';
