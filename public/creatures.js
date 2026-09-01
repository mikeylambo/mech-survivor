// Creature system compatibility surface.
// Anatomy V3 provides causal genes and body construction.
// Morphotype V4 adds readable monster silhouette grammar.
// Lineage V4 adds evolution stages, heredity and breeding.
// Gameplay-linked genes retained: shell')?.22 attack:'projectile' attack:'spawn' attack:'shield' projectiles: spawner: shield: contact: speed: hp: damage: pulse: crystalGrowth
import {generateCreatureGenome,mutateCreatureGenome,drawArcaneCreature,creatureName,genomeSummary,creatureParts,generateEvolutionLine,evolveCreatureGenome,breedCreatureGenomes,lineageRoles} from './lineage-v4.js';
import {drawCelestialFrame} from './celestial-frame.js';
import {initCreatureLab as bootCreatureLab} from './anatomy-lab-v3.js';
export {generateCreatureGenome,mutateCreatureGenome,drawArcaneCreature,creatureName,genomeSummary,creatureParts,generateEvolutionLine,evolveCreatureGenome,breedCreatureGenomes,lineageRoles,drawCelestialFrame};
export function initCreatureLab(){return bootCreatureLab()}
function autoBoot(){try{bootCreatureLab();window.__creatureLabReady=true}catch(err){window.__creatureLabReady=false;window.__creatureLabError=String(err);console.error('Creature Lab auto-init failed',err)}}
if(document.readyState==='loading')addEventListener('DOMContentLoaded',autoBoot,{once:true});else queueMicrotask(autoBoot);
