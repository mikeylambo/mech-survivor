import {bossForWorld} from './sector-content.js';
import {
 resolveCommanderDoctrine,
 PYLON_DAMAGE_SHARE,
 ANTI_SUMMON_CLEAR_SHARE,
} from './commander-doctrine.js';
import {srand} from './run-rng.js';
const TAU=Math.PI*2;
const ready=(e,key,dt,base)=>{e._bossRt||(e._bossRt={});e._bossRt[key]=(e._bossRt[key]??base)-dt;if(e._bossRt[key]<=0){e._bossRt[key]=base;return true}return false};
const pushShot=(arr,x,y,a,speed,damage,r=5,life=4)=>arr.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r,life,damage,kind:'boss-pattern'});
const ring=(arr,e,count,speed,damage,offset=0)=>{for(let i=0;i<count;i++)pushShot(arr,e.x,e.y,offset+i*TAU/count,speed,damage)};
// Aim leads the frame's own velocity when the doctrine calls for intercept
// lanes. Lead is a fraction of a second of travel, never a perfect solution:
// a dash still beats it.
const aim=(e,p)=>{const lead=e._lead||0;if(!lead)return Math.atan2(p.y-e.y,p.x-e.x);return Math.atan2(p.y+(e._pvy||0)*lead-e.y,p.x+(e._pvx||0)*lead-e.x)};
const phaseIndex=e=>{const hp=(e.hp||1)/(e.maxHp||1),p=e.bossPhases||[];let n=0;for(const t of p)if(hp<=t)n++;return n};

const AUTONOMOUS_KINDS=new Set(['drone','funnel','sentry','counter','soul']);

/** Damage share the commander actually takes right now. */
export function commanderDamageScale(e){
 if(!e?._doctrine)return 1;
 const profile=e._doctrine.profile;
 let scale=1;
 if((e._exposed||0)>0)scale*=profile.vulnerability||1;
 if((e._pylonsAlive||0)>0)scale*=PYLON_DAMAGE_SHARE;
 return scale;
}

/**
 * Commander-aware damage. Also the place break pressure accumulates, so
 * sustained damage converts into an opening instead of being resisted away.
 */
export function applyCommanderDamage(e,d){
 if(!e?._doctrine)return d;
 const profile=e._doctrine.profile,scaled=d*commanderDamageScale(e);
 if(profile.breakPressureGain>0&&(e._exposed||0)<=0){
  e._break=(e._break||0)+scaled*profile.breakPressureGain;
  const threshold=Math.max(1,(e.maxHp||1)*.09);
  if(e._break>=threshold){e._break=0;e._exposed=profile.exposedWindow;e._doctrineEvent='BREAK'}
 }
 if(profile.weakpoints>0&&(e._exposed||0)<=0&&(e._plates||0)>0){
  e._plateHp=(e._plateHp||0)-scaled;
  if(e._plateHp<=0){
   e._plates--;
   e._plateHp=Math.max(1,(e.maxHp||1)*.06);
   // Each plate is a small opening; stripping the last one is the execution window.
   e._exposed=Math.max(e._exposed||0,e._plates>0?.8:profile.exposedWindow);
   e._doctrineEvent=e._plates>0?'PLATE':'EXECUTE';
  }
 }
 return scaled;
}

/** How much of a control push the core still takes. Never zero. */
export function commanderControlResist(e){
 const resist=e?._doctrine?.profile?.lockdownResist||0;
 return Math.max(0,1-resist);
}

function spawnPylons(boss,ctx,count){
 const {enemies,spawnEnemy}=ctx;
 let placed=0;
 for(let i=0;i<count;i++){
  const before=enemies.length;
  spawnEnemy?.(false,'elite');
  const pylon=enemies[enemies.length-1];
  // Only claim it if a new enemy really arrived; the spawner honours caps.
  if(!pylon||enemies.length===before)continue;
  const a=i*TAU/count;
  pylon.x=boss.x+Math.cos(a)*210;
  pylon.y=boss.y+Math.sin(a)*210;
  pylon._pylonOf=boss;
  pylon.hp=Math.min(pylon.hp||1,Math.max(30,(boss.maxHp||100)*.08));
  pylon.maxHp=pylon.hp;
  placed++;
 }
 return placed;
}

