function hashSeed(input){let h=2166136261>>>0;for(const ch of String(input)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let a=hashSeed(seed)||1;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const pick=(r,a)=>a[Math.floor(r()*a.length)];

export const SALVAGE_SLOTS=[
 {id:'weapon',label:'WEAPON ASSEMBLY'},
 {id:'core',label:'REACTOR CORE'},
 {id:'armor',label:'ARMOR PLATE'},
 {id:'mobility',label:'MOBILITY RIG'},
 {id:'support',label:'SUPPORT MODULE'},
 {id:'relic',label:'RELIC INTERFACE'}
];
export const SALVAGE_RARITIES=[
 {id:'common',label:'STANDARD',weight:62,value:1},
 {id:'rare',label:'REFINED',weight:25,value:3},
 {id:'epic',label:'EXALTED',weight:10,value:8},
 {id:'mythic',label:'SOVEREIGN',weight:3,value:20}
];
export const SALVAGE_AFFIX_CONTRACTS=[
 {id:'output',label:'OUTPUT',stat:'damage'},
 {id:'tempo',label:'TEMPO',stat:'rate'},
 {id:'integrity',label:'INTEGRITY',stat:'hp'},
 {id:'reach',label:'REACH',stat:'area'},
 {id:'recovery',label:'RECOVERY',stat:'regen'},
 {id:'fortune',label:'FORTUNE',stat:'salvage'}
];

function rollRarity(r,{world=0,won=false,objectives=0,corruption=0}={}){
 const quality=Math.min(18,world*2+(won?4:0)+objectives*2+corruption*5),weights=SALVAGE_RARITIES.map((x,i)=>Math.max(1,x.weight+(i===0?-quality:i*quality/(SALVAGE_RARITIES.length-1))));
 let n=r()*weights.reduce((a,b)=>a+b,0);for(let i=0;i<weights.length;i++){n-=weights[i];if(n<=0)return SALVAGE_RARITIES[i]}return SALVAGE_RARITIES[0];
}

export function generateRunSalvage(summary,won=false,seed=Date.now()){
 const r=rng(`${seed}:${summary.world}:${summary.kills}:${summary.level}:${won}`),objectiveCount=summary.director?.completed||0,count=1+(won&&r()<.5?1:0)+(objectiveCount>=3&&r()<.35?1:0),out=[];
 for(let i=0;i<count;i++){
  const slot=pick(r,SALVAGE_SLOTS),rarity=rollRarity(r,{world:summary.world,won,objectives:objectiveCount,corruption:summary.corruption||0}),affixCount=Math.min(3,1+SALVAGE_RARITIES.findIndex(x=>x.id===rarity.id)),affixes=[];
  while(affixes.length<affixCount){const a=pick(r,SALVAGE_AFFIX_CONTRACTS);if(!affixes.some(x=>x.id===a.id))affixes.push({...a,roll:Math.round((4+r()*8)*(1+summary.world*.14)*(1+SALVAGE_RARITIES.findIndex(x=>x.id===rarity.id)*.25))})}
  out.push({id:`salvage-${Date.now()}-${i}-${Math.floor(r()*1e7)}`,slot:slot.id,slotLabel:slot.label,rarity:rarity.id,rarityLabel:rarity.label,tier:Math.max(1,summary.world+1),familyKey:`${slot.id}-family-${Math.floor(r()*4)}`,affixes,source:{world:summary.world,won,kills:summary.kills,level:summary.level,corruption:summary.corruption||0,director:objectiveCount},locked:false,acquiredAt:Date.now()+i});
 }
 return out;
}

export function salvageDismantleValue(item){const r=SALVAGE_RARITIES.find(x=>x.id===item.rarity)||SALVAGE_RARITIES[0];return r.value*Math.max(1,item.tier||1)}
export function salvageSummary(item){return `${item.rarityLabel} · T${item.tier} · ${item.slotLabel}`}
