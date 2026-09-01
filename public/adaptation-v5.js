function hashSeed(input){let h=2166136261>>>0;for(const ch of String(input)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let a=hashSeed(seed)||1;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const pick=(r,a)=>a[Math.floor(r()*a.length)];
export const BIOMES={
 0:{id:'open',hueShift:0,accentShift:0,traits:['speed','clarity'],mutations:['eyeCluster','extraLimbs']},
 1:{id:'veil',hueShift:34,accentShift:54,traits:['phase','ambush'],mutations:['asymmetry','arcaneNode']},
 2:{id:'forge',hueShift:-32,accentShift:18,traits:['armor','heat'],mutations:['shell','crystalGrowth']},
 3:{id:'fracture',hueShift:92,accentShift:112,traits:['rupture','unstable'],mutations:['rupture','splitJaw','asymmetry']},
 4:{id:'crown',hueShift:12,accentShift:150,traits:['apex','radiance'],mutations:['arcaneNode','crystalGrowth','shell']}
};
function pushUnique(a,v){if(v&&!a.includes(v))a.push(v)}
export function adaptGenome(base,world,{seed=`${base.seed}:adapt:${world}`,severity=1}={}){
 const r=rng(seed),b=BIOMES[world]||BIOMES[0],g=structuredClone(base);g.adaptation={world,biome:b.id,severity,traits:[]};
 g.presentation={...g.presentation,hue:(g.presentation.hue+b.hueShift+360)%360,accent:(g.presentation.accent+b.accentShift+360)%360};
 const count=Math.max(1,Math.min(3,Math.round(severity+(world>2?1:0))));for(let i=0;i<count;i++){const m=pick(r,b.mutations);pushUnique(g.mutations,m);pushUnique(g.adaptation.traits,pick(r,b.traits))}
 if(b.id==='open'){g.stats.speed=(g.stats.speed||1)*(1+.035*severity);if(g.motion)g.motion.stride*=1+.04*severity}
 if(b.id==='veil'){if(g.motion)g.motion.sway*=1+.12*severity;g.stats.speed=(g.stats.speed||1)*(1+.025*severity)}
 if(b.id==='forge'){g.stats.armor=Math.min(.55,(g.stats.armor||0)+.05*severity);g.stats.hp=(g.stats.hp||1)*(1+.05*severity)}
 if(b.id==='fracture'){g.stats.damage=(g.stats.damage||1)*(1+.07*severity);g.stats.hp=(g.stats.hp||1)*(1-.025*Math.min(2,severity))}
 if(b.id==='crown'){g.stats.pulse=true;g.stats.damage=(g.stats.damage||1)*(1+.04*severity);if(g.signature)g.signature.magnitude*=1+.08*severity}
 return g;
}
export function adaptLine(line,world,{seed='adapt-line',severity=1}={}){return line.map((g,i)=>adaptGenome(g,world,{seed:`${seed}:${i}`,severity:severity+i*.25}))}
export function adaptationSummary(g){return`${g.adaptation?.biome?.toUpperCase()||'BASE'} // ${(g.adaptation?.traits||[]).join(' · ')||'unaltered'}`}
