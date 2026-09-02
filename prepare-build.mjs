import fs from 'node:fs';

const path='public/game.js';
let s=fs.readFileSync(path,'utf8');
const replace=(from,to,label)=>{if(!s.includes(from)){if(s.includes(to))return;throw new Error(`prepare-build: missing ${label}`)}s=s.replace(from,to)};

replace('function resize(){DPR=Math.min(devicePixelRatio||1,2);','function resize(){DPR=Math.min(devicePixelRatio||1,1.35);','DPR cap');
replace('player={x:W/2,y:H/2,r:18,','player={x:0,y:0,r:18,','world-space player origin');
replace('player.x=clamp(player.x+move.x*player.speed*dashMult*dt,28,W-28);player.y=clamp(player.y+move.y*player.speed*dashMult*dt,65,H-28);','player.x+=move.x*player.speed*dashMult*dt;player.y+=move.y*player.speed*dashMult*dt;','unbounded movement');
replace('room=Math.max(0,260-enemies.length)','room=Math.max(0,140-enemies.length)','enemy cap');
replace('enemies.length<245','enemies.length<135','brood cap');

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
function drawCreatureSmart(e){if(!visible(e))return;const near=dist2(e,player)<430*430;if(e.t==='boss'||e.t==='elite'||near&&e.r>=18)drawArcaneCreature(ctx,e,elapsed);else drawEnemyLOD(e)}`,'camera helpers');

replace('function draw(){ctx.save();if(shake)ctx.translate(rand(-shake,shake),rand(-shake,shake));drawArena();for(const c of caches)',
'function draw(){ctx.save();if(shake)ctx.translate(rand(-shake,shake),rand(-shake,shake));drawArena();ctx.save();ctx.translate(W/2-player.x,H/2-player.y);for(const c of caches)','camera transform begin');
replace('for(const e of enemies)drawArcaneCreature(ctx,e,elapsed);','for(const e of enemies)drawCreatureSmart(e);','creature LOD');
replace("for(const g of gems){ctx.fillStyle=palette.cyan;","for(const g of gems){if(!visible(g,80))continue;ctx.fillStyle=palette.cyan;",'gem render cull');
replace("for(const s of enemyShots){ctx.fillStyle=","for(const s of enemyShots){if(!visible(s,100))continue;ctx.fillStyle=",'enemy shot render cull');
replace("for(const s of shots){ctx.strokeStyle=","for(const s of shots){if(!visible(s,120))continue;ctx.strokeStyle=",'shot render cull');
replace("for(const p of particles){ctx.globalAlpha=","for(const p of particles){if(!visible(p,100))continue;ctx.globalAlpha=",'particle render cull');
replace("ctx.globalAlpha=1;if(flash){ctx.fillStyle=\`rgba(70,180,255,\${flash*.08})\`;ctx.fillRect(0,0,W,H)}ctx.restore()}",
"ctx.globalAlpha=1;ctx.restore();if(flash){ctx.fillStyle=\`rgba(70,180,255,\${flash*.08})\`;ctx.fillRect(0,0,W,H)}ctx.restore()}",'camera transform end');

s=s.replace(/shots=shots\.filter\(s=>!s\.dead&&s\.life>0&&s\.x>-100&&s\.x<W\+100&&s\.y>-100&&s\.y<H\+100\);enemyShots=enemyShots\.filter\(s=>!s\.dead&&s\.life>0&&s\.x>-120&&s\.x<W\+120&&s\.y>-120&&s\.y<H\+120\);/,
"shots=shots.filter(s=>!s.dead&&s.life>0&&Math.abs(s.x-player.x)<W*.85+250&&Math.abs(s.y-player.y)<H*.85+250);enemyShots=enemyShots.filter(s=>!s.dead&&s.life>0&&Math.abs(s.x-player.x)<W*.85+250&&Math.abs(s.y-player.y)<H*.85+250);");
if(!s.includes("Math.abs(s.x-player.x)<W*.85+250"))throw new Error('prepare-build: projectile world cull failed');

replace('function burst(x,y,color,n=8){for(let i=0;i<n;i++){','function burst(x,y,color,n=8){if(particles.length>520)n=Math.min(n,3);for(let i=0;i<n;i++){','particle cap');

fs.writeFileSync(path,s);
console.log('prepare-build: scrolling world + render LOD applied');
