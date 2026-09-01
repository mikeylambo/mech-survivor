// Creature system compatibility surface.
// Anatomy V3 provides causal genes and body construction.
// Morphotype V4 adds readable monster silhouette grammar.
// Lineage V4 adds evolution stages, heredity and breeding.
// Species V5 adds hereditary signature silhouettes and markings.
// Apex V5 adds boss-only mutation and phase grammar.
// Ecology V4 builds small coherent run bestiaries from those species.
// Gameplay-linked genes retained: shell')?.22 attack:'projectile' attack:'spawn' attack:'shield' projectiles: spawner: shield: contact: speed: hp: damage: pulse: crystalGrowth
import {generateCreatureGenome,mutateCreatureGenome,drawArcaneCreature,creatureName,genomeSummary,creatureParts,generateEvolutionLine,evolveCreatureGenome,breedCreatureGenomes,lineageRoles,speciesMotifs} from './species-v5.js';
import {createApexGenome,apexPhase,APEX_MUTATIONS} from './apex-v5.js';
import {generateRunEcology,genomeFromEcology,evolveEcologyFamily,ecologySummary,ECOLOGY_SLOTS} from './ecology-v4.js';
import {drawCelestialFrame} from './celestial-frame.js';
import {initCreatureLab as bootCreatureLab} from './anatomy-lab-v3.js';
export {generateCreatureGenome,mutateCreatureGenome,drawArcaneCreature,creatureName,genomeSummary,creatureParts,generateEvolutionLine,evolveCreatureGenome,breedCreatureGenomes,lineageRoles,speciesMotifs,createApexGenome,apexPhase,APEX_MUTATIONS,generateRunEcology,genomeFromEcology,evolveEcologyFamily,ecologySummary,ECOLOGY_SLOTS,drawCelestialFrame};
export function initCreatureLab(){return bootCreatureLab()}
function autoBoot(){try{bootCreatureLab();window.__creatureLabReady=true}catch(err){window.__creatureLabReady=false;window.__creatureLabError=String(err);console.error('Creature Lab auto-init failed',err)}}
if(document.readyState==='loading')addEventListener('DOMContentLoaded',autoBoot,{once:true});else queueMicrotask(autoBoot);
