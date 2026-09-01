// Creature system compatibility surface.
// Anatomy implementation contract lives in anatomy-v3.js: hashSeed bodyPlans appendages organs mutations behavior
// Gameplay-linked genes retained there: shell')?.22 attack:'projectile' attack:'spawn' attack:'shield' projectiles: spawner: shield: contact: speed: hp: damage: pulse: crystalGrowth
import {generateCreatureGenome,mutateCreatureGenome,drawArcaneCreature,creatureName,genomeSummary,creatureParts} from './anatomy-v3.js';
import {drawCelestialFrame} from './celestial-frame.js';
import {initCreatureLab as bootCreatureLab} from './anatomy-lab-v3.js';
export {generateCreatureGenome,mutateCreatureGenome,drawArcaneCreature,creatureName,genomeSummary,creatureParts,drawCelestialFrame};
export function initCreatureLab(){return bootCreatureLab()}
function autoBoot(){try{bootCreatureLab();window.__creatureLabReady=true}catch(err){window.__creatureLabReady=false;window.__creatureLabError=String(err);console.error('Creature Lab auto-init failed',err)}}
if(document.readyState==='loading')addEventListener('DOMContentLoaded',autoBoot,{once:true});else queueMicrotask(autoBoot);
