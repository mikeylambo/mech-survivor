import fs from 'node:fs';

const gamePath='public/game.js';
let s=fs.readFileSync(gamePath,'utf8');
const replace=(from,to,label)=>{
  if(!s.includes(from)){
    if(s.includes(to))return;
    throw new Error(`pass-d: missing ${label}`);
  }
  s=s.replace(from,to);
};

replace(
  "let runCoins=0,finalBossSpawned=false,activeWorld=0,eliteStage=0;",
  "let runCoins=0,finalBossSpawned=false,activeWorld=0,eliteStage=0,choiceMode='upgrade',blessingStage=0;",
  'blessing runtime state'
);

replace(
  'const RUN_DURATION=480,BOSS_TIME=450,GOD_WINDOW_START=390,ELITE_TIMES=[90,210,330];',
  'const RUN_DURATION=480,BOSS_TIME=450,GOD_WINDOW_START=390,ELITE_TIMES=[90,210,330],BLESSING_TIMES=[165,270,315];',
  'blessing timeline'
);

replace(
  "];\nfunction activeSynergies(){return synergies.filter(s=>Object.entries(s.needs).every(([k,v])=>player.modules[k]>=v))}",
  `];
const blessings=[
 {id:'seraphic_conduction',kind:'blessing',type:'BLESSING',name:'Seraphic Conduction',effect:'+18% Damage · +8% Fire Rate',desc:'Clean celestial current courses through every mounted weapon.'},
 {id:'aegis_memory',kind:'blessing',type:'BLESSING',name:'Aegis Memory',effect:'+28 Integrity · +5% Resist',desc:'The frame remembers every impact and reinforces itself around the damage.'},
 {id:'hunter_lattice',kind:'blessing',type:'BLESSING',name:'Hunter Lattice',effect:'+12% Critical · +40 Pickup Range',desc:'Targeting geometry and recovery fields interlock into one predatory lattice.'},
 {id:'chorus_drive',kind:'blessing',type:'BLESSING',name:'Chorus Drive',effect:'+12% Move Speed · Faster Dash',desc:'Thruster harmonics synchronize around the pilot\'s intent.'},
 {id:'living_reactor',kind:'blessing',type:'BLESSING',name:'Living Reactor',effect:'+0.7 Repair/s · +10% Fire Rate',desc:'The reactor continuously repairs the chassis while accelerating weapon cycles.'},
 {id:'blighted_halo',kind:'corrupted',type:'CORRUPTED BLESSING',name:'Blighted Halo',effect:'+65% Damage · -30% Max Integrity',desc:'Enemy arcana is grafted into the weapon halo. Output surges as structural purity collapses.'},
 {id:'warped_reactor',kind:'corrupted',type:'CORRUPTED BLESSING',name:'Warped Reactor',effect:'+35% Fire Rate · -12% Resist',desc:'The core is forced beyond celestial tolerances by unstable Blight geometry.'},
 {id:'void_magnet',kind:'corrupted',type:'CORRUPTED BLESSING',name:'Void Graviton',effect:'+65% XP · -15% Move Speed',desc:'A warped collection field devours combat data and drags against the frame.'},
 {id:'fractured_aegis',kind:'corrupted',type:'CORRUPTED BLESSING',name:'Fractured Aegis',effect:'+22% Resist · -25% Max Integrity',desc:'Blight-hardening forms an alien shell: brutally efficient, visibly unstable.'}
];
function activeSynergies(){return synergies.filter(s=>Object.entries(s.needs).every(([k,v])=>player.modules[k]>=v))}`,
  'blessing definitions'
);

replace(
  'eliteStage=0;runCoins=0;finalBossSpawned=false;',
  "eliteStage=0;blessingStage=0;choiceMode='upgrade';runCoins=0;finalBossSpawned=false;",
  'blessing reset'
);

replace(
  'synergies:new Set(),bonusChoices:0}',
  'synergies:new Set(),blessings:new Set(),corruption:0,bonusChoices:0}',
  'player blessing state'
);

