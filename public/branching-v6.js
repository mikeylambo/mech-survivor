import {generateCuratedGenome} from './curation-v5.js';
import {evolveCreatureGenome,lineageRoles} from './motion-v5.js';

function hashSeed(input){let h=2166136261>>>0;for(const ch of String(input)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
const ROLE_ORDER=['predator','bulwark','artillery','swarm','striker'];
export const BRANCH_ROLES=ROLE_ORDER.filter(r=>lineageRoles.includes(r));

function specialize(g,role){
 g.branch={role,ancestralSeed:g.lineage?.rootSeed||g.seed};g.lineage={...g.lineage,role,stage:3};
 if(role==='predator'){g.stats.speed=(g.stats.speed||1)*1.16;g.stats.contact=(g.stats.contact||1)*1.14;if(g.motion){g.motion.cadence*=1.12;g.motion.stride*=1.12}g.signature.magnitude*=1.12}
 if(role==='bulwark'){g.stats.hp=(g.stats.hp||1)*1.22;g.stats.armor=Math.min(.58,(g.stats.armor||0)+.12);if(!g.mutations.includes('shell'))g.mutations.push('shell');g.presentation.scale*=1.08}
 if(role==='artillery'){g.stats.projectiles=(g.stats.projectiles||0)+2;g.stats.damage=(g.stats.damage||1)*1.1;g.organs.push({type:'lance',attack:'projectile',side:0,size:1.2});g.signature.secondary=g.signature.secondary||'core-ring'}
 if(role==='swarm'){g.stats.spawner=true;g.organs.push({type:'brood',attack:'spawn',side:0,size:1.15});g.presentation.scale*=.93;if(g.motion)g.motion.cadence*=1.08}
 if(role==='striker'){g.stats.damage=(g.stats.damage||1)*1.14;g.stats.speed=(g.stats.speed||1)*1.08;g.stats.projectiles=(g.stats.projectiles||0)+1}
 return g;
}
export function branchCreatureGenome(base,role,{seed=`${base.seed}:branch:${role}`}={}){const g=evolveCreatureGenome(base,3,{role,seed});g.signature=structuredClone(base.signature);return specialize(g,role)}
export function generateEvolutionTree(seed,options={}){
 const root=generateCuratedGenome(seed,options,5),mid=evolveCreatureGenome(root,2,{role:options.role&&options.role!=='auto'?options.role:'striker',seed:`${seed}:mid`}),offset=hashSeed(seed)%BRANCH_ROLES.length,roles=[BRANCH_ROLES[offset],BRANCH_ROLES[(offset+1)%BRANCH_ROLES.length],BRANCH_ROLES[(offset+2)%BRANCH_ROLES.length]],branches=roles.map(role=>branchCreatureGenome(root,role,{seed:`${seed}:branch:${role}`}));
 mid.signature=structuredClone(root.signature);return{seed:String(seed),root,mid,branches,roles};
}
export function evolutionTreeSummary(tree){return`ROOT ${tree.root.morphotype} // S2 ${tree.mid.lineage?.role||'striker'} // BRANCHES ${tree.roles.join(' / ')}`}
