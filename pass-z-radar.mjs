// Radar, drawn in screen space in the top corner.
//
// It goes in AFTER the world transform is restored, so it is a HUD element
// rather than something that scrolls with the field.
import fs from 'node:fs';

const path = 'public/game.js';
let s = fs.readFileSync(path, 'utf8');

const replaceOnce = (from, to, label) => {
  if (s.includes(to)) return;
  const count = s.split(from).length - 1;
  if (count !== 1) throw new Error(`pass-z: anchor for ${label} matched ${count} sites, expected exactly 1`);
  s = s.replace(from, to);
};

replaceOnce(
  "import {createOrbitState,tickOrbitMechanic,drawOrbitAtmosphere,orbitIdentity} from './orbit-identity.js';",
  "import {createOrbitState,tickOrbitMechanic,drawOrbitAtmosphere,orbitIdentity} from './orbit-identity.js';\n" +
  "import {drawRadar} from './radar.js';",
  'radar import',
);

// The first restore closes the world transform; everything after it is HUD.
// A later pass inserts drawThreatIndicators() at this seam, so the anchor is
// the text as it stands after the whole chain, not as src/game.js wrote it.
replaceOnce(
  "ctx.globalAlpha=1;ctx.restore();drawThreatIndicators();if(flash)"
  ,"ctx.globalAlpha=1;ctx.restore();" +
  "if(state==='play'||state==='level'){const rr=W<760?42:54,rx=W-rr-16,ry=(W<760?128:104)+rr*0;" +
  "drawRadar(ctx,{cx:rx,cy:ry,radius:rr,player,enemies,caches,objective:directorObjective?.field||directorObjective,alpha:.92})}" +
  "drawThreatIndicators();if(flash)",
  'radar draw',
);

if (!s.includes('drawRadar(ctx,{cx:rx')) throw new Error('pass-z: radar not installed');
fs.writeFileSync(path, s);
console.log('pass-z: radar integrated');
