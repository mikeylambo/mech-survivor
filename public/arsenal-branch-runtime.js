const TAU=Math.PI*2;
const dist=(a,b)=>Math.hypot((a.x||0)-(b.x||0),(a.y||0)-(b.y||0));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const state=(p,id)=>p.arsenal?.[id]||{tier:0,branch:null,evo:0};
const active=(p,id,branch)=>{const s=state(p,id);return s.branch===branch&&s.evo>0};
const rt=p=>p._branchRt||(p._branchRt={});
const nearby=(enemies,p,r)=>enemies.filter(e=>!e.dead&&dist(e,p)<=r);
const strongest=enemies=>[...enemies].filter(e=>!e.dead).sort((a,b)=>(b.hp||0)-(a.hp||0))[0];
const pushFx=(p,type,data)=>{(p.arsenalFx||(p.arsenalFx=[])).push({type,life:data.life||.25,max:data.life||.25,...data})};

export const BRANCH_BEHAVIOR={
 'rail:a':{name:'Siege Rail',rule:'Stationary charge converts the next rail shot into a colossal armor-breaking lance.'},
 'rail:b':{name:'Storm Rail',rule:'Movement builds volley tempo; mobile play feeds rapid lane pressure.'},
 'repeater:a':{name:'Gatling Array',rule:'Sustained contact builds heat and rate until target pressure breaks.'},
 'repeater:b':{name:'Heavy Repeater',rule:'Heavy rounds stagger and slow struck enemies.'},
 'scatter:a':{name:'Flak Storm',rule:'Close-range combat increases pellet bloom and blast pressure.'},
 'scatter:b':{name:'Flechette Driver',rule:'Distance tightens the weapon into a piercing corridor.'},
 'ricochet:a':{name:'Prism Shot',rule:'Crowd density increases rebound recursion.'},
 'ricochet:b':{name:'Kinetic Return',rule:'Each surviving rebound gains mass and impact.'},
 'hunter:a':{name:'Wolfpack',rule:'Seekers distribute across fresh targets instead of overkilling one enemy.'},
 'hunter:b':{name:'Executioner',rule:'Distance to the strongest target amplifies execution damage.'},
 'beam:a':{name:'Solar Lance',rule:'Holding aim on one target ramps burn and beam pressure.'},
 'beam:b':{name:'Needle Beam',rule:'Rapid target switching grants snap-fire bonuses.'},
 'sweep:a':{name:'Helios Sweep',rule:'Slow movement charges a larger rotational clear.'},
 'sweep:b':{name:'Cyclone Array',rule:'Movement turns the laser geometry into a mobile cage.'},
 'prism:a':{name:'Fractal Array',rule:'Crowds cause recursive branching into untouched enemies.'},
 'prism:b':{name:'Convergence Array',rule:'Crowd damage is relayed into the strongest enemy.'},
 'nova:a':{name:'Nova Heart',rule:'Being surrounded charges a huge panic-release nova.'},
 'nova:b':{name:'Pulse Engine',rule:'Movement distance accelerates radial pulse cadence.'},
 'arc:a':{name:'Tempest Relay',rule:'Dense groups conduct repeated relay shocks.'},
 'arc:b':{name:'Thunderhead',rule:'Chain endpoints seed delayed localized strikes.'},
 'orbit:a':{name:'Blade Crown',rule:'Close pressure accelerates a second defensive blade ring.'},
 'orbit:b':{name:'Execution Orbit',rule:'Fewer giant blades deal bonus damage to elites and bosses.'},
 'launchblade:a':{name:'Boomerang Edge',rule:'Movement bends return paths into repeated passes.'},
 'launchblade:b':{name:'Guillotine',rule:'A deliberate forward lane sacrifices frequency for massive penetration.'},
 'slash:a':{name:'Cross Cutter',rule:'Alternating movement directions create crossing slash geometry.'},
 'slash:b':{name:'Crescent Drive',rule:'Forward motion extends slash reach into broad traveling crescents.'},
 'drill:a':{name:'Bunker Drill',rule:'Staying near a heavy target ramps drill damage and pins it.'},
 'drill:b':{name:'Spiral Lance',rule:'Distance turns the drill into a traveling penetrator.'},
 'ram:a':{name:'Meteor Drive',rule:'Long dashes convert travel distance into an endpoint shockwave.'},
 'ram:b':{name:'Phantom Drive',rule:'Dash path leaves damaging afterimages.'},
 'missile:a':{name:'Macross Barrage',rule:'Continuous movement staggers missile waves across the screen.'},
 'missile:b':{name:'Judgment Missile',rule:'Fewer warheads prioritize elites and detonate in stages.'},
 'mortar:a':{name:'Carpet Bombardment',rule:'Movement direction paints artillery lines ahead of the frame.'},
 'mortar:b':{name:'Siege Shell',rule:'Stationary play earns slower, enormous impact zones.'},
 'cluster:a':{name:'Starfall',rule:'Fragments cascade while enemies remain densely grouped.'},
 'cluster:b':{name:'Implosion Charge',rule:'Blast geometry first expands then pulls targets inward.'},
 'mine:a':{name:'Minefield',rule:'Travel distance seeds persistent mine regions behind the player.'},
 'mine:b':{name:'Singularity Mine',rule:'Armed mines pull enemies before detonation.'},
 'plasma:a':{name:'Burning Sea',rule:'Overlapping zones merge into larger persistent territory.'},
 'plasma:b':{name:'Plasma Burst',rule:'Short-lived cells explode when they expire.'},
 'drone:a':{name:'Swarm Network',rule:'Multiple drones split targets and gain bonuses from target diversity.'},
 'drone:b':{name:'Archangel Drone',rule:'The drone behaves as a heavy second-character weapons platform.'},
 'funnels:a':{name:'Funnel Cloud',rule:'Movement expands roam radius and aggression.'},
 'funnels:b':{name:'Formation Funnels',rule:'Funnels switch between ring and line formations based on nearby pressure.'},
 'sentry:a':{name:'Gunline',rule:'Holding territory fabricates a disposable turret line.'},
 'sentry:b':{name:'Fortress Node',rule:'Remaining near one point grows a single powerful emplacement.'},
 'interceptor:a':{name:'Aegis Network',rule:'Successful blocks build a temporary protected sanctuary.'},
 'interceptor:b':{name:'Counterwing',rule:'Blocked projectiles are converted into retaliation fire.'},
 'barrier:a':{name:'Bulwark Field',rule:'Slow movement thickens the barrier and punishes close contact.'},
 'barrier:b':{name:'Reflector Field',rule:'Enemy projectiles crossing the field are reflected toward attackers.'},
 'graviton:a':{name:'Singularity',rule:'Nearby enemies are violently compressed into collision clusters.'},
 'graviton:b':{name:'Tidal Field',rule:'Player movement drags enemies laterally through the battlefield.'},
 'repulsor:a':{name:'Shock Front',rule:'Forward movement creates a directional wall that throws enemies outward.'},
 'repulsor:b':{name:'Omni Repulsor',rule:'Standing your ground emits repeated radial force pulses.'},
 'mark:a':{name:'Hunter Mark',rule:'One strongest target becomes a high-value execution contract.'},
 'mark:b':{name:'Pandemic Mark',rule:'Marks spread from dying targets into nearby enemies.'},
 'death:a':{name:'Chain Detonation',rule:'Enemy deaths can recursively trigger nearby death bursts.'},
 'death:b':{name:'Soul Salvo',rule:'Kills are converted into seeking ammunition.'},
 'temporal:a':{name:'Echo Frame',rule:'Recent attacks are repeated by a temporal copy.'},
 'temporal:b':{name:'Time Fracture',rule:'Moving fracture zones duplicate attacks inside their area.'}
};

