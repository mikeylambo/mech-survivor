import {deckForWorld} from './sector-content.js';
import {OBJECTIVE_ARCHETYPES} from './director.js';
const TAU=Math.PI*2;
const ready=(s,key,dt,base)=>{s[key]=(s[key]??base)-dt;if(s[key]<=0){s[key]=base;return true}return false};
const pushShot=(arr,x,y,a,speed,damage,r=4,life=4)=>arr.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r,life,damage,kind:'sector-pressure'});
function stateFor(player){return player._sectorRt||(player._sectorRt={});}
export function applySectorDeck(director,deck){if(!director||!deck)return director;director.sectorDeck=deck.id;for(let i=0;i<director.slots.length;i++){const slot=director.slots[i],id=deck.objectives[i%deck.objectives.length],a=OBJECTIVE_ARCHETYPES[id]||OBJECTIVE_ARCHETYPES.purge;slot.archetypeId=a.id;slot.label=a.label;slot.metric=a.metric;slot.formation=deck.formations[i%deck.formations.length];slot.target=Math.max(1,Math.round(a.baseTarget*(1+director.world*.12)*(slot.kind==='crisis'?1.35:1)));slot.payout=Math.round(a.payout*(1+director.world*.18)*(slot.kind==='crisis'?1.4:1))}return director}
export function tickSectorRuntime({world=0,player,enemies,enemyShots,dt,elapsed,spawnEnemy,toast}){
 const s=stateFor(player),deck=deckForWorld(world),phase=elapsed<110?0:elapsed<250?1:elapsed<360?2:elapsed<420?3:4;
 if(s.world!==world){s.world=world;s.announced=false;s.lane=0;s.angle=0}
 if(!s.announced){s.announced=true;toast?.(deck.name+' // '+deck.pressure.toUpperCase())}
 if(world===0){
  if(ready(s,'lanePulse',dt,Math.max(4.8,8-phase*.65))){s.lane=(s.lane+1)%4;const vertical=s.lane%2===0;for(let i=-2;i<=2;i++){const off=i*68;if(vertical){pushShot(enemyShots,player.x+off,player.y-420,Math.PI/2,150+phase*14,8+phase*2,5,6);pushShot(enemyShots,player.x+off,player.y+420,-Math.PI/2,150+phase*14,8+phase*2,5,6)}else{pushShot(enemyShots,player.x-420,player.y+off,0,150+phase*14,8+phase*2,5,6);pushShot(enemyShots,player.x+420,player.y+off,Math.PI,150+phase*14,8+phase*2,5,6)}}}
 }else if(world===1){
  if(ready(s,'mirror',dt,Math.max(3.8,6.6-phase*.45))){const a=(s.angle+=Math.PI/4);for(const side of[-1,1])for(const spread of[-.12,0,.12])pushShot(enemyShots,player.x+Math.cos(a)*380*side,player.y+Math.sin(a)*380*side,a+(side<0?0:Math.PI)+spread,190+phase*16,9+phase*2,4,5)}
 }else if(world===2){
  if(ready(s,'foundryAdd',dt,Math.max(4.5,8-phase*.6)))for(let i=0;i<1+Math.floor(phase/2);i++)spawnEnemy?.(false,phase>=3?'brute':'swarm');
  if(ready(s,'shell',dt,Math.max(3.6,6-phase*.4))){for(const a of[-.22,0,.22])pushShot(enemyShots,player.x+Math.cos(a)*520,player.y-420,Math.PI/2+a,115+phase*10,13+phase*2,9,6)}
 }else if(world===3){
  const pull=(5+phase*2.5)*dt;for(const e of enemies){if(e.dead)continue;const dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy)||1;e.x+=dx/d*pull;e.y+=dy/d*pull}
  if(ready(s,'collapse',dt,Math.max(4,7-phase*.5))){for(let i=0;i<10+phase*2;i++){const a=i*TAU/(10+phase*2)+elapsed*.25;pushShot(enemyShots,player.x+Math.cos(a)*360,player.y+Math.sin(a)*360,a+Math.PI,105+phase*12,10+phase*2,5,5)}}
 }else{
  if(ready(s,'mixed',dt,Math.max(3.4,6.5-phase*.5))){const mode=(s.lane++%4);if(mode===0){for(let i=0;i<8+phase;i++){const a=i*TAU/(8+phase);pushShot(enemyShots,player.x+Math.cos(a)*340,player.y+Math.sin(a)*340,a+Math.PI,145+phase*14,11+phase*2,5,5)}}else if(mode===1){for(let i=0;i<2+Math.floor(phase/2);i++)spawnEnemy?.(false,phase>=3?'elite':'brute')}else if(mode===2){for(const a of[-.35,-.17,0,.17,.35])pushShot(enemyShots,player.x-420,player.y-220,Math.atan2(220,420)+a,220,10+phase*2,4,5)}else{for(const e of enemies)if(!e.dead&&e.t!=='boss'){const dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy)||1;e.x-=dx/d*18*dt;e.y-=dy/d*18*dt}}}
 }
 return{sector:deck.id,pressure:deck.pressure,phase};
}
export function drawSectorField(ctx,{world=0,W,H,elapsed=0}){
 ctx.save();ctx.globalAlpha=.16;ctx.lineWidth=1;
 if(world===0){ctx.strokeStyle='#d6ae52';for(let i=-4;i<=4;i++){ctx.beginPath();ctx.moveTo(W/2+i*80,0);ctx.lineTo(W/2+i*80,H);ctx.stroke()}}
 else if(world===1){ctx.strokeStyle='#78e7ff';for(let i=-H;i<W+H;i+=90){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i-H,H);ctx.stroke();ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+H,H);ctx.stroke()}}
 else if(world===2){ctx.strokeStyle='#ff9a4d';for(let y=40;y<H;y+=96){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}for(let x=48;x<W;x+=128){ctx.strokeRect(x,0,36,H)}}
 else if(world===3){ctx.strokeStyle='#9f7cff';for(let r=80;r<Math.max(W,H);r+=90){ctx.beginPath();ctx.arc(W/2,H/2,r+Math.sin(elapsed*1.7+r)*8,0,TAU);ctx.stroke()}}
 else{ctx.strokeStyle='#eaf7ff';for(let r=70;r<Math.max(W,H);r+=105){ctx.beginPath();ctx.arc(W/2,H/2,r,0,TAU);ctx.stroke()}for(let a=0;a<TAU;a+=Math.PI/4){ctx.beginPath();ctx.moveTo(W/2,H/2);ctx.lineTo(W/2+Math.cos(a)*Math.max(W,H),H/2+Math.sin(a)*Math.max(W,H));ctx.stroke()}}
 ctx.restore();
}