/**
 * The doctrine layer. Runs before the commander's authored pattern set and can
 * suppress it — a telegraph the player cannot read is not a telegraph.
 */
function tickDoctrine(boss,ctx,phase){
 const {player,dt,elapsed,enemies,enemyShots,shots,toast}=ctx;
 const profile=boss._doctrine.profile;

 // Track the frame's velocity for intercept lanes.
 if(boss._px!=null&&dt>0){boss._pvx=(player.x-boss._px)/dt;boss._pvy=(player.y-boss._py)/dt}
 boss._px=player.x;boss._py=player.y;
 boss._lead=profile.interceptLead||0;
 // Published for the control families to read; capped by the fairness limit
 // so a graviton or repulsor always moves the core, just less.
 boss.controlResist=profile.lockdownResist||0;

 boss._exposed=Math.max(0,(boss._exposed||0)-dt);
 boss._telegraph=Math.max(0,(boss._telegraph||0)-dt);
 boss._pylonsAlive=enemies.reduce((n,e)=>n+(e._pylonOf===boss&&!e.dead?1:0),0);

 let suppressed=(boss._exposed||0)>0||(boss._telegraph||0)>0;

 // SIEGE — announce, displace, then stand open for a long beat.
 if(profile.displaceInterval>0){
  if(boss._displacing&&boss._telegraph<=0){
   boss._displacing=false;
   const a=srand()*TAU,r=360+srand()*140;
   boss.x=player.x+Math.cos(a)*r;boss.y=player.y+Math.sin(a)*r;
   boss._exposed=Math.max(boss._exposed,profile.exposedWindow);
   boss._doctrineEvent='DISPLACE';
  }else if(!boss._displacing&&(boss._exposed||0)<=0&&ready(boss,'displace',dt,profile.displaceInterval)){
   boss._displacing=true;boss._telegraph=profile.displaceTelegraph;suppressed=true;
  }
 }

 // MOBILE — pays for its own repositioning with an opening.
 if(profile.repositionInterval>0&&(boss._exposed||0)<=0&&ready(boss,'reposition',dt,profile.repositionInterval)){
  const a=Math.atan2(boss.y-player.y,boss.x-player.x)+(srand()<.5?1:-1)*(.7+srand()*.6);
  boss.x=player.x+Math.cos(a)*300;boss.y=player.y+Math.sin(a)*300;
  boss._exposed=Math.max(boss._exposed,profile.exposedWindow);
  boss._doctrineEvent='REPOSITION';
 }

 // CLOSE — the ring makes the approach cost something; standing there is the reward.
 if(profile.outerRingInterval>0&&ready(boss,'outerRing',dt,profile.outerRingInterval)){
  const count=14+phase*3,radius=profile.outerRingRadius;
  for(let i=0;i<count;i++){
   const a=i*TAU/count+elapsed*.2;
   pushShot(enemyShots,boss.x+Math.cos(a)*radius,boss.y+Math.sin(a)*radius,a,150+phase*15,(boss.damage||20)*.5,5,3);
  }
  boss._exposed=Math.max(boss._exposed,profile.exposedWindow);
  boss._doctrineEvent='RING';
 }

 // SUMMON — a multi-point problem whose solution IS the opening. Any weapon
 // can clear the pylons; autonomous units are simply good at it because they
 // engage on their own while the frame handles the core.
 if(profile.pylons>0){
  if(!boss._pylonSet||boss._pylonPhase!==phase){
   boss._pylonSet=true;boss._pylonPhase=phase;
   boss._pylonsStanding=spawnPylons(boss,ctx,profile.pylons);
   boss._pylonsAlive=boss._pylonsStanding;
   if(boss._pylonsStanding>0)boss._doctrineEvent='PYLONS';
  }else if(boss._pylonsStanding>0&&boss._pylonsAlive===0){
   boss._pylonsStanding=0;
   boss._exposed=Math.max(boss._exposed,profile.exposedWindow);
   boss._doctrineEvent='PYLONS-DOWN';
  }
 }
 if(profile.antiSummonInterval>0&&shots&&ready(boss,'antiSummon',dt,profile.antiSummonInterval)){
  const autonomous=shots.filter(s=>AUTONOMOUS_KINDS.has(s.kind)&&!s.dead);
  const clear=Math.floor(autonomous.length*ANTI_SUMMON_CLEAR_SHARE);
  for(let i=0;i<clear;i++)autonomous[i].dead=true;
  if(clear>0)toast?.('ANTI-SUMMON PULSE');
 }

 // AOE_SWARM — formations that alternate between one cluster and two. Calling
 // one costs the commander a beat, so the cluster and the opening arrive
 // together and clearing the swarm is worth doing at the core's expense.
 if(profile.formationSize>0&&ready(boss,'formation',dt,profile.formationInterval)){
  boss._split=!boss._split;
  const groups=boss._split?2:1,per=Math.max(1,Math.round(profile.formationSize/groups));
  for(let g=0;g<groups;g++)for(let i=0;i<per;i++)ctx.spawnEnemy?.(false,'swarm');
  boss._exposed=Math.max(boss._exposed,profile.exposedWindow);
  boss._doctrineEvent=boss._split?'SPLIT':'MASS';
 }

 // TEMPORAL — a clock, not immunity. Safe windows suppress fire and open the core.
 let safe=false;
 if(profile.cadencePeriod>0){
  const t=elapsed%profile.cadencePeriod;
  safe=t<profile.cadencePeriod*profile.cadenceSafeShare;
  if(safe){suppressed=true;boss._exposed=Math.max(boss._exposed,dt*2)}
 }

 // PRECISION — plates are restocked once per phase so every phase has structure.
 if(profile.weakpoints>0&&boss._platePhase!==phase){
  boss._platePhase=phase;
  boss._plates=profile.weakpoints;
  boss._plateHp=Math.max(1,(boss.maxHp||100)*.06);
 }

 const event=boss._doctrineEvent;boss._doctrineEvent=null;
 return{
  suppressed,
  safe,
  exposed:(boss._exposed||0)>0,
  exposedFor:boss._exposed||0,
  telegraph:boss._telegraph||0,
  plates:boss._plates||0,
  pylons:boss._pylonsAlive||0,
  event,
 };
}

