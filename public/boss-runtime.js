import {bossForWorld} from './sector-content.js';
const TAU=Math.PI*2;
const ready=(e,key,dt,base)=>{e._bossRt||(e._bossRt={});e._bossRt[key]=(e._bossRt[key]??base)-dt;if(e._bossRt[key]<=0){e._bossRt[key]=base;return true}return false};
const pushShot=(arr,x,y,a,speed,damage,r=5,life=4)=>arr.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r,life,damage,kind:'boss-pattern'});
const ring=(arr,e,count,speed,damage,offset=0)=>{for(let i=0;i<count;i++)pushShot(arr,e.x,e.y,offset+i*TAU/count,speed,damage)};
const aim=(e,p)=>Math.atan2(p.y-e.y,p.x-e.x);
const phaseIndex=e=>{const hp=(e.hp||1)/(e.maxHp||1),p=e.bossPhases||[];let n=0;for(const t of p)if(hp<=t)n++;return n};
export function tickBossRuntime({world=0,enemies,enemyShots,player,dt,elapsed,spawnEnemy,damageEnemy,burst,toast}){
 const boss=enemies.find(e=>e.t==='boss'&&!e.dead);if(!boss)return null;const spec=bossForWorld(world),phase=phaseIndex(boss);if(boss._bossPhase!==phase){boss._bossPhase=phase;toast?.(spec.name+' // PHASE '+(phase+1));burst?.(boss.x,boss.y,'#ffcf66',26+phase*8)}
 const dmg=(boss.damage||20)*.62;
 if(spec.id==='crown-breaker'){
  if(ready(boss,'ring',dt,Math.max(1.2,2.6-phase*.35)))ring(enemyShots,boss,10+phase*3,145+phase*18,dmg,elapsed*.35);
  if(ready(boss,'charge',dt,4.6-phase*.45)){const a=aim(boss,player);boss.vx=Math.cos(a)*(220+phase*40);boss.vy=Math.sin(a)*(220+phase*40);boss._chargeTime=.7}
 }else if(spec.id==='glass-oracle'){
  if(ready(boss,'prism',dt,2.4-phase*.22)){const a=aim(boss,player);for(const s of[-.5,-.25,0,.25,.5])pushShot(enemyShots,boss.x,boss.y,a+s,210+phase*20,dmg,4)}
  if(ready(boss,'cross',dt,5.5-phase*.35))for(const a of[0,Math.PI/2,Math.PI,Math.PI*1.5])for(const s of[-.12,0,.12])pushShot(enemyShots,boss.x,boss.y,a+s,180,dmg*.8,3);
 }else if(spec.id==='war-foundry'){
  if(ready(boss,'adds',dt,6-phase*.6))for(let i=0;i<2+phase;i++)spawnEnemy?.(false,phase>1?'brute':'swarm');
  if(ready(boss,'mortar',dt,2.7-phase*.2)){const a=aim(boss,player);for(const s of[-.22,0,.22])pushShot(enemyShots,boss.x,boss.y,a+s,125,dmg*1.25,8,5)}
 }else if(spec.id==='void-regent'){
  const dx=boss.x-player.x,dy=boss.y-player.y,d=Math.hypot(dx,dy)||1,pull=(24+phase*9)*dt;player.x+=dx/d*pull;player.y+=dy/d*pull;
  if(ready(boss,'collapse',dt,3.4-phase*.25))ring(enemyShots,boss,12+phase*4,110+phase*10,dmg*.9,elapsed*.6);
  if(ready(boss,'lance',dt,4.8-phase*.3)){const a=aim(boss,player);for(const s of[-.08,0,.08])pushShot(enemyShots,boss.x,boss.y,a+s,310,dmg*1.1,4)}
 }else if(spec.id==='last-engine'){
  if(ready(boss,'mirror',dt,Math.max(.8,2.2-phase*.22))){const a=aim(boss,player),mode=phase%4;if(mode===0)ring(enemyShots,boss,8+phase*2,180,dmg);else if(mode===1)for(const s of[-.4,-.2,0,.2,.4])pushShot(enemyShots,boss.x,boss.y,a+s,240,dmg,4);else if(mode===2)for(let i=0;i<2+phase;i++)spawnEnemy?.(false,'elite');else{for(const e of enemies)if(e!==boss&&!e.dead&&Math.hypot(e.x-boss.x,e.y-boss.y)<180)damageEnemy?.(e,14+phase*4)}}
 }
 if((boss._chargeTime||0)>0){boss._chargeTime-=dt;boss.x+=(boss.vx||0)*dt;boss.y+=(boss.vy||0)*dt}else{boss.vx=boss.vy=0}
 return{boss:spec.id,phase};
}
