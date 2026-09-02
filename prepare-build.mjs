import fs from 'node:fs';

const path='public/game.js';
let s=fs.readFileSync(path,'utf8');
const replace=(from,to,label)=>{if(!s.includes(from)){if(s.includes(to))return;throw new Error(`prepare-build: missing ${label}`)}s=s.replace(from,to)};

replace('function resize(){DPR=Math.min(devicePixelRatio||1,2);','function resize(){DPR=Math.min(devicePixelRatio||1,1.2);','DPR cap');
replace('let player,enemies=[],shots=[],enemyShots=[],gems=[],particles=[],drones=[],caches=[],keys=new Set(),stick={x:0,y:0},choicePool=[],padDashLatch=false,touchId=null;',
'let player,enemies=[],shots=[],enemyShots=[],gems=[],particles=[],drones=[],caches=[],lightningFx=[],keys=new Set(),stick={x:0,y:0},choicePool=[],padDashLatch=false,touchId=null;','lightning FX state');
replace('player={x:W/2,y:H/2,r:18,','player={x:0,y:0,r:18,','world-space player origin');
replace('caches=[];shake=flash=0;const maxHp=', 'caches=[];lightningFx=[];shake=flash=0;const maxHp=', 'reset transient FX');
replace('player.x=clamp(player.x+move.x*player.speed*dashMult*dt,28,W-28);player.y=clamp(player.y+move.y*player.speed*dashMult*dt,65,H-28);','player.x+=move.x*player.speed*dashMult*dt;player.y+=move.y*player.speed*dashMult*dt;','unbounded movement');
replace('room=Math.max(0,260-enemies.length)','room=Math.max(0,105-enemies.length)','enemy cap');
replace('enemies.length<245','enemies.length<100','brood cap');
replace('const interval=Math.max(.08,.62-elapsed*.0045-activeWorld*.035);','const interval=Math.max(.12,.62-elapsed*.0045-activeWorld*.035);','spawn floor');

