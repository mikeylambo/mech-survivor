import fs from 'node:fs';
const path='public/game.js';
let s=fs.readFileSync(path,'utf8');
const must=(ok,label)=>{if(!ok)throw new Error('pass-g: missing '+label)};
if(!s.includes("from './arsenal.js'")){
 const anchor="import {createRunDirector,pollDirector,updateDirectorEvent,beginDirectorEvent,formationOffsets,directorPhase} from './director.js';";
 must(s.includes(anchor),'director import');
 s=s.replace(anchor,anchor+"\nimport {ARSENAL_FAMILIES,ARSENAL_BY_ID,createInitialArsenal,arsenalCardsFor,applyArsenalCard,arsenalTierLabel,arsenalBuildLines} from './arsenal.js';\nimport {evaluateBuildIdentity,CONFIG_BY_ID} from './configurations.js';\nimport {tickArsenal,updateArsenalFx,drawArsenalFx,applyMarkedDamage} from './arsenal-runtime.js';");
}
if(!s.includes('arsenal:createInitialArsenal')){
 const re=/classId:b\.classId\|\|'rook',modules:/;
 must(re.test(s),'player class/module seam');
 s=s.replace(re,"classId:b.classId||'rook',arsenal:createInitialArsenal(b.classId||'rook'),configurations:new Set(),primaryConfiguration:null,configurationHistory:[],modules:");
}
if(!s.includes('function syncConfigurations()')){
 const anchor='function syncSynergies(){';
 must(s.includes(anchor),'synergy seam');
 const helper=`function syncConfigurations(){const result=evaluateBuildIdentity(player.arsenal,player.configurations||new Set());player.configurations=result.active;player.primaryConfiguration=result.primary?.id||null;for(const c of result.gained){player.configurationHistory.push({id:c.id,time:elapsed});burst(player.x,player.y,palette.gold,c.tier==='apex'?70:42);shake=Math.max(shake,c.tier==='apex'?12:8);audio.cue(c.tier==='apex'?'god':'level');toast('CONFIGURATION ACHIEVED // '+c.name)}updateBuild()}\n`;
 s=s.replace(anchor,helper+anchor);
}
// Replace level-up roll with the final mixed utility + 30-family arsenal pool.
if(!s.includes('ARSENAL BRANCH // COMMIT')){
 const re=/function rollChoices\(\)\{[\s\S]*?\n\$\('#reroll'\)/;
 const m=s.match(re);must(m,'rollChoices block');
 const replacement=`function renderChoiceCard(u,i){const d=document.createElement('button');const arsenal=u.kind==='arsenal';d.className='choice '+(arsenal&&(u.stage==='branch'||u.stage==='evo')?'evolution':'');const effect=arsenal?u.effect:effectFor(u);const level=arsenal?arsenalTierLabel(player,u):tierLabel(u);d.innerHTML='<span class="type">'+u.type+' // '+(i+1)+'</span><h3>'+u.name+'</h3><div class="effect">'+effect+'</div><p>'+u.desc+'</p><div class="level">'+level+'</div>';d.onclick=()=>choose(i);if(player.banishes>0&&u.stage!=='branch'){const bx=document.createElement('span');bx.className='banish-action';bx.textContent='BANISH · '+player.banishes;bx.onclick=e=>{e.stopPropagation();banishChoice(i)};d.append(bx)}return d}\nfunction rollChoices(){const utilityIds=new Set(['armor','thruster','reactor','magnet','repair']);const utility=upgrades.filter(u=>utilityIds.has(u.id)&&!player.banished.has(u.id)&&((u.id!=='repair'&&player.modules[u.id]<u.max)||(u.id==='repair'&&player.hp<player.maxHp*.82)));const weapons=arsenalCardsFor(player).filter(u=>!player.banished.has(u.id));const branch=weapons.filter(u=>u.stage==='branch');choicePool=[];if(branch.length){const family=branch[0].family;choicePool=branch.filter(u=>u.family===family);$('#levelup .kicker').textContent='ARSENAL BRANCH // COMMIT';$('#levelup h2').textContent=ARSENAL_BY_ID[family].name.toUpperCase()+' EVOLUTION';$('#levelup p').textContent='Choose the machine this weapon becomes.'}else{restoreEvolutionHeader();const evolved=weapons.filter(u=>u.stage==='evo').sort(()=>Math.random()-.5),owned=weapons.filter(u=>u.stage==='base'&&(player.arsenal[u.family]?.tier||0)>0).sort(()=>Math.random()-.5),fresh=weapons.filter(u=>u.stage==='base'&&(player.arsenal[u.family]?.tier||0)===0).sort(()=>Math.random()-.5),utils=utility.sort(()=>Math.random()-.5);if(evolved.length&&Math.random()<.55)choicePool.push(evolved.shift());if(owned.length&&Math.random()<.7&&choicePool.length<3)choicePool.push(owned.shift());if(fresh.length&&player.level<=10&&choicePool.length<3)choicePool.push(fresh.shift());const pools=[owned,evolved,fresh,utils];while(choicePool.length<3&&pools.some(p=>p.length)){const pool=pools.sort((a,b)=>b.length-a.length)[0],u=pool.shift();if(u&&!choicePool.some(x=>x.id===u.id))choicePool.push(u)}}const box=$('#choices');box.innerHTML='';choicePool.forEach((u,i)=>box.append(renderChoiceCard(u,i)))}\n$('#reroll')`;
 s=s.replace(re,replacement);
}
if(!s.includes("if(u.kind==='arsenal'){")){
 const anchor="function choose(i){const u=choicePool[i];if(!u)return;if(choiceMode==='blessing'){applyBlessing(u);return}";
 must(s.includes(anchor),'choose seam');
 const repl=anchor+"if(u.kind==='arsenal'){const st=applyArsenalCard(player,u);syncConfigurations();$('#levelup').classList.add('hidden');restoreEvolutionHeader();state='play';burst(player.x,player.y,(u.stage==='branch'||u.stage==='evo')?palette.gold:palette.cyan,(u.stage==='branch'||u.stage==='evo')?34:18);shake=Math.max(shake,u.stage==='branch'?8:3);toast((u.stage==='branch'?'EVOLUTION // ':u.stage==='evo'?'EVOLUTION RANK // ':'ASSEMBLED // ')+u.name.toUpperCase());last=performance.now();return}";
 s=s.replace(anchor,repl);
}
// Existing utility upgrades can also cause configuration/UI refresh safely.
s=s.replace("syncSynergies();$('#levelup').classList.add('hidden');state='play';", "syncSynergies();syncConfigurations();$('#levelup').classList.add('hidden');state='play';");
if(!s.includes('applyMarkedDamage(e,d)')){
 const anchor='function damageEnemy(e,d){';must(s.includes(anchor),'damage seam');s=s.replace(anchor,anchor+'d=applyMarkedDamage(e,d);');
}
if(!s.includes('tickArsenal(player,dt')){
 const anchor='function update(dt){elapsed+=dt;tickRunDirector();';must(s.includes(anchor),'update director seam');
 s=s.replace(anchor,anchor+"tickArsenal(player,dt,{enemies,shots,enemyShots,damageEnemy,elapsed});updateArsenalFx(player,dt);");
}
if(!s.includes('drawArsenalFx(ctx,player,palette)')){
 const anchor='drawMech();';must(s.includes(anchor),'draw mech seam');s=s.replace(anchor,anchor+'drawArsenalFx(ctx,player,palette);');
}
// Replace build sidebar with arsenal + primary/secondary configuration vocabulary.
if(!s.includes("PRIMARY // '")){
 const re=/function updateBuild\(\)\{[\s\S]*?\nfunction toast\(s\)\{/;
 const m=s.match(re);must(m,'updateBuild block');
 const replacement=`function updateBuild(){const names={beam:'COBALT RAIL',missile:'SERAPH PODS',drone:'HALO DRONES',orbit:'AEGIS BLADES',armor:'ARGENT PLATE',thruster:'VECTOR DRIVE',reactor:'OVERDRIVE',magnet:'GRAVITON',pulse:'NOVA PULSE',arc:'JUDGMENT ARC',mine:'ZERO MINES',repair:'NANITES'};const chassis='<div class="module">'+player.classId.toUpperCase()+' CHASSIS</div>';const utility=Object.entries(player.modules).filter(([k,v])=>v>0&&['armor','thruster','reactor','magnet','repair'].includes(k)).map(([k,v])=>'<div class="module">'+names[k]+' <b>'+v+'</b></div>').join('');const arsenal=arsenalBuildLines(player).map(x=>'<div class="module">'+x+'</div>').join('');const primary=player.primaryConfiguration?'<div class="module sync">PRIMARY // '+CONFIG_BY_ID[player.primaryConfiguration].name+'</div>':'';const secondary=player.configurations?.size?'<div class="module sync">CONFIG // '+[...player.configurations].filter(id=>id!==player.primaryConfiguration).map(id=>CONFIG_BY_ID[id]?.name).filter(Boolean).join(' · ')+'</div>':'';const bless=player.blessings?.size?'<div class="module sync">BLESS // '+[...player.blessings].map(id=>blessings.find(b=>b.id===id)?.name).join(' · ')+'</div>':'';$('#module-list').innerHTML=chassis+utility+arsenal+primary+secondary+bless}\nfunction toast(s){`;
 s=s.replace(re,replacement);
}
if(!s.includes('arsenal:structuredClone(player.arsenal)')){
 const anchor='modules:{...player.modules},';must(s.includes(anchor),'summary modules seam');s=s.replace(anchor,anchor+'arsenal:structuredClone(player.arsenal),configurations:[...(player.configurations||[])],primaryConfiguration:player.primaryConfiguration,configurationHistory:[...(player.configurationHistory||[])],');
}
fs.writeFileSync(path,s);
console.log('pass-g: full 30-family arsenal + 36-configuration runtime integrated');
