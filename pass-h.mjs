import fs from 'node:fs';
const path='public/game.js';
let s=fs.readFileSync(path,'utf8');
const must=(ok,label)=>{if(!ok)throw new Error('pass-h: missing '+label)};
if(!s.includes("from './arsenal-visuals.js'")){
 const anchor="import {tickArsenal,updateArsenalFx,drawArsenalFx,applyMarkedDamage} from './arsenal-runtime.js';";must(s.includes(anchor),'arsenal runtime import');
 s=s.replace(anchor,anchor+"\nimport {drawArsenalHardpoints} from './arsenal-visuals.js';\nimport {tickConfigurations,configurationDamageModifier} from './configuration-runtime.js';");
}
if(!s.includes('configurationDamageModifier(player,e,d)')){
 const anchor='function damageEnemy(e,d){d=applyMarkedDamage(e,d);';must(s.includes(anchor),'damage modifier seam');
 s=s.replace(anchor,anchor+'d=configurationDamageModifier(player,e,d);');
}
if(!s.includes('tickConfigurations(player,dt')){
 const anchor='tickArsenal(player,dt,{enemies,shots,enemyShots,damageEnemy,elapsed});';must(s.includes(anchor),'arsenal tick seam');
 s=s.replace(anchor,anchor+'tickConfigurations(player,dt,{enemies,shots,enemyShots,damageEnemy,elapsed});');
}
if(!s.includes('drawArsenalHardpoints(ctx,player,elapsed,palette)')){
 const anchor='drawMech();drawArsenalFx(ctx,player,palette);';must(s.includes(anchor),'arsenal draw seam');
 s=s.replace(anchor,'drawMech();drawArsenalHardpoints(ctx,player,elapsed,palette);drawArsenalFx(ctx,player,palette);');
}
fs.writeFileSync(path,s);
console.log('pass-h: visible 30-family hardpoints + full configuration behavior layer integrated');
