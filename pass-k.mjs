import fs from 'node:fs';
const path='public/game.js';let s=fs.readFileSync(path,'utf8');const must=(ok,l)=>{if(!ok)throw new Error('pass-k: missing '+l)};
if(!s.includes("from './sector-runtime.js'")){const a="import {tickBossRuntime} from './boss-runtime.js';";must(s.includes(a),'boss runtime import');s=s.replace(a,a+"\nimport {tickSectorRuntime,drawSectorField,applySectorDeck} from './sector-runtime.js';")}
if(!s.includes('applySectorDeck(director,player.sectorDeck)')){const a='player.sectorDeck=deckForWorld(activeWorld);';must(s.includes(a),'sector deck assignment');s=s.replace(a,a+'applySectorDeck(director,player.sectorDeck);')}
if(!s.includes('tickSectorRuntime({world:activeWorld')){const a='tickBossRuntime({world:activeWorld,enemies,enemyShots,player,dt,elapsed,spawnEnemy,damageEnemy,burst,toast});';must(s.includes(a),'boss tick');s=s.replace(a,a+'tickSectorRuntime({world:activeWorld,player,enemies,enemyShots,dt,elapsed,spawnEnemy,toast});')}
if(!s.includes('drawSectorField(ctx,{world:activeWorld,W,H,elapsed})')){const a='drawMech();drawArsenalHardpoints(ctx,player,elapsed,palette);';must(s.includes(a),'mech draw seam');s=s.replace(a,'drawSectorField(ctx,{world:activeWorld,W,H,elapsed});'+a)}
fs.writeFileSync(path,s);console.log('pass-k: sector embodiment + deck grammar integrated');
