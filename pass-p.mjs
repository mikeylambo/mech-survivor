import fs from 'node:fs';
const path='public/game.js';let s=fs.readFileSync(path,'utf8');const must=(ok,l)=>{if(!ok)throw new Error('pass-p: missing '+l)};
if(!s.includes('const circuitMods=window.MechCircuit')){
 const from="function reset(world=activeWorld){activeWorld=world;const b=window.MechMeta?.bonuses?.()||{};";
 const to="function reset(world=activeWorld){activeWorld=world;const b=window.MechMeta?.bonuses?.()||{},circuitMods=window.MechCircuit?.mods?.()||{};";
 must(s.includes(from),'reset seam');s=s.replace(from,to);
 s=s.replace('const maxHp=100+(b.hp||0);','const maxHp=(100+(b.hp||0))*(circuitMods.hp||1);');
 s=s.replace('damage:10*(1+(b.damage||0)),','damage:10*(1+(b.damage||0))*(1+(circuitMods.damage||0)),');
 s=s.replace('xpBoost:b.xp||0,','xpBoost:(b.xp||0)+((circuitMods.xp||1)-1),');
}
if(!s.includes('const cm=window.MechCircuit?.mods?.()||{};spec.hp*=cm.enemyHp')){
 const from='spec.armor=Math.max(spec.armor||0,genome.stats.armor);';
 const to="const cm=window.MechCircuit?.mods?.()||{};spec.hp*=cm.enemyHp||1;spec.speed*=cm.enemySpeed||1;spec.damage*=cm.enemyDamage||1;spec.armor=Math.max(spec.armor||0,genome.stats.armor);";
 must(s.includes(from),'enemy modifier seam');s=s.replace(from,to);
}
if(!s.includes('(window.MechCircuit?.mods?.().enemyRate||1)')){
 const re=/const interval=Math\.max\(\.12,\.62-elapsed\*\.0011-activeWorld\*\.035\);/;
 must(re.test(s),'spawn interval seam');s=s.replace(re,"const interval=Math.max(.12,(.62-elapsed*.0011-activeWorld*.035)*(window.MechCircuit?.mods?.().enemyRate||1));");
}
if(!s.includes('circuitDensity')){
 const from='const count=1+Math.floor(elapsed/100)+Math.floor(activeWorld/2)+(elapsed>=GOD_WINDOW_START?1:0)';
 const to="const circuitDensity=window.MechCircuit?.mods?.().density||1,count=Math.max(1,Math.round((1+Math.floor(elapsed/100)+Math.floor(activeWorld/2)+(elapsed>=GOD_WINDOW_START?1:0))*circuitDensity))";
 must(s.includes(from),'spawn density seam');s=s.replace(from,to);
}
fs.writeFileSync(path,s);console.log('pass-p: Sovereign Circuit live mutators integrated');
