import fs from 'node:fs';
const path='public/game.js';
let s=fs.readFileSync(path,'utf8');
const replace=(from,to,label)=>{if(!s.includes(from)){if(s.includes(to))return;throw new Error(`pass-e: missing ${label}`)}s=s.replace(from,to)};

replace(
 "import {generateCreatureGenome,drawArcaneCreature,drawCelestialFrame,initCreatureLab} from './creatures.js';",
 "import {generateCreatureGenome,drawArcaneCreature,drawCelestialFrame,initCreatureLab} from './creatures.js';\nimport {createRunDirector,pollDirector,updateDirectorEvent,beginDirectorEvent,formationOffsets,directorPhase} from './director.js';",
 'director import'
);

replace(
 "let runCoins=0,finalBossSpawned=false,activeWorld=0,eliteStage=0,choiceMode='upgrade',blessingStage=0;",
 "let runCoins=0,finalBossSpawned=false,activeWorld=0,eliteStage=0,choiceMode='upgrade',blessingStage=0,director=null,eliteKills=0;",
 'director runtime state'
);

replace(
 "eliteStage=0;blessingStage=0;choiceMode='upgrade';runCoins=0;finalBossSpawned=false;",
 "eliteStage=0;blessingStage=0;choiceMode='upgrade';eliteKills=0;director=null;runCoins=0;finalBossSpawned=false;",
 'director reset state'
);

replace(
 "updateBuild();state='play';hideScreens();hud.classList.remove('hidden');buildUI.classList.remove('hidden');last=performance.now()}",
 "director=createRunDirector({world:activeWorld,seed:`${activeWorld}-${Date.now()}`});ensureDirectorHud();updateDirectorHud();updateBuild();state='play';hideScreens();hud.classList.remove('hidden');buildUI.classList.remove('hidden');last=performance.now()}",
 'director reset init'
);

replace(
 "if(e.t==='elite')spawnCache(e.x,e.y,'elite');if(e.t==='boss')",
 "if(e.t==='elite'){eliteKills++;spawnCache(e.x,e.y,'elite')}if(e.t==='boss')",
 'elite kill tracking'
);

replace(
 "function nearest(from=player){let best=null,bd=Infinity;",
 `function ensureDirectorHud(){if(document.querySelector('#director-objective'))return;const d=document.createElement('div');d.id='director-objective';d.className='director-objective hidden';d.innerHTML='<small>DIRECTOR</small><b id="director-title">OPPORTUNITY</b><span id="director-progress"></span>';document.body.append(d);if(!document.querySelector('#director-style')){const st=document.createElement('style');st.id='director-style';st.textContent='#director-objective{position:fixed;left:50%;top:88px;transform:translateX(-50%);z-index:8;min-width:260px;padding:8px 14px;border:1px solid rgba(120,231,255,.42);background:rgba(3,12,24,.88);text-align:center;letter-spacing:.12em;pointer-events:none}#director-objective.hidden{display:none}#director-objective small{display:block;color:#78e7ff;font-size:10px}#director-objective b{display:block;color:#eaf7ff;font-size:14px;margin:2px 0}#director-objective span{color:#d6ae52;font-size:11px}#director-objective.crisis{border-color:#ff4664;box-shadow:0 0 20px rgba(255,70,100,.18)}';document.head.append(st)}}
function updateDirectorHud(){const box=document.querySelector('#director-objective');if(!box)return;const e=director?.active;if(!e){box.classList.add('hidden');return}box.classList.remove('hidden');box.classList.toggle('crisis',e.kind==='crisis');document.querySelector('#director-title').textContent=\`${e.kind==='crisis'?'CRISIS':'OPPORTUNITY'} // ${e.label}\`;document.querySelector('#director-progress').textContent=\`${Math.floor(e.progress||0)} / ${e.target} · PAYOUT ◈ ${e.payout}\`}
function spawnFormation(id,rank='swarm',scale=1){const angle=rand(0,TAU),distance=Math.max(W,H)*.56+120,cx=player.x+Math.cos(angle)*distance,cy=player.y+Math.sin(angle)*distance,offsets=formationOffsets(id,{spacing:54+activeWorld*4,rotation:angle+Math.PI/2,scale});for(const off of offsets){if(enemies.length>=103)break;spawnEnemy(false,rank);const e=enemies.at(-1);if(e){e.x=cx+off.x;e.y=cy+off.y;e.directed=true}}}
function startDirectorEvent(e){beginDirectorEvent(e,{kills:player.kills,eliteKills});audio.cue(e.kind==='crisis'?'boss':'warning');toast(\`${e.kind==='crisis'?'CRISIS':'OPPORTUNITY'} // ${e.label}\`);spawnFormation(e.formation,'swarm',e.kind==='crisis'?1.2:1);if(e.metric==='eliteKills'||e.kind==='crisis'){spawnEnemy(false,'elite');const elite=enemies.at(-1),angle=rand(0,TAU),r=Math.max(W,H)*.55;if(elite){elite.x=player.x+Math.cos(angle)*r;elite.y=player.y+Math.sin(angle)*r;elite.directed=true}}updateDirectorHud()}
function tickRunDirector(){if(!director)return;const start=pollDirector(director,elapsed);if(start)startDirectorEvent(start);const result=updateDirectorEvent(director,{elapsed,kills:player.kills,eliteKills});if(result?.type==='complete'){runCoins+=result.event.payout;burst(player.x,player.y,palette.gold,26);audio.cue('level');toast(\`OBJECTIVE COMPLETE // ◈ ${result.event.payout}\`)}else if(result?.type==='failed'){toast(\`OBJECTIVE LOST // ${result.event.label}\`)}updateDirectorHud()}
function nearest(from=player){let best=null,bd=Infinity;`,
 'director runtime helpers'
);

replace(
 "function update(dt){elapsed+=dt;player.invuln=",
 "function update(dt){elapsed+=dt;tickRunDirector();player.invuln=",
 'director update tick'
);

replace(
 "synergies:[...player.synergies],blessings:[...player.blessings],corruption:player.corruption}}",
 "synergies:[...player.synergies],blessings:[...player.blessings],corruption:player.corruption,director:{completed:director?.completed||0,failed:director?.failed||0,history:director?.history||[],phase:directorPhase(elapsed).id}}}",
 'director run summary'
);

replace(
 "stop(){state='title';hud.classList.add('hidden');buildUI.classList.add('hidden');enemies=[];shots=[];enemyShots=[];gems=[]}",
 "stop(){state='title';hud.classList.add('hidden');buildUI.classList.add('hidden');document.querySelector('#director-objective')?.classList.add('hidden');enemies=[];shots=[];enemyShots=[];gems=[]}",
 'director stop cleanup'
);

fs.writeFileSync(path,s);
console.log('pass-e: director v1 + formations + opportunities/crisis applied');
