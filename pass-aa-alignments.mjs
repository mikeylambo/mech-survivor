// Alignments and Eclipses: replaces nine hand-written branches with the full
// sixty-entry effect table, and wires the consumption points that make the
// other fifty-one real.
//
// Before this pass, applyBlessing() had mechanical branches for 9 of 60 ids.
// The other 51 showed a card, registered the pick, fired the toast and did
// nothing whatsoever.
import fs from 'node:fs';

const path = 'public/game.js';
let s = fs.readFileSync(path, 'utf8');

const replaceOnce = (from, to, label) => {
  if (s.includes(to)) return;
  const count = s.split(from).length - 1;
  if (count !== 1) throw new Error(`pass-aa: anchor for ${label} matched ${count} sites, expected exactly 1`);
  s = s.replace(from, to);
};

/** Replace everything between two unique markers, exclusive. */
const replaceRegion = (openMarker, closeMarker, to, label) => {
  const open = s.indexOf(openMarker);
  const close = s.indexOf(closeMarker, open);
  if (open < 0 || close < 0) throw new Error(`pass-aa: region ${label} not found`);
  if (s.indexOf(openMarker, open + 1) !== -1) throw new Error(`pass-aa: region ${label} opener is ambiguous`);
  s = s.slice(0, open + openMarker.length) + to + s.slice(close);
};

replaceOnce(
  "import {drawRadar} from './radar.js';",
  "import {drawRadar} from './radar.js';\n" +
  "import {applyAlignment,tickAlignments,onAlignmentKill,alignmentDamageScale,createAlignmentMods,effectTextFor,ALIGNMENT_EFFECTS} from './alignment-effects.js';",
  'alignment effects import',
);

// The nine branches become one table lookup covering all sixty.
replaceRegion(
  'function applyBlessing(b){player.blessings.add(b.id);',
  'player.corruption=clamp(player.corruption,0,1);',
  'applyAlignment(player,b.id);',
  'apply alignment',
);

// Fresh modifier container per run, alongside the rest of the player reset.
replaceOnce(
  "banishes:1,banished:new Set(),",
  "banishes:1,banished:new Set(),mods:createAlignmentMods(),",
  'alignment mods on reset',
);

// Per-frame rules, ticked with the simulation and given what they watch.
replaceOnce(
  'if(orbitState)tickOrbitMechanic(orbitState,{player,enemies,enemyShots,dt,elapsed,toast});',
  'if(orbitState)tickOrbitMechanic(orbitState,{player,enemies,enemyShots,dt,elapsed,toast});' +
  'tickAlignments(player,{elapsed,moving:Math.hypot(m.x,m.y)>.1,directorActive:!!director?.active,godWindowStart:GOD_WINDOW_START},dt);',
  'alignment rules tick',
);

// Conditional damage and target-type damage, applied with the other modifiers.
replaceOnce(
  'd=configurationDamageModifier(player,e,d);d=applyCommanderDamage(e,d);',
  'd=configurationDamageModifier(player,e,d);d*=alignmentDamageScale(player,e);d=applyCommanderDamage(e,d);',
  'alignment damage scale',
);

// On-kill rules: repair cycles, cooldown dividends.
replaceOnce(
  "if(e.t==='boss')resolveCommanderCeremony(commanderCeremony);",
  "for(const fx of onAlignmentKill(player,e)){if(fx.heal)healPlayer(fx.heal,'CLEAN CYCLE');if(fx.toast)toast(fx.toast)}" +
  "if(e.t==='boss')resolveCommanderCeremony(commanderCeremony);",
  'alignment kill rules',
);

// Rules that scale movement and fire rate while a condition holds, consumed at
// the two places those numbers are actually used.
replaceOnce(
  'player.x+=move.x*player.speed*dashMult*dt',
  'player.x+=move.x*player.speed*(player._alignScale?.speed||1)*dashMult*dt',
  'alignment move speed',
);
replaceOnce(
  'player.y+=move.y*player.speed*dashMult*dt',
  'player.y+=move.y*player.speed*(player._alignScale?.speed||1)*dashMult*dt',
  'alignment move speed y',
);
replaceOnce(
  'player.fire=player.rate',
  'player.fire=player.rate*(player._alignScale?.rate||1)',
  'alignment fire rate',
);

// Conditional resist, applied once inside hurtPlayer rather than at every one
// of its call sites.
replaceOnce(
  'function hurtPlayer(amount,inv=.45,impact=7){if(player.invuln>0)return false;const d=Math.max(0,amount);',
  'function hurtPlayer(amount,inv=.45,impact=7){if(player.invuln>0)return false;const d=Math.max(0,amount)*(1-(player._alignArmor||0));',
  'alignment conditional resist',
);

// Critical hits detonate, for the Alignment that promises exactly that.
replaceOnce(
  'if(Math.random()<player.crit){d*=2;crit=true}',
  'if(Math.random()<player.crit){d*=2;crit=true;const cb=player.mods?.critBlast;' +
  'if(cb&&!e._critBlasting){e._critBlasting=true;for(const q of nearbyEnemies(e.x,e.y,cb.radius))' +
  'if(q!==e&&!q.dead&&dist2(q,e)<cb.radius*cb.radius)damageEnemy(q,d*cb.damage);' +
  'burst(e.x,e.y,palette.gold,10);e._critBlasting=false}}',
  'alignment crit blast',
);

// Dash cooldown is a modifier too, so Alignments that promise a faster dash
// actually deliver one.
replaceOnce(
  'player.dashCooldown=Math.max(.62,1.05-player.modules.thruster*.07);',
  'player.dashCooldown=Math.max(.62,1.05-player.modules.thruster*.07)*(player.mods?.dashCooldown??1);',
  'alignment dash cooldown',
);

// Cards read their line from the same table the effect applies from.
replaceOnce(
  '<div class="effect">${b.effect}</div>',
  '<div class="effect">${ALIGNMENT_EFFECTS[b.id]?effectTextFor(ALIGNMENT_EFFECTS[b.id]):b.effect}</div>',
  'alignment card copy',
);

for (const [token, label] of [
  ['applyAlignment(player,b.id)', 'apply'],
  ['tickAlignments(player,', 'tick'],
  ['onAlignmentKill(player,e)', 'kill rules'],
  ['alignmentDamageScale(player,e)', 'damage scale'],
  ['mods:createAlignmentMods()', 'mods container'],
  ['effectTextFor(ALIGNMENT_EFFECTS[b.id])', 'card copy'],
  ['player._alignScale?.speed', 'conditional move speed'],
  ['player._alignArmor', 'conditional resist'],
  ['player.mods?.critBlast', 'crit blast'],
]) if (!s.includes(token)) throw new Error('pass-aa: missing ' + label);

if (/b\.id===.seraphic_conduction./.test(s)) throw new Error('pass-aa: the nine hardcoded branches are still present');

fs.writeFileSync(path, s);
console.log('pass-aa: all 60 Alignments and Eclipses wired to real effects');
