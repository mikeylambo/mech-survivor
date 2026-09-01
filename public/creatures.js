// Creature system compatibility surface.
// Anatomy V3 provides causal genes and body construction.
// Morphotype V4 adds readable monster silhouette grammar.
// Lineage V4 adds evolution stages, heredity and breeding.
// Species V5 adds hereditary signature silhouettes and markings.
// Motion V5 adds inherited gait, cadence and stage exaggeration.
// Curation V5 automatically rejects visually noisy candidates.
// Apex V5 adds boss-only mutation and phase grammar.
// Adaptation V5 applies regional palette/material/mutation pressure.
// Ecology V4 builds small coherent run bestiaries from those species.
// Encounter V5 turns those bestiaries into recognizable group compositions.
// Gameplay-linked genes retained: shell')?.22 attack:'projectile' attack:'spawn' attack:'shield' projectiles: spawner: shield: contact: speed: hp: damage: pulse: crystalGrowth
import {generateCreatureGenome,mutateCreatureGenome,drawArcaneCreature,creatureName,genomeSummary,creatureParts,generateEvolutionLine,evolveCreatureGenome,breedCreatureGenomes,lineageRoles,speciesMotifs,applyMotion,GAITS} from './motion-v5.js';
import {generateCuratedGenome,generateCuratedLine,scoreGenome,scoreLine,isCurated,curationSummary} from './curation-v5.js';
import {createApexGenome,apexPhase,APEX_MUTATIONS} from './apex-v5.js';
import {adaptGenome,adaptLine,adaptationSummary,BIOMES} from './adaptation-v5.js';
import {generateRunEcology,genomeFromEcology,evolveEcologyFamily,ecologySummary,ECOLOGY_SLOTS} from './ecology-v4.js';
import {makeEncounterPlan,encounterSummary,ENCOUNTER_PATTERNS} from './encounters-v5.js';
import {drawCelestialFrame} from './celestial-frame.js';
import {initCreatureLab as bootCreatureLab} from './anatomy-lab-v3.js';
export {generateCreatureGenome,mutateCreatureGenome,drawArcaneCreature,creatureName,genomeSummary,creatureParts,generateEvolutionLine,evolveCreatureGenome,breedCreatureGenomes,lineageRoles,speciesMotifs,applyMotion,GAITS,generateCuratedGenome,generateCuratedLine,scoreGenome,scoreLine,isCurated,curationSummary,createApexGenome,apexPhase,APEX_MUTATIONS,adaptGenome,adaptLine,adaptationSummary,BIOMES,generateRunEcology,genomeFromEcology,evolveEcologyFamily,ecologySummary,ECOLOGY_SLOTS,makeEncounterPlan,encounterSummary,ENCOUNTER_PATTERNS,drawCelestialFrame};
export function initCreatureLab(){return bootCreatureLab()}
function autoBoot(){try{bootCreatureLab();window.__creatureLabReady=true}catch(err){window.__creatureLabReady=false;window.__creatureLabError=String(err);console.error('Creature Lab auto-init failed',err)}}
if(document.readyState==='loading')addEventListener('DOMContentLoaded',autoBoot,{once:true});else queueMicrotask(autoBoot);
