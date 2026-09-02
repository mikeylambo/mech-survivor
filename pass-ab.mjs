import fs from 'node:fs';

const path='public/game.js';
let s=fs.readFileSync(path,'utf8');
const replace=(from,to,label)=>{if(!s.includes(from)){if(s.includes(to))return;throw new Error(`pass-ab: missing ${label}`)}s=s.replace(from,to)};

replace(
"let player,enemies=[],shots=[],enemyShots=[],gems=[],particles=[],drones=[],caches=[],lightningFx=[],enemyGrid=new Map(),keys=new Set(),stick={x:0,y:0},choicePool=[],padDashLatch=false,touchId=null;",
"let player,enemies=[],shots=[],enemyShots=[],gems=[],particles=[],drones=[],caches=[],lightningFx=[],ringFx=[],combatText=[],enemyGrid=new Map(),keys=new Set(),stick={x:0,y:0},choicePool=[],padDashLatch=false,touchId=null;",
'combat readability state');

replace(
"caches=[];lightningFx=[];enemyGrid.clear();shake=flash=0;const maxHp=",
"caches=[];lightningFx=[];ringFx=[];combatText=[];enemyGrid.clear();shake=flash=0;const maxHp=",
'reset readability FX');

replace(
"const synergies=[\n {id:'railstorm',name:'RAILSTORM ARRAY',needs:{beam:4,reactor:3},desc:'Twin rail fire inherits reactor overclock and gains ricochet.',effect:'Rail shots ricochet once'},\n {id:'seraphhalo',name:'SERAPH HALO',needs:{missile:3,drone:3},desc:'Halo drones designate targets for micro-missile support.',effect:'Drones periodically launch missiles'},\n {id:'aegisnova',name:'AEGIS NOVA',needs:{orbit:4,pulse:3},desc:'Orbit blades charge the reactor pulse into a cutting wave.',effect:'Nova pulse carries blade damage'},\n {id:'gravitywell',name:'GRAVITY WELL',needs:{magnet:4,mine:3},desc:'Zero Mines inherit graviton pull before detonation.',effect:'Mines pull nearby enemies'},\n {id:'fortressdrive',name:'FORTRESS DRIVE',needs:{armor:4,thruster:4},desc:'Vector dash converts armor mass into a collision ram.',effect:'Dash damages enemies'}\n];",
"const synergies=[\n {id:'railstorm',name:'RAILSTORM ARRAY',needs:{beam:4,reactor:3},desc:'Twin rail fire inherits reactor overclock and gains ricochet.',effect:'Rail shots ricochet once'},\n {id:'seraphhalo',name:'SERAPH HALO',needs:{missile:3,drone:3},desc:'Halo drones designate targets for micro-missile support.',effect:'Drones periodically launch missiles'},\n {id:'aegisnova',name:'AEGIS NOVA',needs:{orbit:4,pulse:3},desc:'Orbit blades charge the reactor pulse into a cutting wave.',effect:'Nova pulse carries blade damage'},\n {id:'gravitywell',name:'GRAVITY WELL',needs:{magnet:4,mine:3},desc:'Zero Mines inherit graviton pull before detonation.',effect:'Mines pull nearby enemies'},\n {id:'fortressdrive',name:'FORTRESS DRIVE',needs:{armor:4,thruster:4},desc:'Vector dash converts armor mass into a collision ram.',effect:'Dash damages enemies'},\n {id:'tempestrelay',name:'TEMPEST RELAY',needs:{arc:3,drone:2},desc:'Halo drones relay Judgment Arc deeper into the swarm.',effect:'+2 Arc chains · extended chain range'},\n {id:'nanitebastion',name:'NANITE BASTION',needs:{repair:2,armor:3},desc:'Nanite refit permanently seeds the armor lattice with repair swarms.',effect:'+0.8 integrity/sec passive repair'}\n];",
'complete synergy web');

replace(
"function reset(world=activeWorld){",
"function startingModules(classId){const base={beam:0,missile:0,drone:0,orbit:0,armor:0,thruster:0,reactor:0,magnet:0,pulse:0,arc:0,mine:0,repair:0};if(classId==='lancer'){base.orbit=1;base.thruster=1}else if(classId==='bulwark'){base.armor=1;base.pulse=1}else base.beam=1;return base}\nfunction reset(world=activeWorld){",
'starting frame kits');

replace(
"modules:{beam:1,missile:0,drone:0,orbit:0,armor:0,thruster:0,reactor:0,magnet:0,pulse:0,arc:0,mine:0,repair:0},invuln:0,dashTime:0,dashCooldown:0,dashDir:{x:0,y:-1},synergies:new Set(),bonusChoices:0",
"modules:startingModules(b.classId||'rook'),invuln:0,dashTime:0,dashCooldown:0,dashDir:{x:0,y:-1},synergies:new Set(),bonusChoices:0,banishes:1,banished:new Set(),hitFx:0,healFx:0",
'frame kit state');

replace(
"function shoot(){const e=nearest();",
"function shoot(){if(player.modules.beam<=0)return;const e=nearest();",
'rail only when installed');