export function tickBossRuntime({world=0,enemies,enemyShots,shots,player,dt,elapsed,spawnEnemy,damageEnemy,burst,toast,doctrineOptions,onPhaseBreak}){
 const boss=enemies.find(e=>e.t==='boss'&&!e.dead);if(!boss)return null;const spec=bossForWorld(world);
 // Read the build once, when the commander arrives. Re-reading it mid-fight
 // would read as the boss cheating rather than responding.
 if(!boss._doctrine)boss._doctrine=resolveCommanderDoctrine(player,doctrineOptions);
 const phase=phaseIndex(boss);
 if(boss._bossPhase!==phase){boss._bossPhase=phase;toast?.(spec.name+' // PHASE '+(phase+1));burst?.(boss.x,boss.y,'#ffcf66',26+phase*8);onPhaseBreak?.(phase,spec,boss)}
 const state=tickDoctrine(boss,{enemies,enemyShots,shots,player,dt,elapsed,spawnEnemy,damageEnemy,burst,toast},phase);
 const dmg=(boss.damage||20)*.62;
 if(!state.suppressed){
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
 }
 if((boss._chargeTime||0)>0){boss._chargeTime-=dt;boss.x+=(boss.vx||0)*dt;boss.y+=(boss.vy||0)*dt}else{boss.vx=boss.vy=0}
 return{boss:spec.id,phase,doctrine:boss._doctrine,state};
}