replace(
  "function openLevel(bonus=false){if(bonus)player.bonusChoices++;state='level';rollChoices();$('#levelup').classList.remove('hidden');$('#reroll').classList.toggle('hidden',player.rerolls<=0);$('#reroll-count').textContent=player.rerolls}",
  `function restoreEvolutionHeader(){$('#levelup .kicker').textContent='COMBAT DATA ACQUIRED';$('#levelup h2').textContent='FRAME EVOLUTION';$('#levelup p').textContent='Choose one assembly mutation'}
function openLevel(bonus=false){choiceMode='upgrade';restoreEvolutionHeader();if(bonus)player.bonusChoices++;state='level';rollChoices();$('#levelup').classList.remove('hidden');$('#reroll').classList.toggle('hidden',player.rerolls<=0);$('#reroll-count').textContent=player.rerolls}
function openBlessing(corrupted=false){choiceMode='blessing';state='level';const pool=blessings.filter(b=>b.kind===(corrupted?'corrupted':'blessing')&&!player.blessings.has(b.id)).sort(()=>Math.random()-.5);choicePool=pool.slice(0,3);$('#levelup .kicker').textContent=corrupted?'BLIGHT CONTACT // VOLATILE GRAFT':'CELESTIAL RESONANCE';$('#levelup h2').textContent=corrupted?'CORRUPTED BLESSING':'BLESSING';$('#levelup p').textContent=corrupted?'Power has a cost. Choose the compromise.':'Choose one rule-bending frame grace.';const box=$('#choices');box.innerHTML='';choicePool.forEach((b,i)=>{const d=document.createElement('button');d.className=\`choice blessing \${corrupted?'corrupted':''}\`;d.innerHTML=\`<span class="type">\${b.type} // \${i+1}</span><h3>\${b.name}</h3><div class="effect">\${b.effect}</div><p>\${b.desc}</p><div class="level">\${corrupted?'VOLATILE GRAFT':'FRAME GRACE'}</div>\`;d.onclick=()=>choose(i);box.append(d)});$('#reroll').classList.add('hidden');$('#levelup').classList.remove('hidden');audio.cue(corrupted?'corrupt':'blessing')}
function applyBlessing(b){player.blessings.add(b.id);if(b.id==='seraphic_conduction'){player.damage*=1.18;player.rate*=.92}else if(b.id==='aegis_memory'){player.maxHp+=28;player.hp+=28;player.armor+=.05}else if(b.id==='hunter_lattice'){player.crit+=.12;player.magnet+=40}else if(b.id==='chorus_drive'){player.speed*=1.12;player.modules.thruster=Math.max(1,player.modules.thruster)}else if(b.id==='living_reactor'){player.regen+=.7;player.rate*=.9}else if(b.id==='blighted_halo'){player.damage*=1.65;player.maxHp*=.70;player.hp=Math.min(player.hp,player.maxHp);player.corruption+=.42}else if(b.id==='warped_reactor'){player.rate*=.65;player.armor-=.12;player.corruption+=.38}else if(b.id==='void_magnet'){player.xpBoost+=.65;player.speed*=.85;player.corruption+=.34}else if(b.id==='fractured_aegis'){player.armor+=.22;player.maxHp*=.75;player.hp=Math.min(player.hp,player.maxHp);player.corruption+=.46}player.corruption=clamp(player.corruption,0,1);syncSynergies();updateBuild();burst(player.x,player.y,b.kind==='corrupted'?palette.red:palette.gold,b.kind==='corrupted'?48:36);shake=Math.max(shake,b.kind==='corrupted'?10:7);toast(\`\${b.kind==='corrupted'?'BLIGHT GRAFT':'BLESSING'} // \${b.name.toUpperCase()}\`);$('#levelup').classList.add('hidden');restoreEvolutionHeader();choiceMode='upgrade';state='play';last=performance.now()}`,
  'blessing choice flow'
);

replace(
  "function choose(i){const u=choicePool[i];if(!u)return;player.modules[u.id]++;",
  "function choose(i){const u=choicePool[i];if(!u)return;if(choiceMode==='blessing'){applyBlessing(u);return}player.modules[u.id]++;",
  'blessing choose branch'
);

replace(
  "+(player.synergies?.size?`<div class=\"module sync\">SYNC // ${[...player.synergies].map(id=>synergies.find(s=>s.id===id)?.name).join(' · ')}</div>`:'')}",
  "+(player.synergies?.size?`<div class=\"module sync\">SYNC // ${[...player.synergies].map(id=>synergies.find(s=>s.id===id)?.name).join(' · ')}</div>`:'')+(player.blessings?.size?`<div class=\"module sync\">BLESS // ${[...player.blessings].map(id=>blessings.find(b=>b.id===id)?.name).join(' · ')}</div>`:'')}",
  'build blessing list'
);

