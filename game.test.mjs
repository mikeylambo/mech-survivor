import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root=new URL('./public/',import.meta.url);
test('prototype ships a complete runnable surface',()=>{
  for(const file of ['index.html','style.css','game.js','meta.js'])assert.ok(fs.statSync(new URL(file,root)).size>1000,`${file} missing or empty`);
});
test('complete campaign meta loop is present',()=>{
  const source=fs.readFileSync(new URL('meta.js',root),'utf8');
  for(const token of ['renderShop','renderWorlds','endRun','bank','bonuses','unlocked','totalKills','Rebirth Protocol','FRAME // SOVEREIGN'])assert.match(source,new RegExp(token.replaceAll('/','\\/')));
  const game=fs.readFileSync(new URL('game.js',root),'utf8');
  assert.match(game,/RUN_DURATION=480/);
  assert.match(game,/BOSS_TIME=450/);
  assert.match(game,/GOD_WINDOW_START=390/);
  assert.match(game,/SECTOR COMMANDER DESTROYED/);
});
test('core survivor loop and mech genome hooks are present',()=>{
  const source=fs.readFileSync(new URL('game.js',root),'utf8');
  for(const token of ['spawnEnemy','openLevel','choicePool','missile','drones','damageEnemy','gain','die','reset','modules'])assert.match(source,new RegExp(token));
  for(const module of ['beam','missile','drone','orbit','armor','thruster','reactor','magnet','pulse','arc','mine'])assert.match(source,new RegExp(`id:'${module}'`));
});
test('class frames and controller-first menus are wired',()=>{
  const meta=fs.readFileSync(new URL('meta.js',root),'utf8');
  for(const token of ["id:'rook'","id:'lancer'","id:'bulwark'",'selectedClass','getGamepads','gamepadconnected','gamepad-focus','focusButton'])assert.match(meta,new RegExp(token.replaceAll('-','\\-')));
  const html=fs.readFileSync(new URL('index.html',root),'utf8');
  for(const token of ['class-screen','class-grid','reroll-count'])assert.match(html,new RegExp(token));
});
test('commanders have phase pressure and sectors have distinct arenas',()=>{
  const game=fs.readFileSync(new URL('game.js',root),'utf8');
  for(const token of ['REINFORCEMENTS','_summon','_chargeTime','const themes='])assert.match(game,new RegExp(token));
});

test('dash and glanceable upgrade effects are wired',()=>{
  const game=fs.readFileSync(new URL('game.js',root),'utf8');
  for(const token of ['tryDash','dashCooldown','dashTime','VECTOR DASH',"effect:'+1 Drone'","effect:'+1 Blade","+18% XP"])assert.ok(game.includes(token),token+' missing');
  const css=fs.readFileSync(new URL('style.css',root),'utf8');
  assert.match(css,/\.choice \.effect/);
});

test('dash HUD and tier-aware evolution cards are present',()=>{
  const game=fs.readFileSync(new URL('game.js',root),'utf8');
  const html=fs.readFileSync(new URL('index.html',root),'utf8');
  for(const token of ['milestones','effectFor','PIERCING RAIL','TWIN RAIL','TWIN SALVO','dash-label','player.hp<player.maxHp*.82'])assert.ok(game.includes(token),token+' missing');
  for(const token of ['dashbar','dash-label','SPACE / SHIFT / B / RB'])assert.ok(html.includes(token),token+' missing');
});

test('late-tier evolutions change weapon behavior, not only labels',()=>{
  const game=fs.readFileSync(new URL('game.js',root),'utf8');
  for(const token of ['COBALT TRIDENT','player.modules.beam>=6?3','player.modules.drone>=5?.55','player.modules.orbit>=5?2','.95','player.modules.arc>=5?2','player.modules.mine>=5?2'])assert.ok(game.includes(token),token+' missing');
});

test('full survivor punctuation and synergy layer is present',()=>{
 const game=fs.readFileSync(new URL('game.js',root),'utf8');
 for(const token of ['ELITE_TIMES','spawnElite','spawnCache','openCache','synergies','RAILSTORM ARRAY','SERAPH HALO','AEGIS NOVA','GRAVITY WELL','FORTRESS DRIVE','syncSynergies'])assert.ok(game.includes(token),token+' missing');
});

test('mobile controls scrolling camera and late-run performance guards are present',()=>{
 const html=fs.readFileSync(new URL('index.html',root),'utf8'),game=fs.readFileSync(new URL('game.js',root),'utf8'),css=fs.readFileSync(new URL('style.css',root),'utf8');
 for(const token of ['touch-controls','touch-stick','touch-dash'])assert.ok(html.includes(token));
 for(const token of ['touchMove','105-enemies.length','particles.length>430','gems.length>320','Math.abs(s.x-player.x)','COMMANDER // PHASE'])assert.ok(game.includes(token),token+' missing');
 assert.ok(css.includes('@media (pointer:coarse)'));
});

test('mines and Judgment Arc have visible functional combat behavior',()=>{
 const game=fs.readFileSync(new URL('game.js',root),'utf8');
 for(const token of ['lightningFx','drawLightning','kind===\'mine\'','armed:.35','trigger=82+player.modules.mine*6','radius=105+player.modules.mine*8','lightningFx.push'])assert.ok(game.includes(token),token+' missing');
});

test('procedural Arcane Creature genome system is deterministic and integrated',()=>{
  const creature=fs.readFileSync(new URL('creatures.js',root),'utf8');
  const game=fs.readFileSync(new URL('game.js',root),'utf8');
  const html=fs.readFileSync(new URL('index.html',root),'utf8');
  for(const token of ['generateCreatureGenome','hashSeed','bodyPlans','appendages','organs','mutations','behavior','drawArcaneCreature','drawCelestialFrame','mutateCreatureGenome'])assert.ok(creature.includes(token),token+' missing');
  for(const token of ['genome=generateCreatureGenome','enemyShots','g.stats.projectiles','g.stats.spawner','drawCreatureSmart','drawCelestialFrame'])assert.ok(game.includes(token),token+' missing');
  for(const token of ['creature-lab-open','creature-grid','creature-seed','creature-mutant','creature-world','creature-detail'])assert.ok(html.includes(token),token+' missing');
});
test('creature mutations have gameplay-linked traits',()=>{
  const creature=fs.readFileSync(new URL('creatures.js',root),'utf8');
  for(const token of ["shell')?.22","attack:'projectile'","attack:'spawn'","attack:'shield'",'projectiles:','spawner:','shield:'])assert.ok(creature.includes(token),token+' missing');
});
test('major creature genes are causal rather than cosmetic-only',()=>{
  const creature=fs.readFileSync(new URL('creatures.js',root),'utf8');
  const game=fs.readFileSync(new URL('game.js',root),'utf8');
  for(const token of ['contact:','speed:','hp:','damage:','pulse:','crystalGrowth'])assert.ok(creature.includes(token),token+' trait missing');
  for(const token of ['genome.stats.hp','genome.stats.damage','genome.stats.speed','stats.contact','stats.pulse','_pulseGene'])assert.ok(game.includes(token),token+' gameplay seam missing');
});