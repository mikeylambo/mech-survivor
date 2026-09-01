import {generateCreatureGenome as speciesGenerate,mutateCreatureGenome as speciesMutate,generateEvolutionLine as speciesLine,evolveCreatureGenome as speciesEvolve,breedCreatureGenomes as speciesBreed,drawArcaneCreature as speciesDraw,creatureName,genomeSummary,creatureParts,lineageRoles,speciesMotifs} from './species-v5.js';

function hashSeed(input){let h=2166136261>>>0;for(const ch of String(input)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export const GAITS={
 'small-biped':{name:'scamper',cadence:6.8,bob:.10,sway:.05,stride:.85,inertia:.76,burst:.10},
 'heavy-biped':{name:'lumber',cadence:2.55,bob:.075,sway:.08,stride:.58,inertia:1.34,burst:.03},
 hunter:{name:'prowl',cadence:4.8,bob:.045,sway:.105,stride:1.08,inertia:.82,burst:.16},
 quadruped:{name:'bound',cadence:5.7,bob:.13,sway:.035,stride:1.18,inertia:.72,burst:.18},
 avian:{name:'glide',cadence:3.7,bob:.18,sway:.11,stride:1.03,inertia:.56,burst:.13},
 insectoid:{name:'skitter',cadence:8.8,bob:.045,sway:.12,stride:.96,inertia:.62,burst:.19},
 serpent:{name:'slither',cadence:3.9,bob:.025,sway:.19,stride:.92,inertia:.68,burst:.09},
 'orb-blob':{name:'bob',cadence:2.9,bob:.15,sway:.075,stride:.70,inertia:.48,burst:.05},
 aquatic:{name:'swim',cadence:3.4,bob:.11,sway:.17,stride:1.02,inertia:.52,burst:.12},
 'plant-beast':{name:'drag',cadence:2.15,bob:.045,sway:.13,stride:.55,inertia:1.18,burst:.025},
 kaiju:{name:'stomp',cadence:1.85,bob:.085,sway:.055,stride:.52,inertia:1.48,burst:.045}
};

function applyMotion(g,stage=g.lineage?.stage||g.signature?.stage||1){
 const base=GAITS[g.morphotype]||GAITS['small-biped'],salt=(hashSeed(`${g.seed}:motion`)%1000)/1000-.5,amp=1+(stage-1)*.18;
 g.motion={...base,stage,cadence:base.cadence*(1+salt*.08),bob:base.bob*amp,sway:base.sway*amp,stride:base.stride*(1+(stage-1)*.07),burst:clamp(base.burst+(stage-1)*.035,0,.3),phase:(hashSeed(g.seed)%628)/100};
 g.stats={...g.stats};
 if(['scamper','prowl','bound','skitter','swim'].includes(g.motion.name))g.stats.speed=(g.stats.speed||1)*(1.04+(stage-1)*.035);
 if(['lumber','drag','stomp'].includes(g.motion.name))g.stats.contact=(g.stats.contact||1)*(1.04+(stage-1)*.05);
 if(g.motion.name==='glide')g.stats.projectiles=(g.stats.projectiles||0)+(stage>=3?1:0);
 return g;
}

export function generateCreatureGenome(seed,options={}){return applyMotion(speciesGenerate(seed,options),1)}
export function evolveCreatureGenome(base,stage=2,options={}){return applyMotion(speciesEvolve(base,stage,options),stage)}
export function generateEvolutionLine(seed,options={}){const raw=speciesLine(seed,options);return raw.map((g,i)=>applyMotion(g,i+1))}
export function mutateCreatureGenome(g,seed){const n=speciesMutate(g,seed);n.motion={...(g.motion||GAITS[g.morphotype]||GAITS['small-biped'])};return applyMotion(n,g.lineage?.stage||1)}
export function breedCreatureGenomes(a,b,options={}){const child=speciesBreed(a,b,options),dominant=(hashSeed(`${options.seed||child.seed}:gait`)&1)?a:b;child.motion={...(dominant.motion||GAITS[dominant.morphotype]||GAITS['small-biped'])};return applyMotion(child,1)}

function animatedEntity(e,time){
 const g=e.genome,m=g?.motion;if(!m)return e;
 const t=time*m.cadence+m.phase,stage=m.stage||1;
 let ox=Math.sin(t*.53)*m.sway*(e.r||20)*.9,oy=Math.sin(t)*m.bob*(e.r||20);
 if(m.name==='bound'){oy-=Math.abs(Math.sin(t))*m.bob*(e.r||20)*1.35;ox*=.35}
 if(m.name==='skitter')ox+=Math.sign(Math.sin(t*1.7))*m.sway*(e.r||20)*.42;
 if(m.name==='glide'||m.name==='swim')oy+=Math.sin(t*.55)*m.bob*(e.r||20)*.75;
 if(m.name==='stomp')oy=Math.max(0,Math.sin(t))*m.bob*(e.r||20)*.7;
 return{...e,x:e.x+ox,y:e.y+oy,phase:(e.phase||0)+Math.sin(t*.5)*m.sway*(.45+.08*stage)};
}
export function drawArcaneCreature(ctx,e,time=0,opts={}){return speciesDraw(ctx,animatedEntity(e,time),time,opts)}
export {creatureName,genomeSummary,creatureParts,lineageRoles,speciesMotifs,applyMotion};
