import fs from 'node:fs';
const path='public/game.js';
let s=fs.readFileSync(path,'utf8');
const need=(token,label)=>{if(!s.includes(token))throw new Error('pass-s: missing '+label)};

if(!s.includes("from './arsenal-branch-runtime.js'")){
 const anchor="import {tickArsenal,updateArsenalFx,drawArsenalFx,applyMarkedDamage} from './arsenal-runtime.js';";
 need(anchor,'arsenal runtime import');
 s=s.replace(anchor,anchor+"\nimport {tickBranchIdentity,applyBranchDamageModifiers} from './arsenal-branch-runtime.js';");
}
if(!s.includes('applyBranchDamageModifiers(player,e,d)')){
 const anchor='d=applyMarkedDamage(e,d);';need(anchor,'damage modifier seam');
 s=s.replace(anchor,anchor+'d=applyBranchDamageModifiers(player,e,d);');
}
if(!s.includes('tickBranchIdentity(player,dt')){
 // `const m=input();` alone also matches tryDash(), which has no `dt` in scope.
 // Anchor on the movement seam inside update(dt) so the tick lands in the loop.
 const anchor='const m=input();player.dashCooldown=Math.max(0,player.dashCooldown-dt);';need(anchor,'movement input seam');
 s=s.replace(anchor,anchor+"tickBranchIdentity(player,dt,{enemies,shots,enemyShots,damageEnemy,elapsed,input:m});");
}
need("tickBranchIdentity(player,dt",'branch runtime tick');
need('applyBranchDamageModifiers(player,e,d)','branch damage hook');
fs.writeFileSync(path,s);
console.log('pass-s: arsenal evolution branches now alter player behavior contracts');
