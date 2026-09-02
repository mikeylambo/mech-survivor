import {evolveCreatureGenome} from './motion-v5.js';

function hashSeed(input){let h=2166136261>>>0;for(const ch of String(input)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let a=hashSeed(seed)||1;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const pick=(r,a)=>a[Math.floor(r()*a.length)];
export const APEX_MUTATIONS=['crown-array','multi-core','split-body','wing-mantle','brood-halo','siege-limbs','void-carapace'];
function pushUnique(a,v){if(!a.includes(v))a.push(v)}
export function createApexGenome(base,{seed=`${base.seed}:apex`,mutation='auto'}={}){
 const r=rng(seed),g=evolveCreatureGenome(base,3,{role:base.lineage?.role||'bulwark',seed}),apex=mutation==='auto'?pick(r,APEX_MUTATIONS):mutation;
 g.seed=seed;g.rank='boss';g.presentation.scale*=1.38;g.apex={mutation:apex,phaseCount:3,phaseGenes:[]};g.stats.hp=(g.stats.hp||1)*1.75;g.stats.damage=(g.stats.damage||1)*1.25;
 if(g.motion){g.motion.stage=3;g.motion.bob*=1.15;g.motion.sway*=1.12;g.motion.burst=Math.min(.34,(g.motion.burst||0)+.06)}
 if(apex==='crown-array'){g.signature.motif='horn-crown';g.signature.magnitude*=1.7;g.apex.phaseGenes=['projectile-crown','radial-burst','charge'];g.stats.projectiles=(g.stats.projectiles||0)+2}
 if(apex==='multi-core'){pushUnique(g.mutations,'arcaneNode');g.apex.cores=3;g.apex.phaseGenes=['pulse','shield-break','pulse-overdrive'];g.stats.pulse=true}
 if(apex==='split-body'){if(g.bodyPlan==='humanoid')g.anatomy.structure.splitTorso=true;else g.segments=Math.min(12,(g.segments||5)+3);g.apex.phaseGenes=['split-volley','summon-copy','frenzy'];g.stats.hp*=1.18}
 if(apex==='wing-mantle'){g.signature.motif='wing-fins';g.signature.magnitude*=1.55;g.apex.phaseGenes=['strafe','swoop','storm'];g.stats.speed=(g.stats.speed||1)*1.16;g.stats.projectiles=(g.stats.projectiles||0)+1;if(g.motion){g.motion.name='glide';g.motion.cadence=Math.max(3.2,g.motion.cadence);g.motion.bob*=1.35}}
 if(apex==='brood-halo'){g.organs.push({type:'brood',attack:'spawn',side:0,size:1.4});g.signature.secondary='core-ring';g.apex.phaseGenes=['brood','brood-ring','brood-surge'];g.stats.spawner=true}
 if(apex==='siege-limbs'){if(g.bodyPlan==='humanoid')g.anatomy.structure.oversizedLimb=true;g.signature.secondary='shoulder-spikes';g.apex.phaseGenes=['slam','lance','ram'];g.stats.contact=(g.stats.contact||1)*1.35;g.stats.damage*=1.15;if(g.motion){g.motion.name='stomp';g.motion.cadence=Math.min(2.15,g.motion.cadence);g.motion.inertia=1.5}}
 if(apex==='void-carapace'){pushUnique(g.mutations,'shell');g.signature.secondary='core-ring';g.apex.phaseGenes=['armor','reflect','exposed-core'];g.stats.armor=Math.min(.6,(g.stats.armor||0)+.18);g.stats.hp*=1.15}
 return g;
}
export function apexPhase(genome,hpRatio){const phase=hpRatio>.66?0:hpRatio>.33?1:2;return{phase:phase+1,gene:genome.apex?.phaseGenes?.[phase]||'pressure',mutation:genome.apex?.mutation||'unknown'}}
