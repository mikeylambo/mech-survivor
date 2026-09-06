// Commander certification: wires the doctrine classifier, the boss-runtime
// doctrine layer and the arrival ceremony into the generated runtime.
//
// Runs last in the chain on purpose. Every anchor here is matched against the
// finished file, so nothing downstream can move the text out from under it —
// which is exactly the failure that once put the dash hook in the wrong
// function. `replaceOnce` refuses to guess: an anchor that matches zero or more
// than one site fails the build rather than patching the first thing it finds.
import fs from 'node:fs';

const path = 'public/game.js';
let s = fs.readFileSync(path, 'utf8');

const replaceOnce = (from, to, label) => {
  if (s.includes(to)) return; // already applied
  const count = s.split(from).length - 1;
  if (count !== 1) throw new Error(`pass-u: anchor for ${label} matched ${count} sites, expected exactly 1`);
  s = s.replace(from, to);
};

// --- imports -----------------------------------------------------------------
replaceOnce(
  "import {tickBossRuntime} from './boss-runtime.js';",
  "import {tickBossRuntime,applyCommanderDamage} from './boss-runtime.js';\n" +
  "import {resolveCommanderDoctrine} from './commander-doctrine.js';\n" +
  "import {createCommanderCeremony,beginCommanderCeremony,updateCommanderCeremony,commanderPhaseBreak,resolveCommanderCeremony,clearCommanderCeremony,drawCommanderTells} from './commander-ceremony.js';",
  'commander imports',
);

// --- state -------------------------------------------------------------------
// Shipping resolution is the three collapsed super-buckets. Switching `mode` to
// 'archetypes' splits it into the full eight once the three are validated in
// playtest; nothing else has to change.
replaceOnce(
  'let directorObjective=null;',
  "let directorObjective=null;\nconst commanderCeremony=createCommanderCeremony(),COMMANDER_DOCTRINE={mode:'buckets',margin:.4};let commanderCam=1;",
  'commander state',
);

// --- arrival -----------------------------------------------------------------
// The doctrine is resolved here, once, at the moment the commander spawns, and
// handed to the boss on its own object. boss-runtime never re-reads the build.
replaceOnce(
  "spawnEnemy(true);$('#boss-alert').textContent='WARNING // SECTOR COMMANDER';$('#boss-alert').classList.remove('hidden');setTimeout(()=>$('#boss-alert').classList.add('hidden'),2500)",
  "spawnEnemy(true);const commander=enemies[enemies.length-1];if(commander&&commander.t==='boss'){commander._doctrine=resolveCommanderDoctrine(player,COMMANDER_DOCTRINE);beginCommanderCeremony(commanderCeremony,{spec:bossForWorld(activeWorld),doctrine:commander._doctrine})}",
  'commander arrival ceremony',
);

// --- runtime -----------------------------------------------------------------
replaceOnce(
  'tickBossRuntime({world:activeWorld,enemies,enemyShots,player,dt,elapsed,spawnEnemy,damageEnemy,burst,toast})',
  'tickBossRuntime({world:activeWorld,enemies,enemyShots,shots,player,dt,elapsed,spawnEnemy,damageEnemy,burst,toast,doctrineOptions:COMMANDER_DOCTRINE,onPhaseBreak:()=>commanderPhaseBreak(commanderCeremony,impact,audio)})',
  'boss runtime context',
);

// Applied after the player's own modifiers so a vulnerability window multiplies
// the damage the build actually deals. This is also where break pressure and
// weakpoint plates accumulate.
replaceOnce(
  'd=configurationDamageModifier(player,e,d);',
  'd=configurationDamageModifier(player,e,d);d=applyCommanderDamage(e,d);',
  'commander vulnerability',
);

replaceOnce(
  "if(e.t==='boss'||e.t==='elite')impactPreset(impact,e.t==='boss'?'boss-break':'elite-kill');",
  "if(e.t==='boss')resolveCommanderCeremony(commanderCeremony);if(e.t==='boss'||e.t==='elite')impactPreset(impact,e.t==='boss'?'boss-break':'elite-kill');",
  'commander death resolves the sky',
);

replaceOnce(
  'caches=[];lightningFx=[];ringFx=[];combatText=[];enemyGrid.clear();',
  'caches=[];lightningFx=[];ringFx=[];combatText=[];enemyGrid.clear();clearCommanderCeremony(commanderCeremony);commanderCam=1;',
  'commander ceremony reset',
);

// --- presentation ------------------------------------------------------------
// Driven from real time, not simulation time, so the ceremony keeps easing
// through a phase-break hitstop instead of freezing mid-pull-back.
replaceOnce(
  'const step=updateImpact(impact,realDt);',
  'const step=updateImpact(impact,realDt);commanderCam=updateCommanderCeremony(commanderCeremony,realDt).scale;',
  'commander ceremony tick',
);

replaceOnce(
  'camZoom=mobileCamera?1.18:1,',
  'camZoom=(mobileCamera?1.18:1)*commanderCam,',
  'commander camera pull-back',
);

replaceOnce(
  'for(const e of enemies)drawCreatureSmart(e);',
  "for(const e of enemies)drawCreatureSmart(e);for(const e of enemies)if(e.t==='boss'&&!e.dead)drawCommanderTells(ctx,e,elapsed,palette);",
  'commander doctrine tells',
);

const need = (token, label) => { if (!s.includes(token)) throw new Error('pass-u: missing ' + label); };
need('resolveCommanderDoctrine(player,COMMANDER_DOCTRINE)', 'doctrine resolved at spawn');
need('applyCommanderDamage(e,d)', 'vulnerability hook');
need('drawCommanderTells(ctx,e,elapsed,palette)', 'doctrine tells');
need('onPhaseBreak:', 'phase break hook');

fs.writeFileSync(path, s);
console.log('pass-u: commander doctrine, response layer and arrival ceremony integrated');