replace(
"function damageEnemy(e,d){if(e.dead||e.hp<=0)return false;if(Math.random()<player.crit)d*=2;d*=1-(e.armor||0);e.hp-=d;e.hit=.09;flash=Math.min(1,flash+.05);",
"function hurtPlayer(amount,inv=.45,impact=7){if(player.invuln>0)return false;const d=Math.max(0,amount);player.hp-=d;player.invuln=inv;player.hitFx=.24;shake=Math.max(shake,impact);burst(player.x,player.y,palette.red,10);combatText.push({x:player.x,y:player.y-24,text:`-${Math.max(1,Math.round(d))}`,color:'#ff6b78',life:.58,max:.58,vy:-28});const v=document.querySelector('#combat-vignette');if(v){v.classList.remove('heal');v.classList.add('hit');clearTimeout(hurtPlayer._t);hurtPlayer._t=setTimeout(()=>v.classList.remove('hit'),130)}return true}\nfunction healPlayer(amount,label='REPAIR'){const before=player.hp;player.hp=Math.min(player.maxHp,player.hp+Math.max(0,amount));const gained=player.hp-before;if(gained>0){player.healFx=.32;combatText.push({x:player.x,y:player.y-28,text:`+${Math.max(1,Math.round(gained))}`,color:'#7fffd4',life:.72,max:.72,vy:-24});ringFx.push({x:player.x,y:player.y,r:10,to:62,life:.34,max:.34,color:'#7fffd4'});const v=document.querySelector('#combat-vignette');if(v){v.classList.remove('hit');v.classList.add('heal');clearTimeout(healPlayer._t);healPlayer._t=setTimeout(()=>v.classList.remove('heal'),180)}}return gained}\nfunction damageEnemy(e,d){if(e.dead||e.hp<=0)return false;let crit=false;if(Math.random()<player.crit){d*=2;crit=true}d*=1-(e.armor||0);e.hp-=d;e.hit=.09;combatText.push({x:e.x,y:e.y-e.r*.55,text:`${Math.max(1,Math.round(d))}`,color:crit?'#ffe27a':'#eaf7ff',life:.46,max:.46,vy:-22});ringFx.push({x:e.x,y:e.y,r:Math.max(4,e.r*.25),to:Math.max(13,e.r*.75),life:.12,max:.12,color:crit?palette.gold:palette.cyan});flash=Math.min(1,flash+.05);",
'combat feedback helpers');

replace(
"function openCache(c){c.dead=true;runCoins+=c.quality==='commander'?75:25;player.hp=Math.min(player.maxHp,player.hp+player.maxHp*.12);",
"function openCache(c){c.dead=true;runCoins+=c.quality==='commander'?75:25;healPlayer(player.maxHp*.12,'CACHE REPAIR');",
'cache healing feedback');

replace(
"if(u.id==='repair')player.hp=Math.min(player.maxHp,player.hp+player.maxHp*.35);syncSynergies();",
"if(u.id==='repair')healPlayer(player.maxHp*.35,'NANITE REFIT');syncSynergies();",
'repair feedback');

replace(
"player.hp=Math.min(player.maxHp,player.hp+player.regen*dt);",
"player.hp=Math.min(player.maxHp,player.hp+(player.regen+(player.synergies.has('nanitebastion')?.8:0))*dt);player.hitFx=Math.max(0,(player.hitFx||0)-dt);player.healFx=Math.max(0,(player.healFx||0)-dt);",
'nanite bastion passive');

replace(
"player.hp-=e.damage*.42*(1-player.armor);player.invuln=.4;shake=5",
"hurtPlayer(e.damage*.42*(1-player.armor),.4,5)",
'gene pulse player damage');
replace(
"player.hp-=e.damage*(e.genome?.stats.contact||1)*(1-player.armor);player.invuln=.62;shake=10;burst(player.x,player.y,palette.red,14)",
"hurtPlayer(e.damage*(e.genome?.stats.contact||1)*(1-player.armor),.62,10)",
'contact player damage');
replace(
"player.hp-=s.damage*(1-player.armor);player.invuln=.45;s.dead=true;shake=7;burst(player.x,player.y,palette.red,9)",
"hurtPlayer(s.damage*(1-player.armor),.45,7);s.dead=true",
'projectile player damage');

s=s.replaceAll("hue:g.presentation.accent","hue:350");

replace(
"const count=1+player.modules.arc+(player.modules.arc>=5?2:0),range=255+player.modules.arc*18,pool=nearbyEnemies(player.x,player.y,range*(count>3?2.1:1.65));",
"const relay=player.synergies.has('tempestrelay'),count=1+player.modules.arc+(player.modules.arc>=5?2:0)+(relay?2:0),range=255+player.modules.arc*18+(relay?70:0),pool=nearbyEnemies(player.x,player.y,range*(count>3?2.1:1.65));",
'Tempest Relay mechanic');

