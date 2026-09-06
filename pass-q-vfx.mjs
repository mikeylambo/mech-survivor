import fs from 'node:fs';
const path='public/game.js';
let s=fs.readFileSync(path,'utf8');
const must=(ok,label)=>{if(!ok)throw new Error('pass-q-vfx: missing '+label)};
const replace=(from,to,label)=>{if(s.includes(to))return;if(!s.includes(from))throw new Error('pass-q-vfx: missing '+label);s=s.replace(from,to)};

if(!s.includes("from './vfx-engine.js'")){
  s="import {createVFXEngine} from './vfx-engine.js';\nimport {registerMechVFX} from './mech-vfx.js';\nimport {initVFXLab} from './vfx-lab.js';\n"+s;
}else if(!s.includes("from './vfx-lab.js'")){
  s=s.replace("import {registerMechVFX} from './mech-vfx.js';","import {registerMechVFX} from './mech-vfx.js';\nimport {initVFXLab} from './vfx-lab.js';");
}

const paletteLine="const palette={white:'#eaf7ff',navy:'#071323',blue:'#168fff',cyan:'#78e7ff',gold:'#d6ae52',red:'#ff4664'};";
if(!s.includes('registerMechVFX(createVFXEngine')){
  must(s.includes(paletteLine),'palette seam');
  s=s.replace(paletteLine,paletteLine+"\nconst fx=registerMechVFX(createVFXEngine({maxActive:1100,cameraImpulse:n=>shake=Math.max(shake,n),screenFlash:n=>flash=Math.max(flash,n*4)}),palette);");
}

if(!s.includes("fx.play('burst'")){
  const re=/function burst\(x,y,color,n=8\)\{for\(let i=0;i<n;i\+\+\)\{const a=rand\(0,TAU\),s=rand\(30,180\);particles\.push\(\{x,y,vx:Math\.cos\(a\)\*s,vy:Math\.sin\(a\)\*s,life:rand\(\.18,\.55\),max:\.55,color,r:rand\(1,4\)\}\)\}\}/;
  must(re.test(s),'legacy burst');
  s=s.replace(re,"function burst(x,y,color,n=8){fx.play('burst',{x,y,color,count:n,intensity:Math.min(1.35,.55+n/30)})}");
}

replace("burst(player.x,player.y,palette.cyan,12);shake=Math.max(shake,4);toast('VECTOR DASH')","fx.play('mech.dash',{x:player.x,y:player.y,dx:player.dashDir.x,dy:player.dashDir.y,intensity:.9});toast('VECTOR DASH')",'dash effect');

if(!s.includes("fx.play('mech.muzzle'")){
  const from="burst(player.x+Math.cos(a)*26,player.y+Math.sin(a)*26,palette.cyan,3)}";
  const to="fx.play('mech.muzzle',{x:player.x+Math.cos(a)*26,y:player.y+Math.sin(a)*26,dx:Math.cos(a),dy:Math.sin(a),intensity:.75})}";
  must(s.includes(from),'muzzle effect');s=s.replace(from,to);
}

if(!s.includes("'mech.bossDeath':'mech.eliteDeath'")){
  const from="burst(e.x,e.y,e.t==='boss'?palette.gold:palette.blue,e.t==='boss'?35:8);";
  const to="fx.play(e.t==='boss'?'mech.bossDeath':e.t==='elite'?'mech.eliteDeath':'mech.enemyDeath',{x:e.x,y:e.y,intensity:e.t==='boss'?1.25:e.t==='elite'?1.05:.72});";
  must(s.includes(from),'enemy death effect');s=s.replace(from,to);
}

if(!s.includes("fx.play('mech.novaPulse'")){
  const re=/burst\(player\.x,player\.y,palette\.cyan,28\);shake=6/g;
  must(re.test(s),'nova effect');
  s=s.replace(re,"fx.play('mech.novaPulse',{x:player.x,y:player.y,radius,intensity:.9+player.modules.pulse*.06})");
}

if(!s.includes("fx.play('mech.arcHit'")){
  s=s.replace(/burst\(e\.x,e\.y,palette\.cyan,4\);if\(damageEnemy/g,"fx.play('mech.arcHit',{x:e.x,y:e.y,intensity:.7});if(damageEnemy");
  s=s.replace(/burst\(e\.x,e\.y,palette\.cyan,5\);if\(damageEnemy/g,"fx.play('mech.arcHit',{x:e.x,y:e.y,intensity:.7});if(damageEnemy");
}

if(!s.includes("fx.play('mech.mineImpact'")){
  s=s.replace("burst(s.x,s.y,palette.cyan,24);shake=Math.max(shake,5);s.dead=true","fx.play('mech.mineImpact',{x:s.x,y:s.y,intensity:1});s.dead=true");
}

if(!s.includes("fx.play(s.kind==='mine'?'mech.mineImpact':'mech.missileImpact'")){
  const from="burst(s.x,s.y,s.kind==='mine'?palette.cyan:palette.gold,18);shake=5";
  if(s.includes(from))s=s.replace(from,"fx.play(s.kind==='mine'?'mech.mineImpact':'mech.missileImpact',{x:s.x,y:s.y,intensity:.9})");
}

if(!s.includes("fx.play('mech.levelUp'")){
  const from="if(milestone){burst(player.x,player.y,palette.gold,32);shake=Math.max(shake,7);toast(`EVOLUTION // ${milestone}`)}";
  const to="if(milestone){fx.play('mech.levelUp',{x:player.x,y:player.y,intensity:1.1});toast(`EVOLUTION // ${milestone}`)}";
  if(s.includes(from))s=s.replace(from,to);
}

if(!s.includes("fx.play('mech.playerHit'")){
  s=s.replace(/shake=10;burst\(player\.x,player\.y,palette\.red,14\)/g,"fx.play('mech.playerHit',{x:player.x,y:player.y,intensity:1})");
  s=s.replace(/shake=7;burst\(player\.x,player\.y,palette\.red,9\)/g,"fx.play('mech.playerHit',{x:player.x,y:player.y,intensity:.8})");
}

if(!s.includes('fx.update(dt);updateHUD()')){
  replace('shake*=Math.pow(.02,dt);flash*=Math.pow(.005,dt);updateHUD()','shake*=Math.pow(.02,dt);flash*=Math.pow(.005,dt);fx.update(dt);updateHUD()','VFX update');
}

if(!s.includes('drawMech();fx.draw(ctx);')){
  replace('drawMech();for(const p of particles)','drawMech();fx.draw(ctx);for(const p of particles)','VFX draw');
}

if(!s.includes('fx.clear();const maxHp=')){
  replace('shake=flash=0;const maxHp=','shake=flash=0;fx.clear();const maxHp=','VFX reset');
}

if(!s.includes('initVFXLab(fx')){
  s=s.replace('initCreatureLab();',"initCreatureLab();\ninitVFXLab(fx,()=>player||{x:0,y:0});");
}

fs.writeFileSync(path,s);
console.log('pass-q-vfx: SLU VFX v0.2 + in-game lab integrated');
