import fs from 'node:fs';
const path='public/game.js';
let s=fs.readFileSync(path,'utf8');
const requireToken=(token,label)=>{if(!s.includes(token))throw new Error(`pass-r: missing ${label}`)};
function replaceFunction(name,code){
 const marker=`function ${name}(`,start=s.indexOf(marker);if(start<0)throw new Error(`pass-r: missing function ${name}`);
 const brace=s.indexOf('{',start);let depth=0,end=-1;
 for(let i=brace;i<s.length;i++){if(s[i]==='{')depth++;else if(s[i]==='}'&&--depth===0){end=i+1;break}}
 if(end<0)throw new Error(`pass-r: unterminated function ${name}`);
 s=s.slice(0,start)+code+s.slice(end);
}

if(!s.includes("from './director-objectives.js'"))s="import {createSpatialObjective,updateSpatialObjective,drawSpatialObjective} from './director-objectives.js';\n"+s;
if(!s.includes('let directorObjective=null;'))s=s.replace('let runCoins=', 'let directorObjective=null;\nlet runCoins=');

replaceFunction('updateDirectorHud',`function updateDirectorHud(){
 const box=document.querySelector('#director-objective');if(!box)return;const e=director?.active;
 if(!e){box.classList.add('hidden');return}
 box.classList.remove('hidden');box.classList.toggle('crisis',e.kind==='crisis');
 document.querySelector('#director-title').textContent=(e.kind==='crisis'?'CRISIS':'OPPORTUNITY')+' // '+e.label;
 const spatial=directorObjective?.status?(' · '+directorObjective.status):'';
 document.querySelector('#director-progress').textContent=Math.floor(e.progress||0)+' / '+e.target+' · PAYOUT ◈ '+e.payout+spatial;
 box.title=e.instruction||'';
}`);

replaceFunction('startDirectorEvent',`function startDirectorEvent(e){
 beginDirectorEvent(e,{kills:player.kills,eliteKills});
 directorObjective=createSpatialObjective(e,player);
 audio.cue(e.kind==='crisis'?'boss':'warning');toast((e.kind==='crisis'?'CRISIS':'OPPORTUNITY')+' // '+e.label);
 spawnFormation(e.formation,'swarm',e.kind==='crisis'?1.2:1);
 if(e.metric==='eliteKills'||e.kind==='crisis'){spawnEnemy(false,'elite');const elite=enemies.at(-1),angle=rand(0,TAU),r=Math.max(W,H)*.55;if(elite){elite.x=player.x+Math.cos(angle)*r;elite.y=player.y+Math.sin(angle)*r;elite.directed=true}}
 if(e.instruction)toast(e.label+' // '+e.instruction);
 updateDirectorHud();
}`);

replaceFunction('tickRunDirector',`function tickRunDirector(dt=0){
 if(!director)return;
 const start=pollDirector(director,elapsed);if(start)startDirectorEvent(start);
 const spatial=director?.active&&directorObjective?updateSpatialObjective(directorObjective,director.active,player,dt,{nearbyEnemies}):null;
 const result=updateDirectorEvent(director,{elapsed,kills:player.kills,eliteKills,customProgress:spatial?.progress,failed:spatial?.failed});
 if(result?.type==='complete'){
  runCoins+=result.event.payout;
  player.hp=Math.min(player.maxHp,player.hp+player.maxHp*.12);
  gain(6+activeWorld*3);
  fx?.play?.('mech.levelUp',{x:player.x,y:player.y,intensity:.8});audio.cue('level');toast('OBJECTIVE COMPLETE // BONUS EVOLUTION');
  directorObjective=null;
  setTimeout(()=>{if(state==='play')openLevel(true)},180);
 }else if(result?.type==='failed'){
  toast('OBJECTIVE LOST // '+result.event.label);directorObjective=null;
 }
 updateDirectorHud();
}`);

s=s.replace('tickRunDirector();','tickRunDirector(dt);');
s=s.replace('director=createRunDirector({world:activeWorld,seed:String(activeWorld)+\'-\'+Date.now()});','directorObjective=null;director=createRunDirector({world:activeWorld,seed:String(activeWorld)+\'-\'+Date.now()});');
if(!s.includes('drawSpatialObjective(ctx,directorObjective')){
 requireToken('fx.draw(ctx)','VFX draw seam');
 s=s.replace('fx.draw(ctx)','drawSpatialObjective(ctx,directorObjective,director?.active,elapsed,palette);fx.draw(ctx)');
}

for(const [token,label] of [["createSpatialObjective",'objective import'],['tickRunDirector(dt)','director dt tick'],['customProgress:spatial?.progress','custom objective progress'],['drawSpatialObjective(ctx,directorObjective','objective world rendering'],['openLevel(true)','bonus evolution reward']])requireToken(token,label);
fs.writeFileSync(path,s);
console.log('pass-r: spatial objectives + gameplay rewards integrated');
