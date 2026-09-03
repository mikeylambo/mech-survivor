import fs from 'node:fs';
const path='public/meta.js';
let s=fs.readFileSync(path,'utf8');
const replace=(from,to,label)=>{if(!s.includes(from)){if(s.includes(to))return;throw new Error(`pass-f: missing ${label}`)}s=s.replace(from,to)};

if(!s.includes("from './rewards.js'"))s="import {generateRunSalvage,salvageDismantleValue,salvageSummary} from './rewards.js';\n"+s;

replace(
 "const defaults={coins:0,unlocked:1,wins:0,runs:0,totalKills:0,bestTime:0,selectedClass:'rook',upgrades:{},settings:{shake:true,grid:true}};",
 "const defaults={coins:0,reliquary:0,salvage:[],unlocked:1,wins:0,runs:0,totalKills:0,bestTime:0,selectedClass:'rook',upgrades:{},settings:{shake:true,grid:true}};",
 'retention save defaults'
);

replace(
 "let save=load(),selectedWorld=0,settingsReturn='title',runBanked=false;",
 "let save=load(),selectedWorld=0,settingsReturn='title',runBanked=false,pendingRewards=[];",
 'reward runtime state'
);

replace(
 "function load(){try{return{...defaults,...JSON.parse(localStorage.getItem(SAVE_KEY)||'{}'),upgrades:{...defaults.upgrades,...JSON.parse(localStorage.getItem(SAVE_KEY)||'{}').upgrades},settings:{...defaults.settings,...JSON.parse(localStorage.getItem(SAVE_KEY)||'{}').settings}}}catch{return structuredClone(defaults)}}",
 "function load(){try{const raw=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');return{...defaults,...raw,salvage:Array.isArray(raw.salvage)?raw.salvage:[],upgrades:{...defaults.upgrades,...raw.upgrades},settings:{...defaults.settings,...raw.settings}}}catch{return structuredClone(defaults)}}",
 'retention load migration'
);

replace(
 "function renderWallets(){document.querySelectorAll('.wallet').forEach(e=>e.textContent=`◈ ${save.coins}`);$('#shop-coins').textContent=save.coins}",
 "function renderWallets(){document.querySelectorAll('.wallet').forEach(e=>e.textContent=`◈ ${save.coins}`);if($('#shop-coins'))$('#shop-coins').textContent=save.coins;if($('#garage-count'))$('#garage-count').textContent=save.salvage.length;if($('#reliquary-count'))$('#reliquary-count').textContent=save.reliquary||0}",
 'retention wallets'
);

replace(
 "function bank(summary,won){if(runBanked)return;runBanked=true;save.coins+=summary.coins;save.runs++;save.totalKills+=summary.kills;save.bestTime=Math.max(save.bestTime,summary.time);if(won){save.wins++;save.unlocked=Math.max(save.unlocked,Math.min(worlds.length+1,summary.world+2))}persist()}",
 "function bank(summary,won){if(runBanked)return pendingRewards;runBanked=true;save.coins+=summary.coins;save.runs++;save.totalKills+=summary.kills;save.bestTime=Math.max(save.bestTime,summary.time);if(won){save.wins++;save.unlocked=Math.max(save.unlocked,Math.min(worlds.length+1,summary.world+2))}pendingRewards=generateRunSalvage(summary,won,`${Date.now()}-${save.runs}`);save.salvage.push(...pendingRewards);persist();return pendingRewards}",
 'guaranteed salvage bank'
);

replace(
 "function endRun(won,summary){bank(summary,won);if(!won)return;window.mechGame.stop();screen('#clear');$('#clear-grid').innerHTML=`${worlds[summary.world].name.toUpperCase()} · LV ${summary.level} · ${summary.kills} KILLS · ◈ ${summary.coins}`;const next=worlds[summary.world+1];$('#unlock-text').textContent=next?`${next.name.toUpperCase()} UNLOCKED`:'ALL SECTORS CLEARED';$('#next-sector').classList.toggle('hidden',!next);$('#next-sector').onclick=()=>{selectedWorld=summary.world+1;runBanked=false;window.mechGame.start(selectedWorld)}}",
 `function finishRunScreen(won,summary){if(!won){screen('#results');return}window.mechGame.stop();screen('#clear');$('#clear-grid').innerHTML=\`${worlds[summary.world].name.toUpperCase()} · LV \${summary.level} · \${summary.kills} KILLS · ◈ \${summary.coins}\`;const next=worlds[summary.world+1];$('#unlock-text').textContent=next?\`${next.name.toUpperCase()} UNLOCKED\`:'ALL SECTORS CLEARED';$('#next-sector').classList.toggle('hidden',!next);$('#next-sector').onclick=()=>{selectedWorld=summary.world+1;runBanked=false;window.mechGame.start(selectedWorld)}}
function showRewardReveal(won,summary,rewards){ensureRetentionUI();const list=$('#reward-items');list.innerHTML=rewards.map((item,i)=>\`<article class="reward-item \${item.rarity}"><div class="tier">SALVAGE // \${item.rarityLabel}</div><h3>\${item.slotLabel}</h3><p>\${salvageSummary(item)}</p><small>\${item.affixes.map(a=>a.label+' +'+a.roll).join(' · ')}</small></article>\`).join('');$('#reward-runline').textContent=\`SECTOR 0\${summary.world+1} · LV \${summary.level} · \${summary.kills} KILLS\`;$('#reward-continue').onclick=()=>finishRunScreen(won,summary);screen('#reward-reveal')}
function endRun(won,summary){const rewards=bank(summary,won)||pendingRewards;showRewardReveal(won,summary,rewards)}`,
 'reward reveal end run'
);

