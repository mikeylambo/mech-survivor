const $=s=>document.querySelector(s);
const SAVE_KEY='mech-survivor-meta-v2';
const defaults={coins:0,unlocked:1,wins:0,runs:0,totalKills:0,bestTime:0,selectedClass:'rook',upgrades:{},settings:{shake:true,grid:true}};
let save=load(),selectedWorld=0,settingsReturn='title',runBanked=false;
const worlds=[
 {name:'Azure Expanse',sub:'THE FIRST INCURSION',color:'#168fff'},
 {name:'Obsidian Belt',sub:'DERELICT KILL-ZONE',color:'#8c7dff'},
 {name:'Solar Foundry',sub:'AUTONOMOUS WAR FORGE',color:'#ff9d42'},
 {name:'Graviton Scar',sub:'FRACTURED ORBITAL SPACE',color:'#df55ff'},
 {name:'Crown Citadel',sub:'ENEMY COMMAND NEXUS',color:'#e5bc54'}
];
const classes=[
 {id:'rook',name:'ROOK',mark:'R',desc:'Balanced combat frame. Reliable armor, weapons and mobility.',mods:['Starts with Cobalt Rail','+10 integrity','+8% weapon damage'],bonus:{hp:10,damage:.08}},
 {id:'lancer',name:'LANCER',mark:'L',desc:'High-speed hunter that fights from movement and close orbital pressure.',mods:['Starts with Aegis Blades + Vector Thrusters','+18% movement speed','+10% critical chance'],bonus:{speed:.18,magnet:.2,crit:.1}},
 {id:'bulwark',name:'BULWARK',mark:'B',desc:'Heavy command chassis that owns space with armor and radial pressure.',mods:['Starts with Argent Plating + Nova Pulse','+35 maximum integrity','12% damage resistance'],bonus:{hp:35,armor:.12,regen:.5}}
];
const shopItems=[
 {id:'damage',name:'Targeting Matrix',desc:'+5% weapon damage',base:60,max:10},
 {id:'hp',name:'Argent Bulkhead',desc:'+10 maximum integrity',base:50,max:10},
 {id:'speed',name:'Vector Calibration',desc:'+3% movement speed',base:45,max:10},
 {id:'xp',name:'Combat Analysis',desc:'+5% sync data gained',base:70,max:10},
 {id:'coins',name:'Salvage Protocol',desc:'+10% salvage earned',base:80,max:10},
 {id:'area',name:'Emitter Expanse',desc:'+4% weapon area',base:60,max:10},
 {id:'armor',name:'Reactive Skin',desc:'-1% incoming damage',base:260,max:10},
 {id:'crit',name:'Precision Core',desc:'+2% critical chance',base:300,max:10},
 {id:'magnet',name:'Soul Magnet',desc:'+12% pickup range',base:200,max:10},
 {id:'regen',name:'Nanite Renewal',desc:'+0.2 integrity per second',base:320,max:10},
 {id:'reroll',name:'Prepared Logic',desc:'+1 reroll every sortie',base:500,max:5},
 {id:'rebirth',name:'Rebirth Protocol',desc:'Revive once per sortie at 50%',base:900,max:1},
 {id:'mythic',name:'FRAME // SOVEREIGN',desc:'Permanent mythic chassis: 3x damage & integrity, 1.5x speed, 2x sync & salvage',base:250000,max:1}
];
function load(){try{return{...defaults,...JSON.parse(localStorage.getItem(SAVE_KEY)||'{}'),upgrades:{...defaults.upgrades,...JSON.parse(localStorage.getItem(SAVE_KEY)||'{}').upgrades},settings:{...defaults.settings,...JSON.parse(localStorage.getItem(SAVE_KEY)||'{}').settings}}}catch{return structuredClone(defaults)}}
function persist(){localStorage.setItem(SAVE_KEY,JSON.stringify(save));renderWallets()}
function screen(id){document.querySelectorAll('.screen').forEach(e=>e.classList.add('hidden'));$(id).classList.remove('hidden');queueMicrotask(()=>focusButton(0))}
function mainMenu(){window.mechGame?.stop();screen('#title');renderWallets()}
function renderWallets(){document.querySelectorAll('.wallet').forEach(e=>e.textContent=`◈ ${save.coins}`);$('#shop-coins').textContent=save.coins}
function cost(item,level){return Math.floor(item.base*(1+level*.72))}
function renderShop(){const grid=$('#shop-grid');grid.innerHTML='';for(const item of shopItems){const level=save.upgrades[item.id]||0,price=cost(item,level),maxed=level>=item.max,unaffordable=!maxed&&save.coins<price,card=document.createElement('article');card.className=`shop-card ${maxed?'maxed':''} ${unaffordable?'unaffordable':''}`;card.setAttribute('aria-disabled',unaffordable?'true':'false');card.innerHTML=`<div class="tier">${item.id==='mythic'?'ULTIMATE LONG-TERM GOAL':'PERMANENT POWER'} · LV ${level}/${item.max}</div><h3>${item.name}</h3><p>${item.desc}</p><button ${maxed||unaffordable?'disabled':''}>${maxed?'MAXIMUM':`◈ ${price}`}</button>${unaffordable?`<div class="shop-shortfall">NEED ◈ ${price-save.coins} MORE</div>`:''}`;card.querySelector('button').onclick=()=>{if(save.coins<price||maxed)return;save.coins-=price;save.upgrades[item.id]=level+1;persist();renderShop();focusButton(0)};grid.append(card)}renderWallets()}
function renderWorlds(){const list=$('#world-list');list.innerHTML='';worlds.forEach((w,i)=>{const locked=i>=save.unlocked,card=document.createElement('article');card.className=`world-card ${locked?'locked':''}`;card.style.borderColor=locked?'':w.color;card.innerHTML=`<div class="num">0${i+1}</div><div><h3>${w.name}</h3><p>${locked?`LOCKED · CLEAR ${worlds[i-1].name.toUpperCase()}`:w.sub}</p></div><button ${locked?'disabled':''}>${i<save.unlocked-1?'REPLAY':'ENTER'}</button>`;if(!locked)card.querySelector('button').onclick=()=>{selectedWorld=i;runBanked=false;window.mechGame.start(i)};list.append(card)})}
function renderClasses(){const grid=$('#class-grid');grid.innerHTML='';for(const frame of classes){const selected=save.selectedClass===frame.id,card=document.createElement('article');card.className=`class-card ${selected?'selected':''}`;card.innerHTML=`<div class="silhouette">${frame.mark}</div><div class="tier">BASE FRAME</div><h3>${frame.name}</h3><p>${frame.desc}</p><ul>${frame.mods.map(x=>`<li>${x}</li>`).join('')}</ul><button>${selected?'EQUIPPED':'EQUIP'}</button>`;card.querySelector('button').onclick=()=>{save.selectedClass=frame.id;persist();renderClasses();$('#class-label').textContent=frame.name};grid.append(card)}}
function renderAwards(){const awards=[['FIRST SORTIE','Complete one run',save.runs>=1],['SCRAP HARVESTER','Destroy 250 hostiles',save.totalKills>=250],['FRAME ARCHITECT','Reach level 10 in one run',JSON.parse(localStorage.getItem('mech-survivor-best')||'{}').level>=10],['SECTOR BREAKER','Clear one sector',save.wins>=1],['SYNCED','Trigger a module synergy',JSON.parse(localStorage.getItem('mech-survivor-best')||'{}').synergies?.length>0],['SOVEREIGN','Clear all five sectors',save.unlocked>worlds.length]];$('#award-grid').innerHTML=awards.map(([n,d,ok])=>`<article class="award-card"><div class="tier">${ok?'UNLOCKED':'LOCKED'}</div><h3>${n}</h3><p>${d}</p></article>`).join('')}
function bonuses(){const u=save.upgrades,m=u.mythic?1:0,c=classes.find(x=>x.id===save.selectedClass)?.bonus||{};return{classId:save.selectedClass,damage:(u.damage||0)*.05+(m?2:0)+(c.damage||0),hp:(u.hp||0)*10+(m?200:0)+(c.hp||0),speed:(u.speed||0)*.03+(m?.5:0)+(c.speed||0),xp:(u.xp||0)*.05+(m?1:0),coins:(u.coins||0)*.1+(m?1:0),area:(u.area||0)*.04+(m?.75:0),armor:(u.armor||0)*.01+(c.armor||0),crit:(u.crit||0)*.02+(m?.25:0)+(c.crit||0),magnet:(u.magnet||0)*.12+(c.magnet||0),regen:(u.regen||0)*.2+(c.regen||0),revives:(u.rebirth||0)+(m?3:0),rerolls:u.reroll||0}}
function bank(summary,won){if(runBanked)return;runBanked=true;save.coins+=summary.coins;save.runs++;save.totalKills+=summary.kills;save.bestTime=Math.max(save.bestTime,summary.time);if(won){save.wins++;save.unlocked=Math.max(save.unlocked,Math.min(worlds.length+1,summary.world+2))}persist()}
function endRun(won,summary){bank(summary,won);if(!won)return;window.mechGame.stop();screen('#clear');$('#clear-grid').innerHTML=`${worlds[summary.world].name.toUpperCase()} · LV ${summary.level} · ${summary.kills} KILLS · ◈ ${summary.coins}`;const next=worlds[summary.world+1];$('#unlock-text').textContent=next?`${next.name.toUpperCase()} UNLOCKED`:'ALL SECTORS CLEARED';$('#next-sector').classList.toggle('hidden',!next);$('#next-sector').onclick=()=>{selectedWorld=summary.world+1;runBanked=false;window.mechGame.start(selectedWorld)}}
window.MechMeta={bonuses,endRun};
$('#start').onclick=()=>{renderWorlds();screen('#worlds')};
$('#shop-open').onclick=()=>{renderShop();screen('#shop')};
$('#class-open').onclick=()=>{renderClasses();screen('#class-screen')};
$('#awards-open').onclick=()=>{renderAwards();screen('#awards')};
$('#settings-open').onclick=()=>{settingsReturn='title';screen('#settings')};
document.querySelectorAll('.back-menu').forEach(b=>b.onclick=mainMenu);
$('#pause').onclick=()=>{window.mechGame.pause();screen('#pause-screen')};
$('#resume').onclick=()=>{document.querySelectorAll('.screen').forEach(e=>e.classList.add('hidden'));window.mechGame.resume()};
$('#restart').onclick=()=>{runBanked=false;window.mechGame.restart()};
$('#forfeit').onclick=()=>{const s=window.mechGame.summary();if(s)bank(s,false);mainMenu()};
$('#quit-menu').onclick=mainMenu;
$('#pause-settings').onclick=()=>{settingsReturn='pause';screen('#settings')};
$('.back-context').onclick=()=>screen(settingsReturn==='pause'?'#pause-screen':'#title');
$('#retry').onclick=()=>{runBanked=false;window.mechGame.start(selectedWorld)};
$('#result-menu').onclick=mainMenu;$('#result-shop').onclick=()=>{renderShop();screen('#shop')};
$('#clear-menu').onclick=mainMenu;$('#clear-shop').onclick=()=>{renderShop();screen('#shop')};
$('#toggle-vfx').onclick=()=>{save.settings.shake=!save.settings.shake;$('#toggle-vfx b').textContent=save.settings.shake?'ON':'OFF';persist()};
$('#toggle-grid').onclick=()=>{save.settings.grid=!save.settings.grid;document.body.classList.toggle('no-grid',!save.settings.grid);$('#toggle-grid b').textContent=save.settings.grid?'ON':'OFF';persist()};
$('#reset-save').onclick=()=>{if(confirm('Reset all Mech Survivor progression?')){save=structuredClone(defaults);persist();renderShop()}};
addEventListener('keydown',e=>{if((e.code==='Escape'||e.code==='KeyP')&&window.mechGame?.state==='play')$('#pause').click();else if((e.code==='Escape'||e.code==='KeyP')&&window.mechGame?.state==='paused')$('#resume').click()});
let padLatch=false,padFocus=0,lastButtons=[];
function visibleButtons(){return [...document.querySelectorAll('button:not([disabled])')].filter(b=>b.offsetParent!==null&&!b.classList.contains('hidden'))}
function focusButton(index){const buttons=visibleButtons();if(!buttons.length)return;lastButtons.forEach(b=>b.classList.remove('gamepad-focus'));padFocus=(index+buttons.length)%buttons.length;buttons[padFocus].classList.add('gamepad-focus');buttons[padFocus].focus({preventScroll:true});buttons[padFocus].scrollIntoView({block:'nearest'});lastButtons=buttons}
function gamepadMenus(){const gp=navigator.getGamepads?.()[0];if(gp){const x=gp.axes[0]||0,y=gp.axes[1]||0,left=gp.buttons[14]?.pressed||x<-.55,right=gp.buttons[15]?.pressed||x>.55,up=gp.buttons[12]?.pressed||y<-.55,down=gp.buttons[13]?.pressed||y>.55,a=gp.buttons[0]?.pressed,b=gp.buttons[1]?.pressed,start=gp.buttons[9]?.pressed,active=left||right||up||down||a||b||start;if(active&&!padLatch){if(start){if(window.mechGame?.state==='play')$('#pause').click();else if(window.mechGame?.state==='paused')$('#resume').click()}else if(a){const buttons=visibleButtons();(buttons[padFocus]||buttons[0])?.click()}else if(b){const back=[...document.querySelectorAll('.back-context,.back-menu')].find(e=>e.offsetParent!==null);if(back)back.click();else if(window.mechGame?.state==='paused')$('#resume').click()}else focusButton(padFocus+(left||up?-1:1));padLatch=true}else if(!active)padLatch=false}requestAnimationFrame(gamepadMenus)}
addEventListener('gamepadconnected',()=>{focusButton(0);const hint=document.createElement('div');hint.className='input-hint';hint.textContent='GAMEPAD · D-PAD/STICK NAVIGATE · A SELECT · B BACK · START PAUSE';document.body.append(hint)});
$('#class-label').textContent=classes.find(x=>x.id===save.selectedClass)?.name||'ROOK';renderWallets();document.body.classList.toggle('no-grid',!save.settings.grid);gamepadMenus();
import('./creatures.js').then(m=>m.initCreatureLab()).catch(err=>console.error('Creature Lab init failed',err));