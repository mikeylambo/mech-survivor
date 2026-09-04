import fs from 'node:fs';
const path='public/game.js';let s=fs.readFileSync(path,'utf8');const must=(ok,l)=>{if(!ok)throw new Error('pass-j: missing '+l)};
if(!s.includes("from './boss-runtime.js'")){const a="import {bossForWorld,deckForWorld} from './sector-content.js';";must(s.includes(a),'sector import');s=s.replace(a,a+"\nimport {tickBossRuntime} from './boss-runtime.js';")}
if(!s.includes('tickBossRuntime({world:activeWorld')){const a='tickConfigurations(player,dt,{enemies,shots,enemyShots,damageEnemy,elapsed});';must(s.includes(a),'configuration tick');s=s.replace(a,a+"tickBossRuntime({world:activeWorld,enemies,enemyShots,player,dt,elapsed,spawnEnemy,damageEnemy,burst,toast});")}
fs.writeFileSync(path,s);console.log('pass-j: bespoke boss combat runtime integrated');
