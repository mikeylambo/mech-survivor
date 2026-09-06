import fs from 'node:fs';
const path='public/game.js';
let s=fs.readFileSync(path,'utf8');
const must=(ok,label)=>{if(!ok)console.warn('pass-q-vfx: optional seam missing '+label);return ok};
const replace=(from,to,label)=>{if(s.includes(to))return true;if(!s.includes(from)){console.warn('pass-q-vfx: optional seam missing '+label);return false}s=s.replace(from,to);return true};

if(!s.includes("from './vfx-engine.js'")){
  s="import {createVFXEngine} from './vfx-engine.js';\nimport {registerMechVFX} from './mech-vfx.js';\nimport {initVFXLab} from './vfx-lab.js';\n"+s;
}else if(!s.includes("from './vfx-lab.js'")){
  s=s.replace("import {registerMechVFX} from './mech-vfx.js';","import {registerMechVFX} from './mech-vfx.js';\nimport {initVFXLab} from './vfx-lab.js';");
}

const paletteLine="const palette={white:'#eaf7ff',navy:'#071323',blue:'#168fff',cyan:'#78e7ff',gold:'#d6ae52',red:'#ff4664'};";
if(!s.includes('registerMechVFX(createVFXEngine')){
  if(must(s.includes(paletteLine),'palette seam'))s=s.replace(paletteLine,paletteLine+"\nconst fx=registerMechVFX(createVFXEngine({maxActive:1400,cameraImpulse:n=>shake=Math.max(shake,n),screenFlash:n=>flash=Math.max(flash,n*4)}),palette);");
}

if(!s.includes("fx.play('burst'")){
  const marker='function burst(x,y,color,n=8){';
  const start=s.indexOf(marker);
  if(start>=0){
    const end=s.indexOf('\n',start);
    const legacy=end>=0?s.slice(start,end):s.slice(start);
    s=s.replace(legacy,"function burst(x,y,color,n=8){fx.play('burst',{x,y,color,count:n,intensity:Math.min(1.35,.55+n/30)})}");
  }
}

replace("burst(player.x,player.y,palette.cyan,12);shake=Math.max(shake,4);toast('VECTOR DASH')","fx.play('mech.dash',{x:player.x,y:player.y,dx:player.dashDir.x,dy:player.dashDir.y,intensity:.9+player.modules.thruster*.06});toast('VECTOR DASH')",'dash effect');

if(!s.includes("fx.play('mech.muzzle'")){
  const from="burst(player.x+Math.cos(a)*26,player.y+Math.sin(a)*26,palette.cyan,3)}";
  const to="fx.play('mech.muzzle',{x:player.x+Math.cos(a)*26,y:player.y+Math.sin(a)*26,dx:Math.cos(a),dy:Math.sin(a),intensity:.75})}";
  if(must(s.includes(from),'muzzle effect'))s=s.replace(from,to);
}
if(!s.includes("'mech.railFireHigh':'mech.railFire'")){
  s=s.replace("fx.play('mech.muzzle',{x:player.x+Math.cos(a)*26,y:player.y+Math.sin(a)*26,dx:Math.cos(a),dy:Math.sin(a),intensity:.75})","fx.play(player.modules.beam>=4?'mech.railFireHigh':'mech.railFire',{x:player.x+Math.cos(a)*26,y:player.y+Math.sin(a)*26,dx:Math.cos(a),dy:Math.sin(a),intensity:.78+player.modules.beam*.055})");
}

if(!s.includes("fx.play('mech.missileLaunch'")){
  const re=/for\(let i=0;i<n;i\+\+\)shots\.push\(\{x:player\.x\+\(i-\(n-1\)\/2\)\*13\+rand\(-5,5\),y:player\.y-18,vx:\(i-\(n-1\)\/2\)\*55\+rand\(-15,15\),vy:-170,r:5,life:3,damage:24\+player\.modules\.missile\*11,kind:'missile',target:e,turn:3\.7\}\)/;
  if(must(re.test(s),'missile launch seam'))s=s.replace(re,"for(let i=0;i<n;i++){const ox=(i-(n-1)/2)*13+rand(-5,5),mx=player.x+ox,my=player.y-18;shots.push({x:mx,y:my,vx:(i-(n-1)/2)*55+rand(-15,15),vy:-170,r:5,life:3,damage:24+player.modules.missile*11,kind:'missile',target:e,turn:3.7});fx.play('mech.missileLaunch',{x:mx,y:my,dx:0,dy:-1,intensity:.75+player.modules.missile*.08})}");
}

if(!s.includes("'mech.bossDeath':'mech.eliteDeath'")){
  const from="burst(e.x,e.y,e.t==='boss'?palette.gold:palette.blue,e.t==='boss'?35:8);";
  const to="fx.play(e.t==='boss'?'mech.bossDeath':e.t==='elite'?'mech.eliteDeath':'mech.enemyDeath',{x:e.x,y:e.y,intensity:e.t==='boss'?1.25:e.t==='elite'?1.05:.72});";
  if(must(s.includes(from),'enemy death effect'))s=s.replace(from,to);
}

if(!s.includes("fx.play('mech.novaPulse'")){
  const re=/burst\(player\.x,player\.y,palette\.cyan,28\);shake=6/g;
  if(must(re.test(s),'nova effect'))s=s.replace(re,"fx.play(player.modules.pulse>=5?'mech.novaHeart':'mech.novaPulse',{x:player.x,y:player.y,radius,intensity:.9+player.modules.pulse*.07})");
}

