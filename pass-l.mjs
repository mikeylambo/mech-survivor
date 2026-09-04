import fs from 'node:fs';
const path='public/game.js';let s=fs.readFileSync(path,'utf8');const must=(ok,l)=>{if(!ok)throw new Error('pass-l: missing '+l)};
if(!s.includes('GARAGE PROTOTYPE //')){
 const anchor='function update(dt){elapsed+=dt;';must(s.includes(anchor),'update seam');
 const seed=`function applyGaragePrototype(){if(!player||player._garageSeeded)return;player._garageSeeded=true;const garageBonus=window.MechMeta?.bonuses?.()||{};if(garageBonus.startFamily&&player.arsenal?.[garageBonus.startFamily]){player.arsenal[garageBonus.startFamily].tier=Math.max(1,player.arsenal[garageBonus.startFamily].tier||0);toast('GARAGE PROTOTYPE // '+(ARSENAL_BY_ID[garageBonus.startFamily]?.name||garageBonus.startFamily).toUpperCase());syncConfigurations();updateBuild()}}\n`;
 s=s.replace(anchor,seed+anchor+'applyGaragePrototype();');
}
fs.writeFileSync(path,s);console.log('pass-l: garage loadout and boss prototype seed integrated');