replace(
  "synergies:[...player.synergies]}}",
  "synergies:[...player.synergies],blessings:[...player.blessings],corruption:player.corruption}}",
  'run summary blessings'
);

replace(
  "player.invuln=Math.max(0,player.invuln-dt);if(elapsed>=GOD_WINDOW_START&&!player._godWindow){player._godWindow=true;audio.cue('god');burst(player.x,player.y,palette.gold,52);shake=Math.max(shake,9);toast('ASCENDANCY WINDOW // FULL OUTPUT')} ",
  "player.invuln=Math.max(0,player.invuln-dt);if(elapsed>=GOD_WINDOW_START&&!player._godWindow){player._godWindow=true;audio.cue('god');burst(player.x,player.y,palette.gold,52);shake=Math.max(shake,9);toast('ASCENDANCY WINDOW // FULL OUTPUT')}if(blessingStage<BLESSING_TIMES.length&&elapsed>=BLESSING_TIMES[blessingStage]){const corrupted=blessingStage===BLESSING_TIMES.length-1;blessingStage++;openBlessing(corrupted);return}",
  'blessing timeline trigger'
);

replace(
  "else if(kind==='boss'){this.tone(92,.32,'square',.1,-24);setTimeout(()=>this.tone(138,.32,'sawtooth',.08,-30),180)}}};",
  "else if(kind==='boss'){this.tone(92,.32,'square',.1,-24);setTimeout(()=>this.tone(138,.32,'sawtooth',.08,-30),180)}else if(kind==='blessing'){this.tone(420,.2,'sine',.075,420);setTimeout(()=>this.tone(840,.24,'triangle',.07,210),110)}else if(kind==='corrupt'){this.noise(.18,.07);this.tone(118,.3,'sawtooth',.085,260);setTimeout(()=>this.tone(244,.26,'square',.055,-90),120)}}};",
  'blessing audio cues'
);

fs.writeFileSync(gamePath,s);

const creaturePath='public/creatures.js';
let c=fs.readFileSync(creaturePath,'utf8');
const creplace=(from,to,label)=>{
  if(!c.includes(from)){
    if(c.includes(to))return;
    throw new Error(`pass-d creatures: missing ${label}`);
  }
  c=c.replace(from,to);
};

creplace(
  'export function drawCelestialFrame(ctx,p,time,move,palette,drones=[]){const mods=p.modules||{},x=p.x,y=p.y,strict=Math.PI/12;',
  'export function drawCelestialFrame(ctx,p,time,move,palette,drones=[]){const mods=p.modules||{},x=p.x,y=p.y,corruption=clamp(p.corruption||0,0,1),strict=Math.PI/12;',
  'corruption render state'
);

creplace(
  "ctx.fillStyle=palette.gold;ctx.fillRect(-2,-18,4,7);if(mods.beam){",
  `ctx.fillStyle=palette.gold;ctx.fillRect(-2,-18,4,7);if(corruption>0){ctx.save();ctx.globalAlpha=.3+.7*corruption;ctx.strokeStyle=\`hsl(322 92% \${58+corruption*16}%)\`;ctx.fillStyle=\`hsla(302,72%,36%,\${.18+.42*corruption})\`;ctx.shadowColor='hsl(322 100% 62%)';ctx.shadowBlur=8+18*corruption;ctx.lineWidth=1.5+corruption*2;const spikes=1+Math.floor(corruption*5);for(let i=0;i<spikes;i++){const side=i%2?1:-1,a=-1.25+i*.47+Math.sin(time*1.7+i)*.08,len=10+corruption*22+i*2;ctx.save();ctx.rotate(a);ctx.scale(side,1);ctx.beginPath();ctx.moveTo(7,-2);ctx.lineTo(11+len,-4-corruption*5);ctx.lineTo(14+len,2);ctx.lineTo(8,4);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}if(corruption>.32){ctx.beginPath();ctx.moveTo(-15,4);ctx.bezierCurveTo(-28,-8,-34+Math.sin(time*3)*5,-22,-42,-10);ctx.stroke()}if(corruption>.62){ctx.beginPath();ctx.moveTo(14,8);ctx.bezierCurveTo(31,18,34+Math.cos(time*2.4)*6,30,47,17);ctx.stroke()}ctx.restore()}if(mods.beam){`,
  'visible corruption grammar'
);

fs.writeFileSync(creaturePath,c);
console.log('pass-d: blessings + corrupted frame mutations applied');
