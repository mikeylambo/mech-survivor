// Wires the adaptive music mixer into the generated runtime.
//
// The mixer owns the graph: master -> {music -> layer buses, sfx}. The existing
// zero-asset SFX bus is re-pointed at `mixer.sfx` rather than replaced, so the
// cue system is untouched and the settings split is a property of the graph
// instead of a number multiplied in at every call site.
//
// Runs after pass-v, so its anchors are matched against the finished file.
import fs from 'node:fs';

const path = 'public/game.js';
let s = fs.readFileSync(path, 'utf8');

const replaceOnce = (from, to, label) => {
  if (s.includes(to)) return;
  const count = s.split(from).length - 1;
  if (count !== 1) throw new Error(`pass-w: anchor for ${label} matched ${count} sites, expected exactly 1`);
  s = s.replace(from, to);
};

replaceOnce(
  "import {tickBossRuntime,applyCommanderDamage} from './boss-runtime.js';",
  "import {tickBossRuntime,applyCommanderDamage} from './boss-runtime.js';\n" +
  "import {createMusicMixer,setMusicState,setBusVolume,musicStateFor,startScaffoldScore} from './music-mixer.js';",
  'music mixer import',
);

// Built the first time audio is unlocked, alongside the context it needs.
replaceOnce(
  'this.master.connect(this.ctx.destination)}',
  'this.master.connect(this.ctx.destination);' +
  'try{this.mixer=createMusicMixer(this.ctx);this.master.disconnect();this.master.connect(this.mixer.sfx);' +
  'startScaffoldScore(this.mixer);applyStoredVolumes()}catch{this.mixer=null}}',
  'mixer construction',
);

// One place decides the music state; the loop just reports the run.
replaceOnce(
  'const step=updateImpact(impact,realDt);',
  'const step=updateImpact(impact,realDt);updateMusicState();',
  'music state tick',
);

replaceOnce(
  'let directorObjective=null;',
  'let directorObjective=null;\n' +
  'function applyStoredVolumes(){if(!audio.mixer)return;let v={master:1,music:.6,sfx:.9};' +
  "try{v={...v,...JSON.parse(localStorage.getItem('sunfall-volumes')||'{}')}}catch{}" +
  "for(const bus of['master','music','sfx'])setBusVolume(audio.mixer,bus,v[bus])}\n" +
  'function updateMusicState(){if(!audio.mixer)return;' +
  "const boss=enemies.find(e=>e.t==='boss'&&!e.dead);" +
  "setMusicState(audio.mixer,musicStateFor({screen:(state==='title'||state==='paused')?'menu':'run'," +
  'corruption:player?.corruption||0,commander:boss?bossForWorld(activeWorld).id:null,' +
  'finalCommander:activeWorld>=4,elapsed,enemies:enemies.length,' +
  "elite:enemies.some(e=>e.t==='elite'&&!e.dead),dead:state==='dead'}))}\n" +
  "window.mechAudio={setVolume:(bus,v)=>{if(!audio.mixer)return null;const out=setBusVolume(audio.mixer,bus,v);" +
  "try{const cur=JSON.parse(localStorage.getItem('sunfall-volumes')||'{}');cur[bus]=out;" +
  "localStorage.setItem('sunfall-volumes',JSON.stringify(cur))}catch{}return out},"
  + "state:()=>audio.mixer?.state||null};",
  'music state helpers',
);

for (const [token, label] of [
  ['updateMusicState()', 'music tick'],
  ['window.mechAudio=', 'volume api'],
  ['createMusicMixer(this.ctx)', 'mixer construction'],
]) if (!s.includes(token)) throw new Error('pass-w: missing ' + label);

fs.writeFileSync(path, s);
console.log('pass-w: adaptive music mixer integrated');
