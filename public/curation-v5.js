import {generateCreatureGenome,generateEvolutionLine} from './motion-v5.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function scoreGenome(g){
 const stage=g.lineage?.stage||g.signature?.stage||1,append=g.appendages?.length||0,organs=g.organs?.length||0,muts=g.mutations?.length||0,struct=Object.values(g.anatomy?.structure||{}).filter(v=>v===true).length;
 const complexity=append*1.2+organs*1.4+muts*1.05+struct*1.35+(g.signature?.secondary?1.2:0),budget=stage===1?6.5:stage===2?10:14;
 let clarity=100-Math.max(0,complexity-budget)*9;
 if(!g.signature?.motif)clarity-=15;if(!g.motion?.name)clarity-=8;
 if(stage===1&&(g.anatomy?.structure?.splitTorso||g.anatomy?.structure?.twinHead))clarity-=22;
 if(stage===1&&muts>2)clarity-=12;
 if(g.morphotype==='small-biped'&&g.presentation.scale>1.25)clarity-=8;
 if(g.morphotype==='kaiju'&&g.presentation.scale<1.05)clarity-=8;
 const identity=(g.signature?.motif?22:0)+(g.morphotype?18:0)+(g.motion?.name?10:0)+(g.parent?5:0);
 const causal=(g.stats?.projectiles?5:0)+(g.stats?.pulse?4:0)+(g.stats?.spawner?5:0)+(g.stats?.shield?4:0)+(g.stats?.armor>0?3:0);
 return{score:clamp(Math.round(clarity+identity+causal),0,160),clarity:clamp(Math.round(clarity),0,100),identity,causal,complexity:+complexity.toFixed(2),budget};
}
export function isCurated(g,min=92){return scoreGenome(g).score>=min}
export function generateCuratedGenome(seed,options={},attempts=5){let best=null,bestScore=-Infinity;for(let i=0;i<attempts;i++){const g=generateCreatureGenome(`${seed}:candidate:${i}`,options),s=scoreGenome(g).score;if(s>bestScore){best=g;bestScore=s}}best.curation={...scoreGenome(best),attempts};return best}
export function scoreLine(line){const scores=line.map(scoreGenome),motif=line[0]?.signature?.motif,identityRetention=line.every(g=>g.signature?.motif===motif),morphRetention=line.every(g=>g.morphotype===line[0]?.morphotype);return{score:Math.round(scores.reduce((a,b)=>a+b.score,0)/scores.length)+(identityRetention?10:0)+(morphRetention?8:0),identityRetention,morphRetention,stages:scores}}
export function generateCuratedLine(seed,options={},attempts=4){let best=null,bestScore=-Infinity;for(let i=0;i<attempts;i++){const line=generateEvolutionLine(`${seed}:line:${i}`,options),s=scoreLine(line).score;if(s>bestScore){best=line;bestScore=s}}const summary=scoreLine(best);for(const g of best)g.curation={lineScore:summary.score,...scoreGenome(g),attempts};return best}
export function curationSummary(g){const s=g.curation||scoreGenome(g);return`QUALITY ${s.score} · CLARITY ${s.clarity} · COMPLEXITY ${s.complexity}/${s.budget}`}