s=s.replace(/function spawnEnemy\(boss=false,forcedType=null\)\{const side=Math\.floor\(Math\.random\(\)\*4\),pad=70;let x,y;if\(side===0\)\{x=rand\(-pad,W\+pad\);y=-pad\}else if\(side===1\)\{x=W\+pad;y=rand\(-pad,H\+pad\)\}else if\(side===2\)\{x=rand\(-pad,W\+pad\);y=H\+pad\}else\{x=-pad;y=rand\(-pad,H\+pad\)\}/,
`function spawnEnemy(boss=false,forcedType=null){const side=Math.floor(Math.random()*4),pad=90,cx=player?.x||0,cy=player?.y||0,hw=W*.58,hh=H*.58;let x,y;if(side===0){x=cx+rand(-hw,hw);y=cy-hh-pad}else if(side===1){x=cx+hw+pad;y=cy+rand(-hh,hh)}else if(side===2){x=cx+rand(-hw,hw);y=cy+hh+pad}else{x=cx-hw-pad;y=cy+rand(-hh,hh)}`);
if(!s.includes('cx=player?.x||0'))throw new Error('prepare-build: spawn camera patch failed');

replace("const grad=ctx.createRadialGradient(player.x,player.y,0,player.x,player.y,420);","const grad=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,420);",'arena light camera center');
replace('function drawMech(){drawCelestialFrame(ctx,player,elapsed,input(),palette,drones)}',`function drawMech(){drawCelestialFrame(ctx,player,elapsed,input(),palette,drones)}
function visible(o,margin=120){return Math.abs(o.x-player.x)<=W/2+margin&&Math.abs(o.y-player.y)<=H/2+margin}
function drawEnemyLOD(e){
 const g=e.genome,h=g?.presentation?.hue??315,a=g?.presentation?.accent??330,r=Math.max(5,e.r*(g?.presentation?.scale||1)*.72);
 ctx.save();ctx.translate(e.x,e.y);ctx.strokeStyle=\`hsl(\${a} 88% 60%)\`;ctx.fillStyle=\`hsl(\${h} 48% 13%)\`;ctx.lineWidth=1.4;
 const kind=g?.morphotype||g?.bodyPlan;
 ctx.beginPath();
 if(kind==='serpent'){ctx.ellipse(0,0,r*.65,r,0,0,TAU)}
 else if(kind==='avian'||kind==='insectoid'){ctx.moveTo(0,-r);ctx.lineTo(r,0);ctx.lineTo(0,r*.65);ctx.lineTo(-r,0);ctx.closePath()}
 else if(kind==='quadruped'||kind==='heavy-biped'||kind==='kaiju'){ctx.rect(-r*.8,-r*.55,r*1.6,r*1.1)}
 else ctx.arc(0,0,r,0,TAU);
 ctx.fill();ctx.stroke();ctx.fillStyle=\`hsl(\${a} 100% 72%)\`;ctx.beginPath();ctx.arc(0,-r*.18,Math.max(1.4,r*.16),0,TAU);ctx.fill();ctx.restore();
}
function drawCreatureSmart(e){if(!visible(e))return;const near=dist2(e,player)<320*320;if(e.t==='boss'||e.t==='elite'||near&&e.r>=22)drawArcaneCreature(ctx,e,elapsed);else drawEnemyLOD(e)}
function drawLightning(l){const alpha=Math.max(0,l.life/l.max);ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=palette.cyan;ctx.shadowColor=palette.cyan;ctx.shadowBlur=14;ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(l.ax,l.ay);const dx=l.bx-l.ax,dy=l.by-l.ay;for(let i=1;i<5;i++){const t=i/5,n=(Math.random()-.5)*16*alpha;const len=Math.hypot(dx,dy)||1;ctx.lineTo(l.ax+dx*t-dy/len*n,l.ay+dy*t+dx/len*n)}ctx.lineTo(l.bx,l.by);ctx.stroke();ctx.globalAlpha=alpha*.55;ctx.lineWidth=6;ctx.stroke();ctx.restore()}`,'camera helpers');

replace('function draw(){ctx.save();if(shake)ctx.translate(rand(-shake,shake),rand(-shake,shake));drawArena();for(const c of caches)',
'function draw(){ctx.save();if(shake)ctx.translate(rand(-shake,shake),rand(-shake,shake));drawArena();ctx.save();ctx.translate(W/2-player.x,H/2-player.y);for(const c of caches)','camera transform begin');
replace('for(const e of enemies)drawArcaneCreature(ctx,e,elapsed);','for(const e of enemies)drawCreatureSmart(e);','creature LOD');
replace("for(const g of gems){ctx.fillStyle=palette.cyan;","for(const g of gems){if(!visible(g,80))continue;ctx.fillStyle=palette.cyan;",'gem render cull');
replace("for(const s of enemyShots){ctx.fillStyle=","for(const s of enemyShots){if(!visible(s,100))continue;ctx.fillStyle=",'enemy shot render cull');
replace("for(const s of shots){ctx.strokeStyle=s.kind==='missile'?palette.gold:palette.cyan;ctx.lineWidth=s.kind==='missile'?4:2;ctx.shadowBlur=10;ctx.shadowColor=ctx.strokeStyle;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x-s.vx*.025,s.y-s.vy*.025);ctx.stroke()}",
`for(const s of shots){if(!visible(s,120))continue;if(s.kind==='mine'){const pulse=.5+.5*Math.sin(elapsed*9+s.x*.01);ctx.save();ctx.translate(s.x,s.y);ctx.strokeStyle=palette.cyan;ctx.fillStyle='rgba(15,75,110,.5)';ctx.shadowColor=palette.cyan;ctx.shadowBlur=12;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,9,0,TAU);ctx.fill();ctx.stroke();ctx.globalAlpha=.35+.25*pulse;ctx.beginPath();ctx.arc(0,0,18+pulse*7,0,TAU);ctx.stroke();ctx.restore();continue}ctx.strokeStyle=s.kind==='missile'?palette.gold:palette.cyan;ctx.lineWidth=s.kind==='missile'?4:2;ctx.shadowBlur=10;ctx.shadowColor=ctx.strokeStyle;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x-s.vx*.025,s.y-s.vy*.025);ctx.stroke()}for(const l of lightningFx)drawLightning(l);`,'mine and lightning rendering');
replace("for(const p of particles){ctx.globalAlpha=","for(const p of particles){if(!visible(p,100))continue;ctx.globalAlpha=",'particle render cull');
replace("ctx.globalAlpha=1;if(flash){ctx.fillStyle=\`rgba(70,180,255,\${flash*.08})\`;ctx.fillRect(0,0,W,H)}ctx.restore()}",
"ctx.globalAlpha=1;ctx.restore();if(flash){ctx.fillStyle=\`rgba(70,180,255,\${flash*.08})\`;ctx.fillRect(0,0,W,H)}ctx.restore()}",'camera transform end');

replace("player._arc=(player._arc||.5)-dt;if(player.modules.arc&&player._arc<=0){player._arc=Math.max(.5,1.7-player.modules.arc*.16);const targets=[...enemies].sort((a,b)=>dist2(a,player)-dist2(b,player)).slice(0,1+player.modules.arc+(player.modules.arc>=5?2:0));for(const e of targets){burst(e.x,e.y,palette.cyan,5);if(damageEnemy(e,13+player.modules.arc*7))e.dead=true}}",
`player._arc=(player._arc||.5)-dt;if(player.modules.arc&&player._arc<=0){player._arc=Math.max(.5,1.7-player.modules.arc*.16);const pool=enemies.filter(e=>!e.dead),count=1+player.modules.arc+(player.modules.arc>=5?2:0),range=255+player.modules.arc*18;let from=player;for(let i=0;i<count&&pool.length;i++){let best=-1,bd=range*range;for(let j=0;j<pool.length;j++){const d=dist2(pool[j],from);if(d<bd){bd=d;best=j}}if(best<0)break;const e=pool.splice(best,1)[0];lightningFx.push({ax:from.x,ay:from.y,bx:e.x,by:e.y,life:.16,max:.16});burst(e.x,e.y,palette.cyan,4);if(damageEnemy(e,13+player.modules.arc*7))e.dead=true;from=e}shake=Math.max(shake,2)}`,'judgment arc chain');

replace("for(let i=0;i<n;i++)shots.push({x:player.x+(i?18:-8),y:player.y+(i?-8:8),vx:0,vy:0,r:9,life:6,damage:28+player.modules.mine*12,kind:'mine',pierce:0})",
"for(let i=0;i<n;i++)shots.push({x:player.x+(i?18:-8),y:player.y+(i?-8:8),vx:0,vy:0,r:9,life:6,damage:28+player.modules.mine*12,kind:'mine',pierce:0,armed:.35,pulse:0})",'mine armed state');

replace("for(const s of shots){s.life-=dt;if(s.kind==='mine'&&player.synergies.has('gravitywell'))for(const e of enemies){const dd=Math.sqrt(dist2(s,e));if(dd<130&&dd>1){e.x+=(s.x-e.x)/dd*70*dt;e.y+=(s.y-e.y)/dd*70*dt}}if(s.kind==='missile'&&s.target&&!s.target.dead){",
`for(const s of shots){s.life-=dt;if(s.kind==='mine'){s.armed=Math.max(0,(s.armed??.35)-dt);s.pulse=(s.pulse||0)+dt;if(player.synergies.has('gravitywell'))for(const e of enemies){const dd=Math.sqrt(dist2(s,e));if(dd<145&&dd>1){e.x+=(s.x-e.x)/dd*82*dt;e.y+=(s.y-e.y)/dd*82*dt}}if(s.armed<=0){const trigger=82+player.modules.mine*6;let triggered=s.life<.25;for(const e of enemies)if(!e.dead&&dist2(s,e)<trigger*trigger){triggered=true;break}if(triggered){const radius=105+player.modules.mine*8;for(const e of enemies)if(!e.dead&&dist2(s,e)<radius*radius)damageEnemy(e,s.damage);burst(s.x,s.y,palette.cyan,24);shake=Math.max(shake,5);s.dead=true}}continue}if(s.kind==='missile'&&s.target&&!s.target.dead){`,'mine proximity logic');

s=s.replace(/shots=shots\.filter\(s=>!s\.dead&&s\.life>0&&s\.x>-100&&s\.x<W\+100&&s\.y>-100&&s\.y<H\+100\);enemyShots=enemyShots\.filter\(s=>!s\.dead&&s\.life>0&&s\.x>-120&&s\.x<W\+120&&s\.y>-120&&s\.y<H\+120\);/,
"shots=shots.filter(s=>!s.dead&&s.life>0&&Math.abs(s.x-player.x)<W*.85+250&&Math.abs(s.y-player.y)<H*.85+250);enemyShots=enemyShots.filter(s=>!s.dead&&s.life>0&&Math.abs(s.x-player.x)<W*.85+250&&Math.abs(s.y-player.y)<H*.85+250);if(shots.length>360)shots.splice(0,shots.length-360);if(enemyShots.length>220)enemyShots.splice(0,enemyShots.length-220);for(const l of lightningFx)l.life-=dt;lightningFx=lightningFx.filter(l=>l.life>0);");
if(!s.includes("Math.abs(s.x-player.x)<W*.85+250"))throw new Error('prepare-build: projectile world cull failed');

replace('function burst(x,y,color,n=8){for(let i=0;i<n;i++){','function burst(x,y,color,n=8){if(particles.length>400)n=Math.min(n,2);for(let i=0;i<n;i++){','particle cap');
replace('if(particles.length>650)particles.splice(0,particles.length-650);if(gems.length>450)gems.splice(0,gems.length-450);',
'if(particles.length>430)particles.splice(0,particles.length-430);if(gems.length>320)gems.splice(0,gems.length-320);','late-run transient caps');

fs.writeFileSync(path,s);
console.log('prepare-build: scrolling world + LOD + functional combat FX applied');