replace(
 "window.MechMeta={bonuses,endRun};",
 `function ensureRetentionUI(){if(!$('#garage-open')){const b=document.createElement('button');b.id='garage-open';b.innerHTML='GARAGE <b id="garage-count">0</b>';const stack=$('#title .menu-stack');stack?.insertBefore(b,$('#settings-open'));b.onclick=()=>{renderGarage();screen('#garage')}}if(!$('#garage')){const g=document.createElement('section');g.id='garage';g.className='screen hidden panel-screen garage-screen';g.innerHTML='<div class="kicker">PERSISTENT SALVAGE COLLECTION</div><h2>GARAGE</h2><div class="currency">RELIQUARY ◇ <b id="reliquary-count">0</b></div><div class="garage-layout"><div id="garage-grid" class="shop-grid"></div><aside id="garage-inspector" class="genome-inspector"><h3>INSPECT</h3><p>Select recovered salvage.</p></aside></div><button class="garage-back">‹ BACK</button>';document.body.append(g);g.querySelector('.garage-back').onclick=mainMenu}if(!$('#reward-reveal')){const r=document.createElement('section');r.id='reward-reveal';r.className='screen hidden reward-screen';r.innerHTML='<div class="kicker">RECOVERY CEREMONY</div><h2>SALVAGE SECURED</h2><p id="reward-runline"></p><div id="reward-items" class="reward-items"></div><button id="reward-continue">CONTINUE</button>';document.body.append(r)}if(!$('#retention-style')){const st=document.createElement('style');st.id='retention-style';st.textContent='.garage-layout{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:18px;width:min(1100px,92vw);margin:18px auto}.reward-items{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin:24px}.reward-item{min-width:230px;padding:18px;border:1px solid rgba(120,231,255,.35);background:rgba(4,13,26,.94)}.reward-item.rare{border-color:#168fff}.reward-item.epic{border-color:#df55ff}.reward-item.mythic{border-color:#d6ae52;box-shadow:0 0 25px rgba(214,174,82,.18)}.garage-item.locked{outline:1px solid #d6ae52}.garage-item button{margin-right:6px}.garage-inspector-actions{display:flex;gap:8px;flex-wrap:wrap}@media(max-width:760px){.garage-layout{grid-template-columns:1fr}.garage-layout aside{order:-1}}';document.head.append(st)}renderWallets()}
function renderGarage(){ensureRetentionUI();const grid=$('#garage-grid');grid.innerHTML='';const items=[...save.salvage].sort((a,b)=>(b.acquiredAt||0)-(a.acquiredAt||0));if(!items.length)grid.innerHTML='<article class="shop-card"><div class="tier">EMPTY BAY</div><h3>NO SALVAGE RECOVERED</h3><p>Complete a sortie to recover your first persistent component.</p></article>';for(const item of items){const card=document.createElement('article');card.className=\`shop-card garage-item \${item.rarity} \${item.locked?'locked':''}\`;card.innerHTML=\`<div class="tier">\${item.rarityLabel} · T\${item.tier}</div><h3>\${item.slotLabel}</h3><p>\${item.affixes.map(a=>a.label+' +'+a.roll).join(' · ')}</p><button>INSPECT</button>\`;card.querySelector('button').onclick=()=>inspectSalvage(item.id);grid.append(card)}renderWallets()}
function inspectSalvage(id){const item=save.salvage.find(x=>x.id===id);if(!item)return;const panel=$('#garage-inspector'),value=salvageDismantleValue(item);panel.innerHTML=\`<div class="tier">\${item.rarityLabel} // T\${item.tier}</div><h3>\${item.slotLabel}</h3><p>FAMILY // \${item.familyKey}</p><ul>\${item.affixes.map(a=>\`<li>\${a.label}: +\${a.roll}</li>\`).join('')}</ul><p>SOURCE // SECTOR 0\${(item.source?.world||0)+1} · LV \${item.source?.level||1}</p><div class="garage-inspector-actions"><button id="garage-lock">\${item.locked?'UNLOCK':'LOCK'}</button><button id="garage-dismantle" \${item.locked?'disabled':''}>DISMANTLE · ◇ \${value}</button></div>\`;$('#garage-lock').onclick=()=>{item.locked=!item.locked;persist();renderGarage();inspectSalvage(id)};$('#garage-dismantle').onclick=()=>{if(item.locked)return;save.reliquary=(save.reliquary||0)+value;save.salvage=save.salvage.filter(x=>x.id!==id);persist();renderGarage();panel.innerHTML='<h3>DISMANTLED</h3><p>Reliquary material recovered.</p>'}}
window.MechMeta={bonuses,endRun,renderGarage,get salvage(){return save.salvage},get reliquary(){return save.reliquary}};`,
 'garage retention UI'
);

replace(
 "$('#class-label').textContent=classes.find(x=>x.id===save.selectedClass)?.name||'ROOK';renderWallets();",
 "ensureRetentionUI();$('#class-label').textContent=classes.find(x=>x.id===save.selectedClass)?.name||'ROOK';renderWallets();",
 'retention bootstrap'
);

fs.writeFileSync(path,s);
console.log('pass-f: guaranteed salvage + reward reveal + Garage collection applied');
