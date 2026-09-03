import fs from 'node:fs';

const path='public/game.js';
let s=fs.readFileSync(path,'utf8');
const replace=(from,to,label)=>{
  if(!s.includes(from)){
    if(s.includes(to))return;
    throw new Error(`pass-c: missing ${label}`);
  }
  s=s.replace(from,to);
};

// ERA C — Eight-minute power trip.
replace(
  'const RUN_DURATION=240,ELITE_TIMES=[60,120,180];',
  'const RUN_DURATION=480,BOSS_TIME=450,GOD_WINDOW_START=390,ELITE_TIMES=[90,210,330];',
  'run timeline'
);

replace(
  'player.next=Math.floor(player.next*1.28+7);',
  'player.next=Math.floor(player.next*1.20+7);',
  'xp curve'
);

replace(
  "const interval=Math.max(.12,.62-elapsed*.0045-activeWorld*.035);",
  "const interval=Math.max(.12,.62-elapsed*.0011-activeWorld*.035);",
  'spawn ramp'
);

replace(
  'const count=1+Math.floor(elapsed/55)+Math.floor(activeWorld/2)',
  'const count=1+Math.floor(elapsed/100)+Math.floor(activeWorld/2)+(elapsed>=GOD_WINDOW_START?1:0)',
  'spawn count cadence'
);

replace(
  'if(!finalBossSpawned&&elapsed>=RUN_DURATION){',
  'if(!finalBossSpawned&&elapsed>=BOSS_TIME){',
  'boss timing'
);

replace(
  "`BOSS ${format(Math.max(0,RUN_DURATION-elapsed))}`",
  "`BOSS ${format(Math.max(0,BOSS_TIME-elapsed))}`",
  'boss hud timing'
);

// Synthetic audio foundation. Zero assets, safe to replace/augment later with authored SFX.
replace(
  "const palette={white:'#eaf7ff',navy:'#071323',blue:'#168fff',cyan:'#78e7ff',gold:'#d6ae52',red:'#ff4664'};",
  `const palette={white:'#eaf7ff',navy:'#071323',blue:'#168fff',cyan:'#78e7ff',gold:'#d6ae52',red:'#ff4664'};
const audio={ctx:null,master:null,enabled:true,ensure(){if(!this.enabled)return null;if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=.16;this.master.connect(this.ctx.destination)}if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});return this.ctx},tone(freq=440,dur=.08,type='sine',gain=.12,slide=0){const ac=this.ensure();if(!ac)return;const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),t+dur);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+dur+.02)},noise(dur=.08,gain=.06){const ac=this.ensure();if(!ac)return;const n=Math.max(1,Math.floor(ac.sampleRate*dur)),b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;const src=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();src.buffer=b;f.type='bandpass';f.frequency.value=900;g.gain.setValueAtTime(gain,ac.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+dur);src.connect(f);f.connect(g);g.connect(this.master);src.start()},cue(kind){if(kind==='level'){this.tone(520,.09,'triangle',.11,280);setTimeout(()=>this.tone(790,.12,'triangle',.08,240),55)}else if(kind==='sync'){this.tone(330,.18,'sawtooth',.09,660);setTimeout(()=>this.tone(990,.22,'triangle',.08,330),90)}else if(kind==='warning'){this.tone(150,.16,'square',.09,-35);setTimeout(()=>this.tone(125,.2,'square',.08,-20),120)}else if(kind==='dash'){this.noise(.055,.05);this.tone(210,.07,'sawtooth',.055,310)}else if(kind==='hit'){this.noise(.07,.05);this.tone(95,.08,'square',.04,-35)}else if(kind==='god'){this.tone(220,.24,'sawtooth',.08,440);setTimeout(()=>this.tone(440,.28,'triangle',.09,440),100);setTimeout(()=>this.tone(880,.34,'sine',.075,220),210)}else if(kind==='boss'){this.tone(92,.32,'square',.1,-24);setTimeout(()=>this.tone(138,.32,'sawtooth',.08,-30),180)}}};
addEventListener('pointerdown',()=>audio.ensure(),{once:true});addEventListener('keydown',()=>audio.ensure(),{once:true});`,
  'audio foundation'
);

replace(
  "function syncSynergies(){const next=new Set(activeSynergies().map(s=>s.id));for(const id of next)if(!player.synergies.has(id)){player.synergies.add(id);const s=synergies.find(x=>x.id===id);burst(player.x,player.y,palette.gold,45);shake=10;toast(`SYNC EVOLUTION // ${s.name}`)}updateBuild()}",
  "function syncSynergies(){const next=new Set(activeSynergies().map(s=>s.id));for(const id of next)if(!player.synergies.has(id)){player.synergies.add(id);const s=synergies.find(x=>x.id===id);burst(player.x,player.y,palette.gold,45);shake=10;audio.cue('sync');toast(`SYNC EVOLUTION // ${s.name}`)}updateBuild()}",
  'synergy audio'
);