replace(
"const eligible=upgrades.filter(u=>(u.id!=='repair'&&player.modules[u.id]<u.max)||(u.id==='repair'&&player.hp<player.maxHp*.82));",
"const eligible=upgrades.filter(u=>!player.banished.has(u.id)&&((u.id!=='repair'&&player.modules[u.id]<u.max)||(u.id==='repair'&&player.hp<player.maxHp*.82)));",
'banish pool filter');

replace(
"d.onclick=()=>choose(i);box.append(d)",
"d.onclick=()=>choose(i);if(player.banishes>0){const bx=document.createElement('span');bx.className='banish-action';bx.textContent=`BANISH · ${player.banishes}`;bx.onclick=e=>{e.stopPropagation();banishChoice(i)};d.append(bx)}box.append(d)",
'banish card affordance');

replace(
"$('#reroll').onclick=()=>{if(player.rerolls<=0)return;player.rerolls--;$('#reroll-count').textContent=player.rerolls;$('#reroll').classList.toggle('hidden',player.rerolls<=0);rollChoices()};",
"$('#reroll').onclick=()=>{if(player.rerolls<=0)return;player.rerolls--;$('#reroll-count').textContent=player.rerolls;$('#reroll').classList.toggle('hidden',player.rerolls<=0);rollChoices()};\nfunction banishChoice(i){const u=choicePool[i];if(!u||player.banishes<=0)return;player.banishes--;player.banished.add(u.id);toast(`${u.name.toUpperCase()} // BANISHED`);rollChoices()}",
'banish action');

replace(
"burst(player.x,player.y,palette.cyan,28);shake=6",
"ringFx.push({x:player.x,y:player.y,r:10,to:radius,life:.32,max:.32,color:palette.cyan});burst(player.x,player.y,palette.cyan,28);shake=6",
'Nova Pulse wave');

replace(
"burst(s.x,s.y,s.kind==='mine'?palette.cyan:palette.gold,18);shake=5",
"ringFx.push({x:s.x,y:s.y,r:10,to:radius,life:.22,max:.22,color:s.kind==='mine'?palette.cyan:palette.gold});burst(s.x,s.y,s.kind==='mine'?palette.cyan:palette.gold,18);shake=5",
'explosion wave FX');

replace(
"for(const g of gems){g.vx*=Math.pow(.05,dt);",
"for(const g of gems){g.px=g.x;g.py=g.y;g.vx*=Math.pow(.05,dt);",
'pickup trail history');

replace(
"for(const g of gems){if(!visible(g,80))continue;ctx.fillStyle=palette.cyan;",
"for(const g of gems){if(!visible(g,80))continue;if(g.px!=null){ctx.save();ctx.globalAlpha=.38;ctx.strokeStyle=palette.cyan;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(g.px,g.py);ctx.lineTo(g.x,g.y);ctx.stroke();ctx.restore()}ctx.fillStyle=palette.cyan;",
'pickup trail render');

replace(
"function draw(){",
"function drawRingFx(r){const t=1-r.life/r.max,rr=r.r+(r.to-r.r)*t;ctx.save();ctx.globalAlpha=Math.max(0,r.life/r.max)*.7;ctx.strokeStyle=r.color;ctx.shadowColor=r.color;ctx.shadowBlur=10;ctx.lineWidth=2;ctx.beginPath();ctx.arc(r.x,r.y,rr,0,TAU);ctx.stroke();ctx.restore()}\nfunction drawCombatText(t){ctx.save();ctx.globalAlpha=Math.max(0,t.life/t.max);ctx.fillStyle=t.color;ctx.font='800 15px Rajdhani';ctx.textAlign='center';ctx.shadowColor='#000';ctx.shadowBlur=5;ctx.fillText(t.text,t.x,t.y);ctx.restore()}\nfunction draw(){",
'combat FX render helpers');

replace(
"for(const l of lightningFx)drawLightning(l);",
"for(const l of lightningFx)drawLightning(l);for(const r of ringFx)drawRingFx(r);for(const t of combatText)drawCombatText(t);",
'world combat FX drawing');

replace(
"for(const l of lightningFx)l.life-=dt;lightningFx=lightningFx.filter(l=>l.life>0);if(particles.length>430)",
"for(const l of lightningFx)l.life-=dt;lightningFx=lightningFx.filter(l=>l.life>0);for(const r of ringFx)r.life-=dt;ringFx=ringFx.filter(r=>r.life>0);for(const t of combatText){t.life-=dt;t.y+=t.vy*dt}combatText=combatText.filter(t=>t.life>0);if(particles.length>430)",
'combat FX lifecycle');

replace(
"function die(){if(player.revives>0){player.revives--;player.hp=player.maxHp*.5;player.invuln=2;toast('REBIRTH PROTOCOL // FRAME RESTORED');return}",
"function die(){if(player.revives>0){player.revives--;player.hp=0;healPlayer(player.maxHp*.5,'REBIRTH');player.invuln=2;toast('REBIRTH PROTOCOL // FRAME RESTORED');return}",
'rebirth feedback');

fs.writeFileSync(path,s);
console.log('pass-ab: combat readability + frame identity + synergy completion + banish applied');
