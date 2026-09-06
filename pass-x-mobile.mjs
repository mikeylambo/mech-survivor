// Mobile hardening hooks.
//
// Orientation is stated as a preference in three places that each work where
// the platform allows, and the game stays playable when none of them do.
// Backgrounding pauses, because a survivor game that keeps simulating in a
// hidden tab kills the player while they are reading a message.
import fs from 'node:fs';

const path = 'public/game.js';
let s = fs.readFileSync(path, 'utf8');

const replaceOnce = (from, to, label) => {
  if (s.includes(to)) return;
  const count = s.split(from).length - 1;
  if (count !== 1) throw new Error(`pass-x: anchor for ${label} matched ${count} sites, expected exactly 1`);
  s = s.replace(from, to);
};

replaceOnce(
  "import {createMusicMixer,setMusicState,setBusVolume,musicStateFor,startScaffoldScore} from './music-mixer.js';",
  "import {createMusicMixer,setMusicState,setBusVolume,musicStateFor,startScaffoldScore} from './music-mixer.js';\n" +
  "import {requestPortraitLock,trackOrientation,installVisibilityPause} from './mobile-runtime.js';",
  'mobile runtime import',
);

replaceOnce(
  "addEventListener('pointerdown',()=>audio.ensure(),{once:true});",
  // Portrait is requested on the first gesture because that is the only moment
  // a browser will consider it. A refusal is expected and ignored.
  "trackOrientation();installVisibilityPause(document,()=>{if(state==='play'){state='paused';document.querySelector('#pause-screen')?.classList.remove('hidden')}});\n" +
  "addEventListener('pointerdown',()=>{audio.ensure();requestPortraitLock()},{once:true});",
  'mobile lifecycle',
);

for (const [token, label] of [['installVisibilityPause(document', 'visibility pause'], ['trackOrientation()', 'orientation tracking'], ['requestPortraitLock()', 'portrait preference']]) {
  if (!s.includes(token)) throw new Error('pass-x: missing ' + label);
}

fs.writeFileSync(path, s);
console.log('pass-x: mobile lifecycle and orientation preference integrated');