replace(
  "function spawnElite(){spawnEnemy(false,'elite');$('#boss-alert').textContent='WARNING // ELITE SIGNATURE';",
  "function spawnElite(){spawnEnemy(false,'elite');audio.cue('warning');$('#boss-alert').textContent='WARNING // ELITE SIGNATURE';",
  'elite warning audio'
);

replace(
  "burst(player.x,player.y,palette.cyan,12);shake=Math.max(shake,4);toast('VECTOR DASH')",
  "burst(player.x,player.y,palette.cyan,12);shake=Math.max(shake,4);audio.cue('dash');toast('VECTOR DASH')",
  'dash audio'
);

replace(
  'function gain(v){player.xp+=v*(1+player.modules.magnet*.18+player.xpBoost);if(player.xp>=player.next){player.xp-=player.next;player.level++;player.next=Math.floor(player.next*1.20+7);openLevel()}}',
  "function gain(v){player.xp+=v*(1+player.modules.magnet*.18+player.xpBoost);if(player.xp>=player.next){player.xp-=player.next;player.level++;player.next=Math.floor(player.next*1.20+7);audio.cue('level');openLevel()}}",
  'level audio'
);

replace(
  "if(!finalBossSpawned&&elapsed>=BOSS_TIME){finalBossSpawned=true;bossIndex=activeWorld+1;spawnEnemy(true);$('#boss-alert').classList.remove('hidden');",
  "if(!finalBossSpawned&&elapsed>=BOSS_TIME){finalBossSpawned=true;bossIndex=activeWorld+1;audio.cue('boss');spawnEnemy(true);$('#boss-alert').textContent='WARNING // SECTOR COMMANDER';$('#boss-alert').classList.remove('hidden');",
  'boss warning audio'
);

// One-time God Window ceremony. The final pre-boss minute is an explicit phase, not accidental pacing.
replace(
  'player.invuln=Math.max(0,player.invuln-dt);',
  "player.invuln=Math.max(0,player.invuln-dt);if(elapsed>=GOD_WINDOW_START&&!player._godWindow){player._godWindow=true;audio.cue('god');burst(player.x,player.y,palette.gold,52);shake=Math.max(shake,9);toast('ASCENDANCY WINDOW // FULL OUTPUT')} ",
  'god window cue'
);

// Threat readability: reserve red for danger and point to off-screen elites/bosses.
replace(
  'function drawMech(){drawCelestialFrame(ctx,player,elapsed,input(),palette,drones)}',
  `function drawMech(){drawCelestialFrame(ctx,player,elapsed,input(),palette,drones)}
function drawThreatIndicators(){const margin=38,cx=W/2,cy=H/2;for(const e of enemies){if(e.dead||!(e.t==='elite'||e.t==='boss'))continue;const sx=e.x-player.x+cx,sy=e.y-player.y+cy;if(sx>24&&sx<W-24&&sy>70&&sy<H-24)continue;const dx=sx-cx,dy=sy-cy,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,tx=cx+ux*Math.min((W/2-margin)/Math.max(Math.abs(ux),.001),(H/2-margin)/Math.max(Math.abs(uy),.001));ctx.save();ctx.translate(tx,cy+uy*(tx-cx)/(ux||.001));ctx.rotate(Math.atan2(uy,ux));ctx.fillStyle=palette.red;ctx.shadowColor=palette.red;ctx.shadowBlur=e.t==='boss'?18:10;ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(-9,-7);ctx.lineTo(-5,0);ctx.lineTo(-9,7);ctx.closePath();ctx.fill();ctx.restore()}}`,
  'threat indicators helper'
);

replace(
  "ctx.globalAlpha=1;ctx.restore();if(flash){ctx.fillStyle=`rgba(70,180,255,${flash*.08})`;ctx.fillRect(0,0,W,H)}ctx.restore()}",
  "ctx.globalAlpha=1;ctx.restore();drawThreatIndicators();if(flash){ctx.fillStyle=`rgba(70,180,255,${flash*.08})`;ctx.fillRect(0,0,W,H)}ctx.restore()}",
  'threat indicators draw'
);

fs.writeFileSync(path,s);
console.log('pass-c: eight-minute era + sensory foundation applied');
