const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function hashSeed(input){let h=2166136261>>>0;for(const ch of String(input)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let a=hashSeed(seed)||1;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const pick=(r,a)=>a[Math.floor(r()*a.length)];

export const FORMATIONS={
 wedge:{id:'wedge',label:'WEDGE',slots:[[-1,0],[0,-1],[1,0],[-2,1],[2,1],[-1,2],[1,2]]},
 pincer:{id:'pincer',label:'PINCER',slots:[[-3,-1],[-3,1],[-2,0],[3,-1],[3,1],[2,0]]},
 ring:{id:'ring',label:'RING',slots:[[0,-3],[2,-2],[3,0],[2,2],[0,3],[-2,2],[-3,0],[-2,-2]]},
 column:{id:'column',label:'COLUMN',slots:[[0,-3],[0,-2],[0,-1],[0,0],[0,1],[0,2],[0,3]]},
 cross:{id:'cross',label:'CROSS',slots:[[0,0],[0,-2],[0,2],[-2,0],[2,0],[-3,0],[3,0]]},
 escort:{id:'escort',label:'ESCORT',slots:[[0,0],[-2,-1],[2,-1],[-2,1],[2,1],[0,2]]}
};

export const OBJECTIVE_ARCHETYPES={
 purge:{id:'purge',label:'PURGE',metric:'kills',baseTarget:18,payout:30,formations:['wedge','ring']},
 hold:{id:'hold',label:'HOLD',metric:'survive',baseTarget:18,payout:28,formations:['ring','cross']},
 intercept:{id:'intercept',label:'INTERCEPT',metric:'kills',baseTarget:12,payout:32,formations:['column','wedge']},
 hunt:{id:'hunt',label:'HUNT',metric:'eliteKills',baseTarget:1,payout:40,formations:['escort','pincer']},
 defend:{id:'defend',label:'DEFEND',metric:'survive',baseTarget:20,payout:34,formations:['ring','pincer']},
 extract:{id:'extract',label:'EXTRACT',metric:'survive',baseTarget:16,payout:34,formations:['column','pincer']},
 seal:{id:'seal',label:'SEAL',metric:'kills',baseTarget:15,payout:36,formations:['cross','ring']},
 escort:{id:'escort',label:'ESCORT',metric:'survive',baseTarget:22,payout:38,formations:['escort','column']},
 anomaly:{id:'anomaly',label:'ANOMALY',metric:'kills',baseTarget:20,payout:45,formations:['cross','escort','ring']}
};

export const DIRECTOR_PHASES=[
 {id:'opening',from:0,to:110,budget:1},
 {id:'pressure',from:110,to:250,budget:1.2},
 {id:'escalation',from:250,to:360,budget:1.45},
 {id:'crisis',from:360,to:420,budget:1.75},
 {id:'ascendancy',from:420,to:480,budget:2}
];

export const DIRECTOR_SLOTS=[
 {id:'opportunity-a',kind:'opportunity',time:120,pool:['purge','hold','intercept','hunt']},
 {id:'opportunity-b',kind:'opportunity',time:285,pool:['defend','extract','seal','escort']},
 {id:'crisis',kind:'crisis',time:365,pool:['anomaly','hunt','defend','purge']}
];

export function createRunDirector({world=0,seed=`sector-${world}`}={}){
 const r=rng(`${seed}:director`);
 const slots=DIRECTOR_SLOTS.map((slot,index)=>{
  const archetype=OBJECTIVE_ARCHETYPES[pick(r,slot.pool)],formation=pick(r,archetype.formations);
  const target=Math.max(1,Math.round(archetype.baseTarget*(1+world*.12)*(slot.kind==='crisis'?1.35:1)));
  return{...slot,index,archetypeId:archetype.id,label:archetype.label,metric:archetype.metric,target,payout:Math.round(archetype.payout*(1+world*.18)*(slot.kind==='crisis'?1.4:1)),formation,status:'pending'};
 });
 return{world,seed,slots,cursor:0,active:null,completed:0,failed:0,history:[]};
}

export function directorPhase(elapsed){return DIRECTOR_PHASES.find(p=>elapsed>=p.from&&elapsed<p.to)||DIRECTOR_PHASES.at(-1)}
export function directorBudget(elapsed,world=0){return directorPhase(elapsed).budget*(1+world*.12)}

export function pollDirector(director,elapsed){
 if(!director||director.active||director.cursor>=director.slots.length)return null;
 const slot=director.slots[director.cursor];
 if(elapsed<slot.time)return null;
 slot.status='active';slot.startedAt=elapsed;slot.startKills=0;slot.startEliteKills=0;slot.progress=0;director.active=slot;director.cursor++;
 return slot;
}

export function updateDirectorEvent(director,{elapsed,kills=0,eliteKills=0}={}){
 const e=director?.active;if(!e)return null;
 if(e.metric==='survive')e.progress=Math.max(0,elapsed-e.startedAt);
 else if(e.metric==='eliteKills')e.progress=eliteKills-(e.startEliteKills||0);
 else e.progress=kills-(e.startKills||0);
 e.progress=clamp(e.progress,0,e.target);
 if(e.progress>=e.target){e.status='complete';e.completedAt=elapsed;director.completed++;director.history.push({...e});director.active=null;return{type:'complete',event:e}}
 const timeout=e.kind==='crisis'?75:60;
 if(elapsed-e.startedAt>timeout){e.status='failed';director.failed++;director.history.push({...e});director.active=null;return{type:'failed',event:e}}
 return{type:'progress',event:e};
}

export function beginDirectorEvent(event,{kills=0,eliteKills=0}={}){event.startKills=kills;event.startEliteKills=eliteKills;event.progress=0;return event}

export function formationOffsets(id,{spacing=64,rotation=0,scale=1}={}){
 const f=FORMATIONS[id]||FORMATIONS.wedge,c=Math.cos(rotation),s=Math.sin(rotation);
 return f.slots.map(([gx,gy])=>{const x=gx*spacing*scale,y=gy*spacing*scale;return{x:x*c-y*s,y:x*s+y*c}});
}
