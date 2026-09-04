import fs from 'node:fs';
const path='public/game.js';
let s=fs.readFileSync(path,'utf8');
const must=(ok,label)=>{if(!ok)throw new Error('pass-i: missing '+label)};
if(!s.includes("from './content-v1.js'")){
 const anchor="import {tickConfigurations,configurationDamageModifier} from './configuration-runtime.js';";
 must(s.includes(anchor),'configuration import');
 s=s.replace(anchor,anchor+"\nimport {ALL_BLESSINGS} from './content-v1.js';\nimport {bossForWorld,deckForWorld} from './sector-content.js';");
}
const br=/const blessings=\[[\s\S]*?\n\];\nfunction activeSynergies/;
if(br.test(s))s=s.replace(br,"const blessings=ALL_BLESSINGS;\nfunction activeSynergies");
if(!s.includes('player.sectorDeck=deckForWorld(activeWorld)')){
 const anchor="director=createRunDirector({world:activeWorld,seed:String(activeWorld)+'-'+Date.now()});";
 must(s.includes(anchor),'director reset');
 s=s.replace(anchor,anchor+"player.sectorDeck=deckForWorld(activeWorld);");
}
if(!s.includes('const bossProfile=bossForWorld(activeWorld)')){
 const anchor="const seed=`${activeWorld}-${Math.floor(elapsed*10)}-${enemies.length}-${Math.floor(Math.random()*1e6)}`,genome=generateCreatureGenome";
 must(s.includes(anchor),'spawn genome seam');
 s=s.replace(anchor,"if(t==='boss'){const bossProfile=bossForWorld(activeWorld);spec.hp*=bossProfile.hp;spec.speed*=bossProfile.speed;spec.damage*=bossProfile.damage;spec.bossId=bossProfile.id;spec.bossName=bossProfile.name;spec.bossPattern=bossProfile.pattern;spec.bossPhases=bossProfile.phases}\n"+anchor);
}
if(!s.includes("WARNING // '+bossProfile.name")){
 const anchor="if(!finalBossSpawned&&elapsed>=RUN_DURATION){finalBossSpawned=true;bossIndex=activeWorld+1;spawnEnemy(true);";
 if(s.includes(anchor))s=s.replace(anchor,"if(!finalBossSpawned&&elapsed>=RUN_DURATION){finalBossSpawned=true;bossIndex=activeWorld+1;const bossProfile=bossForWorld(activeWorld);spawnEnemy(true);$('#boss-alert').textContent='WARNING // '+bossProfile.name;");
}
fs.writeFileSync(path,s);
console.log('pass-i: full blessing library + sector decks + boss identities integrated');
