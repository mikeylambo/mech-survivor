const TAU=Math.PI*2;
const rt=p=>p._configRt||(p._configRt={});
const ready=(p,id,dt,base)=>{const r=rt(p);r[id]=(r[id]??base)-dt;if(r[id]<=0){r[id]=base;return true}return false};
const nearest=(enemies,x,y)=>{let b=null,d=Infinity;for(const e of enemies){if(e.dead)continue;const q=(e.x-x)**2+(e.y-y)**2;if(q<d){d=q;b=e}}return b};
const strongest=enemies=>[...enemies].filter(e=>!e.dead).sort((a,b)=>(b.hp||0)-(a.hp||0))[0];
const around=(enemies,x,y,r)=>{const q=r*r;return enemies.filter(e=>!e.dead&&(e.x-x)**2+(e.y-y)**2<=q)};
const shot=(shots,x,y,target,damage,kind='configuration',speed=560)=>{if(!target)return;const a=Math.atan2(target.y-y,target.x-x);shots.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:3,life:1.5,damage,kind,pierce:0})};
const fx=(p,type,data)=>{(p.arsenalFx||(p.arsenalFx=[])).push({type,life:data.life||.3,max:data.life||.3,...data})};
export function tickConfigurations(p,dt,c){const ids=p.configurations||new Set();if(!ids.size)return;const {enemies,shots,damageEnemy,elapsed}=c;const R=rt(p),has=id=>ids.has(id);
 if(has('gravity-spear'))for(const e of around(enemies,p.x,p.y,260)){const dx=p.x-e.x,dy=p.y-e.y,l=Math.hypot(dx,dy)||1;e.x+=dx/l*8*dt;e.y+=dy/l*8*dt;e._railAligned=.2}
 if(has('killbox')&&ready(p,'killbox',dt,1.35)){const t=nearest(enemies,p.x,p.y);if(t){const a=Math.atan2(t.y-p.y,t.x-p.x);for(const e of enemies){const da=Math.atan2(e.y-p.y,e.x-p.x),d=Math.hypot(e.x-p.x,e.y-p.y);if(d<220&&Math.abs(Math.atan2(Math.sin(da-a),Math.cos(da-a)))<.65){e.x+=Math.cos(a)*26;e.y+=Math.sin(a)*26;damageEnemy(e,8)}}fx(p,'arc',{x:p.x,y:p.y,a,r:190,life:.2})}}
 if(has('ballistic-cyclone')&&ready(p,'ballisticCyclone',dt,.55)){const t=nearest(enemies,p.x,p.y);if(t)shot(shots,p.x,p.y,t,8,'cyclone',700)}
 if(has('hunter-killer')&&ready(p,'hunterKiller',dt,1.2)){const t=strongest(enemies);if(t){t._marked=1.6;for(let i=0;i<3;i++)shot(shots,p.x,p.y,t,10,'hunter-config',520+i*25)}}
 if(has('breach-engine'))for(const e of enemies)if(e._drillHit){e._breach=Math.min(5,(e._breach||0)+dt*2)}
 if(has('prismatic-lance')&&ready(p,'prismaticLance',dt,1.1)){const t=nearest(enemies,p.x,p.y);if(t)for(const e of around(enemies,t.x,t.y,150).slice(0,4)){damageEnemy(e,7);fx(p,'beam',{x:t.x,y:t.y,x2:e.x,y2:e.y,w:1,life:.12})}}
 if(has('sun-engine')){R.sunCharge=Math.min(1,(R.sunCharge||0)+dt*.12);if(R.sunCharge>=1){R.sunCharge=0;for(const e of around(enemies,p.x,p.y,170))damageEnemy(e,15);fx(p,'ring',{x:p.x,y:p.y,r:170,life:.35})}}
 if(has('light-cathedral')&&ready(p,'cathedral',dt,2.3)){for(let i=0;i<4;i++){const a=i*TAU/4+elapsed*.2,x=p.x+Math.cos(a)*120,y=p.y+Math.sin(a)*120,t=nearest(enemies,x,y);if(t){fx(p,'beam',{x,y,x2:t.x,y2:t.y,w:2,life:.2});damageEnemy(t,12)}}}
 if(has('storm-circuit')&&ready(p,'stormCircuit',dt,.9)){for(const e of enemies.slice(0,6))if(!e.dead)damageEnemy(e,5)}
 if(has('thunder-dome')&&ready(p,'thunderDome',dt,1.4)){for(const e of around(enemies,p.x,p.y,130)){damageEnemy(e,9);fx(p,'beam',{x:p.x,y:p.y,x2:e.x,y2:e.y,w:1.5,life:.1})}}
 if(has('blade-tempest')&&ready(p,'bladeTempest',dt,1.0)){for(const e of around(enemies,p.x,p.y,160))damageEnemy(e,7);fx(p,'ring',{x:p.x,y:p.y,r:150,life:.2})}
 if(has('moon-halo')&&ready(p,'moonHalo',dt,1.7)){const t=nearest(enemies,p.x,p.y);if(t){shot(shots,p.x,p.y,t,18,'moon-blade',480);shot(shots,p.x,p.y,t,18,'moon-blade',520)}}
 if(has('execution-frame')&&ready(p,'executionFrame',dt,.8)){const t=strongest(enemies);if(t){t._marked=1;damageEnemy(t,10+(t._breach||0)*3)}}
 if(has('comet-edge')&&p.dashTime>0&&ready(p,'cometEdge',dt,.12)){for(const e of around(enemies,p.x,p.y,75))damageEnemy(e,14);fx(p,'arc',{x:p.x,y:p.y,a:Math.atan2(p.dashDir.y,p.dashDir.x),r:78,life:.16})}
 if(has('siege-network')&&ready(p,'siegeNetwork',dt,2.1)){const t=strongest(enemies);if(t){damageEnemy(t,20);fx(p,'ring',{x:t.x,y:t.y,r:55,life:.3})}}
 if(has('gravity-bombardment')&&ready(p,'gravityBomb',dt,1.9)){const t=nearest(enemies,p.x,p.y);if(t){for(const e of around(enemies,t.x,t.y,130)){e.x+=(t.x-e.x)*.08;e.y+=(t.y-e.y)*.08;damageEnemy(e,10)}fx(p,'ring',{x:t.x,y:t.y,r:130,life:.3})}}
 if(has('cascade-warhead')&&R.lastKillCount!==p.kills){const delta=p.kills-(R.lastKillCount||p.kills);R.lastKillCount=p.kills;if(delta>0&&ready(p,'cascade',dt,.08)){const t=nearest(enemies,p.x,p.y);if(t){damageEnemy(t,9*delta);fx(p,'ring',{x:t.x,y:t.y,r:45,life:.16})}}}
 if(has('mine-drive')&&p.dashTime>0&&ready(p,'mineDrive',dt,.14))shots.push({x:p.x,y:p.y,vx:0,vy:0,r:8,life:5,damage:18,kind:'mine',pierce:0})
 if(has('gravity-bloom')&&ready(p,'gravityBloom',dt,1.6)){const t=nearest(enemies,p.x,p.y);if(t){for(let i=0;i<8;i++){const a=i*TAU/8;shots.push({x:t.x+Math.cos(a)*55,y:t.y+Math.sin(a)*55,vx:-Math.cos(a)*180,vy:-Math.sin(a)*180,r:3,life:.6,damage:7,kind:'bloom',pierce:0})}fx(p,'ring',{x:t.x,y:t.y,r:60,life:.4})}}
 if(has('firebreak')&&ready(p,'firebreak',dt,1.25)){const t=nearest(enemies,p.x,p.y);if(t){for(const e of around(enemies,t.x,t.y,120)){e.x+=(e.x-p.x)*.06;e.y+=(e.y-p.y)*.06;damageEnemy(e,8)}fx(p,'zone',{x:t.x,y:t.y,r:100,life:.5})}}
 if(has('seraph-wing')&&ready(p,'seraphWing',dt,.85)){const t=nearest(enemies,p.x,p.y);if(t)for(let i=0;i<3;i++)shot(shots,p.x+Math.cos(i*TAU/3)*55,p.y+Math.sin(i*TAU/3)*55,t,9,'wing-missile',460)}
 if(has('celestial-mandala')&&ready(p,'mandala',dt,1.7)){for(const e of around(enemies,p.x,p.y,180))damageEnemy(e,6);fx(p,'ring',{x:p.x,y:p.y,r:175,life:.4});fx(p,'ring',{x:p.x,y:p.y,r:115,life:.4})}
 if(has('mobile-fortress'))p._configArmorBonus=.06;else p._configArmorBonus=0;
 if(has('aegis-choir')&&ready(p,'aegisChoir',dt,1.0)){const t=nearest(enemies,p.x,p.y);if(t)for(let i=0;i<2;i++)shot(shots,p.x+(i?48:-48),p.y,t,8,'choir',560)}
 if(has('kill-satellites')&&ready(p,'killSatellites',dt,1.8)){const t=strongest(enemies);if(t){t._marked=1.5;for(let i=0;i<4;i++){const a=i*TAU/4,x=t.x+Math.cos(a)*90,y=t.y+Math.sin(a)*90;fx(p,'beam',{x,y,x2:t.x,y2:t.y,w:2,life:.2});damageEnemy(t,6)}}}
 if(has('impact-throne')&&p.dashTime>0&&ready(p,'impactThrone',dt,.18)){for(const e of around(enemies,p.x,p.y,95))damageEnemy(e,12);fx(p,'ring',{x:p.x,y:p.y,r:90,life:.2})}
 if(has('zero-domain'))for(const e of around(enemies,p.x,p.y,145)){const d=Math.hypot(e.x-p.x,e.y-p.y)||1,target=110;e.x+=(e.x-p.x)/d*(target-d)*dt*1.2;e.y+=(e.y-p.y)/d*(target-d)*dt*1.2}
 if(has('mirror-storm')&&ready(p,'mirrorStorm',dt,1.5)){for(const e of around(enemies,p.x,p.y,220).slice(0,7)){damageEnemy(e,9);fx(p,'beam',{x:p.x,y:p.y,x2:e.x,y2:e.y,w:1.5,life:.12})}}
 if(has('extinction-chain')&&R.extKills!==p.kills){const d=p.kills-(R.extKills||p.kills);R.extKills=p.kills;if(d>0){for(const e of enemies.filter(e=>!e.dead).slice(0,Math.min(6,d+2)))damageEnemy(e,5+d*2)}}
 if(has('soul-missile-array')&&R.soulKills!==p.kills){const d=p.kills-(R.soulKills||p.kills);R.soulKills=p.kills;if(d>0){const t=nearest(enemies,p.x,p.y);for(let i=0;i<Math.min(5,d+1);i++)shot(shots,p.x,p.y,t,8,'soul-missile',500)}}
 if(has('harvest-crown')){R.harvest=Math.max(0,(R.harvest||0)-dt*.4);if(R.harvestKills!==p.kills){R.harvest=Math.min(8,R.harvest+Math.max(0,p.kills-(R.harvestKills||p.kills)));R.harvestKills=p.kills}if(ready(p,'harvestCrown',dt,.7)&&R.harvest>0){for(const e of around(enemies,p.x,p.y,90+R.harvest*5))damageEnemy(e,4+R.harvest)}}
 if(has('aftershock')&&ready(p,'aftershock',dt,2.2)){for(const e of around(enemies,p.x,p.y,180))damageEnemy(e,14);fx(p,'ring',{x:p.x,y:p.y,r:180,life:.45})}
 if(has('ghost-battery')&&ready(p,'ghostBattery',dt,2.8)){const t=nearest(enemies,p.x,p.y);if(t){damageEnemy(t,24);fx(p,'ring',{x:t.x,y:t.y,r:70,life:.4});R.ghostStrike={x:t.x,y:t.y,t:.55}}}if(R.ghostStrike){R.ghostStrike.t-=dt;if(R.ghostStrike.t<=0){for(const e of around(enemies,R.ghostStrike.x,R.ghostStrike.y,70))damageEnemy(e,18);fx(p,'ring',{x:R.ghostStrike.x,y:R.ghostStrike.y,r:70,life:.4});R.ghostStrike=null}}
 if(has('secondary-frame')&&ready(p,'secondaryFrame',dt,.9)){const t=nearest(enemies,p.x,p.y);if(t){shot(shots,p.x-35,p.y+35,t,12,'ghost-frame',620);fx(p,'dot',{x:p.x-35,y:p.y+35,r:12,life:.35})}}
 if(has('chrono-blade')&&ready(p,'chronoBlade',dt,1.25)){const t=nearest(enemies,p.x,p.y);if(t){damageEnemy(t,14);R.chrono={x:t.x,y:t.y,t:.4}}}if(R.chrono){R.chrono.t-=dt;if(R.chrono.t<=0){for(const e of around(enemies,R.chrono.x,R.chrono.y,75))damageEnemy(e,12);fx(p,'arc',{x:R.chrono.x,y:R.chrono.y,a:elapsed,r:80,life:.2});R.chrono=null}}
 if(has('broken-heaven')&&ready(p,'brokenHeaven',dt,1.15)){const targets=enemies.filter(e=>!e.dead).slice(0,8);for(let i=0;i<targets.length;i++){const e=targets[i],a=i*TAU/Math.max(1,targets.length),x=p.x+Math.cos(a)*130,y=p.y+Math.sin(a)*130;damageEnemy(e,10);fx(p,'beam',{x,y,x2:e.x,y2:e.y,w:1.5,life:.2})}fx(p,'ring',{x:p.x,y:p.y,r:135,life:.35})}
 for(const e of enemies){if(e._marked)e._marked=Math.max(0,e._marked-dt);if(e._railAligned)e._railAligned=Math.max(0,e._railAligned-dt)}
}
export function configurationDamageModifier(p,e,d){if(e?._marked)d*=1.18;if(e?._railAligned&&p.configurations?.has('gravity-spear'))d*=1.12;if(e?._breach&&p.configurations?.has('breach-engine'))d*=1+Math.min(.35,e._breach*.05);return d}
