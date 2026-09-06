// Accessibility, wired into the shipping runtime.
//
// Two categories, kept apart on purpose:
//
//   PRESENTATION — shake, flash, text size, danger hues. Applied at the single
//   point each one is consumed (the draw transform, the flash fill, the combat
//   text font, the palette object), so there is one place to audit per effect
//   rather than a scale factor sprinkled through the update loop.
//
//   ASSISTS — damage taken and game speed. These change the run, so they are
//   applied where the run is computed AND recorded in the summary. They are
//   never blocked; a Daily Star row just has to be able to say how it was
//   played.
import fs from 'node:fs';

const path = 'public/game.js';
let s = fs.readFileSync(path, 'utf8');

const replaceOnce = (from, to, label) => {
  const hits = s.split(from).length - 1;
  if (hits !== 1) throw new Error(`pass-ad: ${label} matched ${hits} sites, expected 1`);
  s = s.replace(from, to);
};

replaceOnce(
  "import {setRunSeed,runRng,srand,frand} from './run-rng.js';",
  "import {setRunSeed,runRng,srand,frand} from './run-rng.js';\n" +
  "import {loadAccessibility,dangerColors,applyPresentation,assistMetadata} from './accessibility.js';",
  'accessibility import',
);

// One live settings object. `window.mechA11y.apply` is how the settings screen
// pushes a change mid-run without a reload, and re-reading is how a run that
// starts later picks up a change made on the title screen.
replaceOnce(
  "const palette={white:'#eaf7ff',navy:'#071323',blue:'#168fff',cyan:'#78e7ff',gold:'#d6ae52',red:'#ff4664'};",
  "const palette={white:'#eaf7ff',navy:'#071323',blue:'#168fff',cyan:'#78e7ff',gold:'#d6ae52',red:'#ff4664'};\n" +
  "let a11y=loadAccessibility();\n" +
  "// The palette object is shared by reference with the VFX engine and every\n" +
  "// draw call, so the danger hues are written into it rather than swapped for a\n" +
  "// new object — otherwise a mid-run change would only reach half the renderer.\n" +
  "function applyDangerPalette(){const c=dangerColors(a11y);palette.red=c.danger;palette.gold=c.warn;palette.cyan=c.safe;palette.white=c.friendly}\n" +
  "applyDangerPalette();applyPresentation(a11y);\n" +
  "window.mechA11y={apply(next){a11y=next?{...a11y,...next}:loadAccessibility();applyDangerPalette();applyPresentation(a11y);return a11y}," +
  "settings:()=>({...a11y}),palette:()=>({...palette})};",
  'accessibility state',
);

// Presentation: the camera shake and the hit flash, each at their one site.
replaceOnce(
  'impactTransform(ctx,W,H,impact);if(shake)ctx.translate(frnd(-shake,shake),frnd(-shake,shake));',
  'impactTransform(ctx,W,H,impact);const sh=shake*a11y.shakeScale;if(sh)ctx.translate(frnd(-sh,sh),frnd(-sh,sh));',
  'shake scale',
);
replaceOnce(
  'if(flash){ctx.fillStyle=`rgba(70,180,255,${flash*.08})`;ctx.fillRect(0,0,W,H)}',
  'if(flash&&a11y.flashScale>0){ctx.fillStyle=`rgba(70,180,255,${flash*.08*a11y.flashScale})`;ctx.fillRect(0,0,W,H)}',
  'flash scale',
);

// Damage numbers are drawn, not styled, so the CSS text scale cannot reach
// them. They are the readability complaint that prompted the setting.
replaceOnce(
  "ctx.font='800 15px Rajdhani';ctx.textAlign='center';ctx.shadowColor='#000';ctx.shadowBlur=5;ctx.fillText(t.text,t.x,t.y)",
  "ctx.font=`800 ${Math.round(15*a11y.textScale)}px Rajdhani`;ctx.textAlign='center';ctx.shadowColor='#000';ctx.shadowBlur=5;ctx.fillText(t.text,t.x,t.y)",
  'damage number scale',
);

// Assist: damage taken, applied after armour and Alignment mitigation so the
// number the player sees is the number they took.
replaceOnce(
  "const d=Math.max(0,amount)*(1-(player._alignArmor||0));player.hp-=d;",
  "const d=Math.max(0,amount)*(1-(player._alignArmor||0))*a11y.damageTaken;player.hp-=d;",
  'damage taken assist',
);

// Assist: game speed, applied to the one step the whole simulation runs on.
// Scaling the step rather than the frame keeps every rate — fire, spawn, the
// director clock — in proportion, and keeps the run deterministic.
replaceOnce(
  "if(state==='play'&&step.dt>0)update(Math.min(.033,step.dt));",
  "if(state==='play'&&step.dt>0)update(Math.min(.033,step.dt)*a11y.gameSpeed);",
  'game speed assist',
);

// The record that travels with the run.
replaceOnce(
  "phase:directorPhase(elapsed).id}}}",
  "phase:directorPhase(elapsed).id},assists:assistMetadata(a11y)}}",
  'assist metadata in summary',
);

for (const token of ['window.mechA11y=', 'a11y.damageTaken', 'a11y.gameSpeed', 'assistMetadata(a11y)']) {
  if (!s.includes(token)) throw new Error('pass-ad: missing ' + token);
}

fs.writeFileSync(path, s);
console.log('pass-ad: accessibility presentation + recorded assists wired into the runtime');
