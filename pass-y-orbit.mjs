// Orbit identity hooks: the run's seed, its atmosphere and its world verb.
//
// The seed lands here rather than in the determinism workstream because every
// orbit draw below it would otherwise reach for Math.random and have to be
// rewritten. A run's character is a property of its seed, not of the clock.
import fs from 'node:fs';

const path = 'public/game.js';
let s = fs.readFileSync(path, 'utf8');

const replaceOnce = (from, to, label) => {
  if (s.includes(to)) return;
  const count = s.split(from).length - 1;
  if (count !== 1) throw new Error(`pass-y: anchor for ${label} matched ${count} sites, expected exactly 1`);
  s = s.replace(from, to);
};

replaceOnce(
  "import {requestPortraitLock,trackOrientation,installVisibilityPause} from './mobile-runtime.js';",
  "import {requestPortraitLock,trackOrientation,installVisibilityPause} from './mobile-runtime.js';\n" +
  "import {setRunSeed,runRng} from './run-rng.js';\n" +
  "import {createOrbitState,tickOrbitMechanic,drawOrbitAtmosphere,orbitIdentity} from './orbit-identity.js';",
  'orbit identity import',
);

replaceOnce(
  'let commanderCam=1;',
  'let commanderCam=1;let orbitState=null,runSeed=null;',
  'orbit state',
);

// One seed per run. The director, the orbit verbs and every weighted draw
// downstream all hang off it, so the same seed replays the same orbit.
replaceOnce(
  "seed:String(activeWorld)+'-'+Date.now()",
  "seed:runSeed",
  'seeded director',
);
replaceOnce(
  'director=createRunDirector({world:activeWorld,',
  "runSeed=String(activeWorld)+'-'+(window.__sunfallSeed??Math.floor(Math.random()*1e9));setRunSeed(runSeed);orbitState=createOrbitState(activeWorld);director=createRunDirector({world:activeWorld,",
  'run seed',
);

// The orbit's own verb, ticked with the simulation.
replaceOnce(
  'tickBranchIdentity(player,dt,{enemies,shots,enemyShots,damageEnemy,elapsed,input:m});',
  'tickBranchIdentity(player,dt,{enemies,shots,enemyShots,damageEnemy,elapsed,input:m});' +
  'if(orbitState)tickOrbitMechanic(orbitState,{player,enemies,enemyShots,dt,elapsed,toast});',
  'orbit world verb',
);

// Ambient treatment sits behind the world, above the arena grid.
replaceOnce(
  'drawArena();ctx.save();const mobileCamera=',
  'drawArena();drawOrbitAtmosphere(ctx,activeWorld,{w:W,h:H,camX:player.x,camY:player.y,elapsed,time:elapsed,quality:perf?.quality??1});ctx.save();const mobileCamera=',
  'orbit atmosphere',
);

for (const [token, label] of [
  ['tickOrbitMechanic(orbitState', 'world verb tick'],
  ['drawOrbitAtmosphere(ctx,activeWorld', 'atmosphere draw'],
  ['setRunSeed(runSeed)', 'run seed'],
  ['seed:runSeed', 'seeded director'],
]) if (!s.includes(token)) throw new Error('pass-y: missing ' + label);

if (s.includes("seed:String(activeWorld)+'-'+Date.now()")) throw new Error('pass-y: the director is still clock-seeded');

fs.writeFileSync(path, s);
console.log('pass-y: orbit identity, atmosphere and the run seed integrated');