export function branchBehaviorCoverage(){return Object.keys(BRANCH_BEHAVIOR)}

export function tickBranchIdentity(p,dt,c={}){
 const {enemies=[],shots=[],enemyShots=[],damageEnemy=()=>{},elapsed=0,input={x:0,y:0}}=c;
 const r=rt(p),speed=Math.hypot(input.x||0,input.y||0),close=nearby(enemies,p,150),veryClose=nearby(enemies,p,90);
 r.still=speed<.15?(r.still||0)+dt:0;r.travel=(r.travel||0)+speed*dt;

 // Siege vs storm rail: stance changes how the same family is played.
 if(active(p,'rail','a')){r.siege=clamp((r.siege||0)+(speed<.15?dt:-dt*1.6),0,2.4);for(const s of shots)if(s.kind==='rail'&&!s._branch){s._branch=true;if(r.siege>1){s.damage*=1.8+r.siege*.25;s.pierce=(s.pierce||0)+3;s.r=(s.r||3)+3;r.siege=0;pushFx(p,'line',{x:p.x,y:p.y,a:Math.atan2(s.vy,s.vx),len:320,w:8,life:.18})}}}
 if(active(p,'rail','b')){r.storm=clamp((r.storm||0)+(speed>.35?dt:-dt*.5),0,2);for(const s of shots)if(s.kind==='rail'&&!s._storm){s._storm=true;s.speedMult=1+r.storm*.12;s.damage*=1+r.storm*.18}}

 if(active(p,'repeater','a')){r.heat=clamp((r.heat||0)+(close.length?dt:-dt*.8),0,3);for(const s of shots)if(s.kind==='repeater'&&!s._heat){s._heat=true;s.damage*=1+r.heat*.16;s.vx*=1+r.heat*.05;s.vy*=1+r.heat*.05}}
 if(active(p,'repeater','b'))for(const s of shots)if(s.kind==='repeater'&&!s._heavy){s._heavy=true;s.r=(s.r||2)+3;s.damage*=1.25}

 if(active(p,'hunter','b')){const e=strongest(enemies);if(e){e._executionMark=true;const d=dist(p,e);e._executionMult=1+Math.min(1.2,d/500)}}
 if(active(p,'beam','a')){const e=strongest(enemies);if(e&&dist(p,e)<420){r.solarTarget=r.solarTarget===e?(r.solarTarget||e):e;r.solarRamp=clamp((r.solarRamp||0)+dt,0,3);if(r.solarRamp>1.2)damageEnemy(e,dt*8*r.solarRamp)}}else r.solarRamp=0;
 if(active(p,'beam','b')){r.snap=(r.snap||0)-dt;const e=strongest(enemies);if(e&&r.lastNeedle!==e){r.lastNeedle=e;r.snap=.5;damageEnemy(e,8+state(p,'beam').evo*5)}}

 if(active(p,'nova','a')){r.novaCharge=clamp((r.novaCharge||0)+veryClose.length*dt*.18,0,1);if(r.novaCharge>=1){for(const e of nearby(enemies,p,280))damageEnemy(e,55+state(p,'nova').evo*18);pushFx(p,'ring',{x:p.x,y:p.y,r:280,life:.45});r.novaCharge=0}}
 if(active(p,'nova','b')){r.pulseTravel=(r.pulseTravel||0)+speed*dt;if(r.pulseTravel>2.2){for(const e of nearby(enemies,p,120))damageEnemy(e,10+state(p,'nova').evo*4);pushFx(p,'ring',{x:p.x,y:p.y,r:120,life:.18});r.pulseTravel=0}}
 if(active(p,'arc','a')&&close.length>=4){r.arcRelay=(r.arcRelay||0)-dt;if(r.arcRelay<=0){r.arcRelay=.7;for(const e of close.slice(0,5))damageEnemy(e,5+state(p,'arc').evo*3)}}
 if(active(p,'arc','b'))for(const e of enemies)if(e._arcEndpoint&&!e._thunder){e._thunder=true;damageEnemy(e,18+state(p,'arc').evo*8)}

 if(active(p,'orbit','a')&&veryClose.length>=3){for(const e of veryClose)damageEnemy(e,dt*(5+state(p,'orbit').evo*3));}
 if(active(p,'orbit','b'))for(const e of enemies)if(!e.dead&&(e.t==='elite'||e.t==='boss')&&dist(e,p)<125)damageEnemy(e,dt*(10+state(p,'orbit').evo*7));

 if(active(p,'drill','a')){const e=strongest(enemies);if(e&&dist(e,p)<115){r.drillHold=r.drillTarget===e?(r.drillHold||0)+dt:0;r.drillTarget=e;e.speed*=Math.max(.82,1-dt*.8);if(r.drillHold>1)damageEnemy(e,dt*(18+state(p,'drill').evo*9))}else r.drillHold=0}
 if(active(p,'ram','a')){if(p.dashTime>0)r.dashDistance=(r.dashDistance||0)+dt*(p.speed||200);else if((r.dashDistance||0)>80){const rad=Math.min(230,80+r.dashDistance*.35);for(const e of nearby(enemies,p,rad))damageEnemy(e,18+r.dashDistance*.08);pushFx(p,'ring',{x:p.x,y:p.y,r:rad,life:.28});r.dashDistance=0}}
 if(active(p,'ram','b')&&p.dashTime>0){r.phantomTick=(r.phantomTick||0)-dt;if(r.phantomTick<=0){r.phantomTick=.09;for(const e of veryClose)damageEnemy(e,7+state(p,'ram').evo*3);pushFx(p,'dot',{x:p.x-(p.dashDir?.x||0)*30,y:p.y-(p.dashDir?.y||0)*30,r:12,life:.32})}}

 if(active(p,'mine','a')){r.mineTravel=(r.mineTravel||0)+speed*dt;if(r.mineTravel>1.4){shots.push({x:p.x,y:p.y,vx:0,vy:0,r:8,life:9,damage:14+state(p,'mine').evo*5,kind:'mine',pierce:0});r.mineTravel=0}}
 if(active(p,'mine','b'))for(const s of shots)if(s.kind==='mine')for(const e of enemies)if(!e.dead&&dist(s,e)<130){const a=Math.atan2(s.y-e.y,s.x-e.x);e.x+=Math.cos(a)*32*dt;e.y+=Math.sin(a)*32*dt}

 if(active(p,'sentry','a')&&r.still>1.1){r.gunline=(r.gunline||0)-dt;if(r.gunline<=0){r.gunline=.8;const e=strongest(enemies);if(e){for(const off of[-38,0,38]){const a=Math.atan2(e.y-(p.y+35),e.x-(p.x+off));shots.push({x:p.x+off,y:p.y+35,vx:Math.cos(a)*520,vy:Math.sin(a)*520,r:3,life:1.5,damage:9+state(p,'sentry').evo*4,kind:'sentry',pierce:0})}}}}
 if(active(p,'sentry','b')){r.fortress=clamp((r.fortress||0)+(r.still>0?dt:-dt*2),0,4);if(r.fortress>1.5){const e=strongest(enemies);if(e&&((r.fortressFire||0)-=dt)<=0){r.fortressFire=.35;const a=Math.atan2(e.y-p.y,e.x-p.x);shots.push({x:p.x,y:p.y+42,vx:Math.cos(a)*600,vy:Math.sin(a)*600,r:6,life:1.6,damage:18+r.fortress*6,kind:'sentry',pierce:1})}}}

 if(active(p,'barrier','a')&&speed<.2)for(const e of veryClose){const a=Math.atan2(e.y-p.y,e.x-p.x);e.x+=Math.cos(a)*22*dt;e.y+=Math.sin(a)*22*dt;damageEnemy(e,dt*(7+state(p,'barrier').evo*3))}
 if(active(p,'barrier','b'))for(const s of enemyShots)if(!s.dead&&dist(s,p)<110&&!s._reflected){s._reflected=true;const e=strongest(enemies);if(e){s.vx=(e.x-s.x)*3;s.vy=(e.y-s.y)*3;s.damage=(s.damage||8)*1.35;s.friendly=true}}

 if(active(p,'graviton','a')&&close.length>=2){const cx=close.reduce((n,e)=>n+e.x,0)/close.length,cy=close.reduce((n,e)=>n+e.y,0)/close.length;for(const e of close){e.x+=(cx-e.x)*dt*.65;e.y+=(cy-e.y)*dt*.65}}
 if(active(p,'graviton','b')&&speed>.1)for(const e of close){e.x+=(input.x||0)*48*dt;e.y+=(input.y||0)*48*dt}
 if(active(p,'repulsor','a')&&speed>.25)for(const e of veryClose){e.x+=(input.x||0)*90*dt;e.y+=(input.y||0)*90*dt}
 if(active(p,'repulsor','b')&&r.still>.8){r.omni=(r.omni||0)-dt;if(r.omni<=0){r.omni=.75;for(const e of nearby(enemies,p,150)){const a=Math.atan2(e.y-p.y,e.x-p.x);e.x+=Math.cos(a)*28;e.y+=Math.sin(a)*28}pushFx(p,'ring',{x:p.x,y:p.y,r:150,life:.2})}}

 if(active(p,'mark','a')){const e=strongest(enemies);if(e){e.marked=true;e._hunterMark=true}}
 if(active(p,'mark','b'))for(const e of enemies)if(e.marked&&e.dead&&!e._spreadMark){e._spreadMark=true;for(const n of enemies)if(!n.dead&&dist(e,n)<150)n.marked=true}

 if(active(p,'death','b')){const kills=p.kills||0;if(kills>(r.lastKills||kills)){const gained=kills-(r.lastKills||kills);for(let i=0;i<Math.min(4,gained);i++){const e=strongest(enemies);if(e){const a=Math.atan2(e.y-p.y,e.x-p.x);shots.push({x:p.x,y:p.y,vx:Math.cos(a)*300,vy:Math.sin(a)*300,r:4,life:2,damage:12+state(p,'death').evo*5,kind:'soul',target:e,turn:4})}}}r.lastKills=kills}
 if(active(p,'death','a')){const kills=p.kills||0;if(kills>(r.chainKills||kills)&&close.length){for(const e of close.slice(0,3))damageEnemy(e,8+state(p,'death').evo*4)}r.chainKills=kills}

 // Temporal branches alter repetition geometry instead of raw damage.
 if(active(p,'temporal','a')){r.echo=(r.echo||0)-dt;if(r.echo<=0&&shots.length){r.echo=1.1;const src=shots.at(-1);shots.push({...src,x:p.x,y:p.y,life:Math.max(.8,src.life||1),damage:(src.damage||8)*.65,_echo:true})}}
 if(active(p,'temporal','b')){r.fractureAngle=(r.fractureAngle||0)+dt*.55;r.fracture={x:p.x+Math.cos(r.fractureAngle)*120,y:p.y+Math.sin(r.fractureAngle)*120,r:72};for(const s of shots)if(!s._fracture&&dist(s,r.fracture)<r.fracture.r){s._fracture=true;shots.push({...s,x:r.fracture.x,y:r.fracture.y,damage:(s.damage||8)*.5,_fracture:true})}pushFx(p,'ring',{x:r.fracture.x,y:r.fracture.y,r:r.fracture.r,life:.08})}

 return r;
}

export function applyBranchDamageModifiers(p,e,d){
 if(e?._executionMark)d*=e._executionMult||1;
 if(e?._hunterMark)d*=1.5+state(p,'mark').evo*.2;
 return d;
}