if(!s.includes("fx.play('mech.arcHit'")){
  s=s.replace(/burst\(e\.x,e\.y,palette\.cyan,4\);if\(damageEnemy/g,"fx.play('mech.arcHit',{x:e.x,y:e.y,intensity:.7});if(damageEnemy");
  s=s.replace(/burst\(e\.x,e\.y,palette\.cyan,5\);if\(damageEnemy/g,"fx.play('mech.arcHit',{x:e.x,y:e.y,intensity:.7});if(damageEnemy");
}
if(!s.includes("'mech.arcStorm':'mech.arcChain'")){
  const from="lightningFx.push({ax:from.x,ay:from.y,bx:e.x,by:e.y,life:.16,max:.16});fx.play('mech.arcHit',{x:e.x,y:e.y,intensity:.7});";
  const to="fx.play(player.modules.arc>=5?'mech.arcStorm':'mech.arcChain',{x:from.x,y:from.y,x2:e.x,y2:e.y,intensity:.72+player.modules.arc*.08});fx.play('mech.arcHit',{x:e.x,y:e.y,intensity:.7+player.modules.arc*.04});";
  if(s.includes(from))s=s.replace(from,to);
}

if(!s.includes("'mech.bladeSlashHigh':'mech.bladeSlash'")){
  const from="if(damageEnemy(e,7+player.modules.orbit*4))e.dead=true";
  const to="fx.play(player.modules.orbit>=5?'mech.bladeSlashHigh':'mech.bladeSlash',{x,y,dx:-Math.sin(a),dy:Math.cos(a),intensity:.62+player.modules.orbit*.08});if(damageEnemy(e,7+player.modules.orbit*4))e.dead=true";
  if(must(s.includes(from),'Aegis blade contact seam'))s=s.replace(from,to);
}

if(!s.includes("fx.play('mech.mineImpact'"))s=s.replace("burst(s.x,s.y,palette.cyan,24);shake=Math.max(shake,5);s.dead=true","fx.play('mech.mineImpact',{x:s.x,y:s.y,intensity:1+player.modules.mine*.05});s.dead=true");
if(!s.includes("fx.play(s.kind==='mine'?'mech.mineImpact':'mech.missileImpact'")){
  const from="burst(s.x,s.y,s.kind==='mine'?palette.cyan:palette.gold,18);shake=5";
  if(s.includes(from))s=s.replace(from,"fx.play(s.kind==='mine'?'mech.mineImpact':'mech.missileImpact',{x:s.x,y:s.y,intensity:.9+(s.kind==='missile'?player.modules.missile*.05:player.modules.mine*.05)})");
}

if(!s.includes("if(s.kind==='beam'||s.kind==='drone')fx.play('mech.impact'")){
  const from="if(dist2(s,e)<(s.r+e.r)**2){if(damageEnemy(e,s.damage))e.dead=true;";
  const to="if(dist2(s,e)<(s.r+e.r)**2){if(s.kind==='beam'||s.kind==='drone')fx.play('mech.impact',{x:s.x,y:s.y,color:s.kind==='drone'?palette.white:palette.cyan,intensity:s.kind==='beam'?.7+player.modules.beam*.04:.48});if(damageEnemy(e,s.damage))e.dead=true;";
  if(s.includes(from))s=s.replace(from,to);
}

if(!s.includes("fx.play('mech.levelUp'")){
  const from="if(milestone){burst(player.x,player.y,palette.gold,32);shake=Math.max(shake,7);toast(`EVOLUTION // ${milestone}`)}";
  const to="if(milestone){fx.play('mech.levelUp',{x:player.x,y:player.y,intensity:1.1});toast(`EVOLUTION // ${milestone}`)}";
  if(s.includes(from))s=s.replace(from,to);
}
if(!s.includes("fx.play('mech.synergy'")){
  const from="burst(player.x,player.y,palette.gold,45);shake=10;toast(`SYNC EVOLUTION // ${s.name}`)";
  const to="fx.play('mech.synergy',{x:player.x,y:player.y,intensity:1.2});toast(`XP EVOLUTION // ${s.name}`)";
  if(s.includes(from))s=s.replace(from,to);
}

if(!s.includes("fx.play('mech.playerHit'")){
  s=s.replace(/shake=10;burst\(player\.x,player\.y,palette\.red,14\)/g,"fx.play('mech.playerHit',{x:player.x,y:player.y,intensity:1})");
  s=s.replace(/shake=7;burst\(player\.x,player\.y,palette\.red,9\)/g,"fx.play('mech.playerHit',{x:player.x,y:player.y,intensity:.8})");
}

if(!s.includes('fx.update(dt);updateHUD()'))replace('shake*=Math.pow(.02,dt);flash*=Math.pow(.005,dt);updateHUD()','shake*=Math.pow(.02,dt);flash*=Math.pow(.005,dt);fx.update(dt);updateHUD()','VFX update');
if(!s.includes('drawMech();fx.draw(ctx);'))replace('drawMech();for(const p of particles)','drawMech();fx.draw(ctx);for(const p of particles)','VFX draw');
if(!s.includes('fx.clear();const maxHp='))replace('shake=flash=0;const maxHp=','shake=flash=0;fx.clear();const maxHp=','VFX reset');
if(!s.includes('initVFXLab(fx'))s=s.replace('initCreatureLab();',"initCreatureLab();\ninitVFXLab(fx,()=>player||{x:0,y:0});");

s=s.replaceAll('SYNC EVOLUTION','XP EVOLUTION').replaceAll('SYNC //','XP //');

for(const [needle,label] of [["registerMechVFX(createVFXEngine",'engine init'],['fx.update(dt)','runtime update'],['fx.draw(ctx)','runtime draw'],['initVFXLab(fx','lab init']]){
  if(!s.includes(needle))throw new Error('pass-q-vfx: required integration missing '+label);
}

fs.writeFileSync(path,s);
console.log('pass-q-vfx: SLU VFX v0.2 cinematic combat presentation integrated');
