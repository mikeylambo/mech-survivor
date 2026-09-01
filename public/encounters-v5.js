import {genomeFromEcology} from './ecology-v4.js';

function hashSeed(input){let h=2166136261>>>0;for(const ch of String(input)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let a=hashSeed(seed)||1;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const pick=(r,a)=>a[Math.floor(r()*a.length)];
export const ENCOUNTER_PATTERNS=['pack','escort','hunter-pair','brood-cluster','skirmish-line','apex-retinue'];

function rankForSlot(slot){if(slot==='heavy')return'brute';if(slot==='fast'||slot==='ranged'||slot==='support')return'dart';return'swarm'}
export function makeEncounterPlan(ecology,{seed='encounter',elapsed=0,intensity=1,pattern='auto'}={}){
 const r=rng(`${ecology.seed}:${seed}:${elapsed}`),chosen=pattern==='auto'?pick(r,elapsed>180?ENCOUNTER_PATTERNS:['pack','escort','hunter-pair','brood-cluster','skirmish-line']):pattern;
 const count=Math.max(2,Math.min(10,Math.round((3+intensity*2)+(elapsed/120))));
 const members=[];
 function add(slot,index,rank=rankForSlot(slot)){const family=ecology.families.find(f=>f.slot===slot)||ecology.families[0];const genome=genomeFromEcology(ecology,{spawnSeed:`${seed}:${slot}:${index}`,elapsed,rank});members.push({slot,rank,genome,offset:index})}
 if(chosen==='pack'){for(let i=0;i<count;i++)add(i%4===3?'fast':'common',i)}
 if(chosen==='escort'){add('heavy',0,'brute');for(let i=1;i<count;i++)add(i%2?'common':'ranged',i)}
 if(chosen==='hunter-pair'){add('fast',0,'dart');add('fast',1,'dart');for(let i=2;i<count;i++)add('common',i)}
 if(chosen==='brood-cluster'){add('support',0,'dart');for(let i=1;i<count;i++)add('common',i)}
 if(chosen==='skirmish-line'){for(let i=0;i<count;i++)add(i%3===0?'ranged':i%3===1?'common':'fast',i)}
 if(chosen==='apex-retinue'){add('rare',0,'boss');for(let i=1;i<count;i++)add(i%3===0?'heavy':i%2?'ranged':'common',i)}
 return{seed,pattern:chosen,intensity,count:members.length,members};
}
export function encounterSummary(plan){const counts={};for(const m of plan.members)counts[m.slot]=(counts[m.slot]||0)+1;return`${plan.pattern.toUpperCase()} // ${Object.entries(counts).map(([k,v])=>`${v} ${k}`).join(' · ')}`}
