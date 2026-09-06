const dist=(a,b)=>Math.hypot((a.x||0)-(b.x||0),(a.y||0)-(b.y||0));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const state=(p,id)=>p.arsenal?.[id]||{tier:0,branch:null,evo:0};
const active=(p,id,branch)=>{const s=state(p,id);return s.branch===branch&&s.evo>0};
const rt=p=>p._branchRt||(p._branchRt={});
const nearby=(enemies,p,r)=>enemies.filter(e=>!e.dead&&dist(e,p)<=r);
const strongest=enemies=>[...enemies].filter(e=>!e.dead).sort((a,b)=>(b.hp||0)-(a.hp||0))[0];
const fx=(p,type,data)=>{(p.arsenalFx||(p.arsenalFx=[])).push({type,life:data.life||.25,max:data.life||.25,...data})};
const B=(name,rule)=>({name,rule});

export const BRANCH_BEHAVIOR={
 'rail:a':B('Siege Rail','Stationary charge converts the next rail shot into a colossal armor-breaking lance.'),'rail:b':B('Storm Rail','Movement builds volley tempo; mobile play feeds rapid lane pressure.'),
 'repeater:a':B('Gatling Array','Sustained contact builds heat and rate until target pressure breaks.'),'repeater:b':B('Heavy Repeater','Heavy rounds stagger and slow struck enemies.'),
 'scatter:a':B('Flak Storm','Close-range combat increases pellet bloom and blast pressure.'),'scatter:b':B('Flechette Driver','Distance tightens the weapon into a piercing corridor.'),
 'ricochet:a':B('Prism Shot','Crowd density increases rebound recursion.'),'ricochet:b':B('Kinetic Return','Each surviving rebound gains mass and impact.'),
 'hunter:a':B('Wolfpack','Seekers distribute across fresh targets instead of overkilling one enemy.'),'hunter:b':B('Executioner','Distance to the strongest target amplifies execution damage.'),
 'beam:a':B('Solar Lance','Holding aim on one target ramps burn and beam pressure.'),'beam:b':B('Needle Beam','Rapid target switching grants snap-fire bonuses.'),
 'sweep:a':B('Helios Sweep','Slow movement charges a larger rotational clear.'),'sweep:b':B('Cyclone Array','Movement turns the laser geometry into a mobile cage.'),
 'prism:a':B('Fractal Array','Crowds cause recursive branching into untouched enemies.'),'prism:b':B('Convergence Array','Crowd damage is relayed into the strongest enemy.'),
 'nova:a':B('Nova Heart','Being surrounded charges a huge panic-release nova.'),'nova:b':B('Pulse Engine','Movement distance accelerates radial pulse cadence.'),
 'arc:a':B('Tempest Relay','Dense groups conduct repeated relay shocks.'),'arc:b':B('Thunderhead','Chain endpoints seed delayed localized strikes.'),
 'orbit:a':B('Blade Crown','Close pressure accelerates a second defensive blade ring.'),'orbit:b':B('Execution Orbit','Fewer giant blades deal bonus damage to elites and bosses.'),
 'launchblade:a':B('Boomerang Edge','Movement bends return paths into repeated passes.'),'launchblade:b':B('Guillotine','A deliberate forward lane sacrifices frequency for massive penetration.'),
 'slash:a':B('Cross Cutter','Alternating movement directions create crossing slash geometry.'),'slash:b':B('Crescent Drive','Forward motion extends slash reach into broad traveling crescents.'),
 'drill:a':B('Bunker Drill','Staying near a heavy target ramps drill damage and pins it.'),'drill:b':B('Spiral Lance','Distance turns the drill into a traveling penetrator.'),
 'ram:a':B('Meteor Drive','Long dashes convert travel distance into an endpoint shockwave.'),'ram:b':B('Phantom Drive','Dash path leaves damaging afterimages.'),
 'missile:a':B('Macross Barrage','Continuous movement staggers missile waves across the screen.'),'missile:b':B('Judgment Missile','Fewer warheads prioritize elites and detonate in stages.'),
 'mortar:a':B('Carpet Bombardment','Movement direction paints artillery lines ahead of the frame.'),'mortar:b':B('Siege Shell','Stationary play earns slower, enormous impact zones.'),
 'cluster:a':B('Starfall','Fragments cascade while enemies remain densely grouped.'),'cluster:b':B('Implosion Charge','Blast geometry first expands then pulls targets inward.'),
 'mine:a':B('Minefield','Travel distance seeds persistent mine regions behind the player.'),'mine:b':B('Singularity Mine','Armed mines pull enemies before detonation.'),
 'plasma:a':B('Burning Sea','Overlapping zones merge into larger persistent territory.'),'plasma:b':B('Plasma Burst','Short-lived cells explode when they expire.'),
 'drone:a':B('Swarm Network','Multiple drones split targets and gain bonuses from target diversity.'),'drone:b':B('Archangel Drone','The drone behaves as a heavy second-character weapons platform.'),
 'funnels:a':B('Funnel Cloud','Movement expands roam radius and aggression.'),'funnels:b':B('Formation Funnels','Funnels switch between ring and line formations based on nearby pressure.'),
 'sentry:a':B('Gunline','Holding territory fabricates a disposable turret line.'),'sentry:b':B('Fortress Node','Remaining near one point grows a single powerful emplacement.'),
 'interceptor:a':B('Aegis Network','Successful blocks build a temporary protected sanctuary.'),'interceptor:b':B('Counterwing','Blocked projectiles are converted into retaliation fire.'),
 'barrier:a':B('Bulwark Field','Slow movement thickens the barrier and punishes close contact.'),'barrier:b':B('Reflector Field','Enemy projectiles crossing the field are reflected toward attackers.'),
 'graviton:a':B('Singularity','Nearby enemies are violently compressed into collision clusters.'),'graviton:b':B('Tidal Field','Player movement drags enemies laterally through the battlefield.'),
 'repulsor:a':B('Shock Front','Forward movement creates a directional wall that throws enemies outward.'),'repulsor:b':B('Omni Repulsor','Standing your ground emits repeated radial force pulses.'),
 'mark:a':B('Hunter Mark','One strongest target becomes a high-value execution contract.'),'mark:b':B('Pandemic Mark','Marks spread from dying targets into nearby enemies.'),
 'death:a':B('Chain Detonation','Enemy deaths can recursively trigger nearby death bursts.'),'death:b':B('Soul Salvo','Kills are converted into seeking ammunition.'),
 'temporal:a':B('Echo Frame','Recent attacks are repeated by a temporal copy.'),'temporal:b':B('Time Fracture','Moving fracture zones duplicate attacks inside their area.')
};
export function branchBehaviorCoverage(){return Object.keys(BRANCH_BEHAVIOR)}

export function tickBranchIdentity(p,dt,c={}){
 const {enemies=[],shots=[],enemyShots=[],damageEnemy=()=>{},input={x:0,y:0}}=c,r=rt(p),speed=Math.hypot(input.x||0,input.y||0),close=nearby(enemies,p,150),veryClose=nearby(enemies,p,90);
 r.still=speed<.15?(r.still||0)+dt:0;r.travel=(r.travel||0)+speed*dt;

 if(active(p,'rail','a')){r.siege=clamp((r.siege||0)+(speed<.15?dt:-dt*1.6),0,2.4);for(const s of shots)if(s.kind==='rail'&&!s._branch){s._branch=true;if(r.siege>1){s.damage*=1.8+r.siege*.25;s.pierce=(s.pierce||0)+3;s.r=(s.r||3)+3;r.siege=0;fx(p,'line',{x:p.x,y:p.y,a:Math.atan2(s.vy,s.vx),len:320,w:8,life:.18})}}}
 if(active(p,'rail','b')){r.storm=clamp((r.storm||0)+(speed>.35?dt:-dt*.5),0,2);for(const s of shots)if(s.kind==='rail'&&!s._storm){s._storm=true;s.damage*=1+r.storm*.18;s.vx*=1+r.storm*.08;s.vy*=1+r.storm*.08}}
 if(active(p,'repeater','a')){r.heat=clamp((r.heat||0)+(close.length?dt:-dt*.8),0,3);for(const s of shots)if(s.kind==='repeater'&&!s._heat){s._heat=true;s.damage*=1+r.heat*.16;s.vx*=1+r.heat*.05;s.vy*=1+r.heat*.05}}
 if(active(p,'repeater','b'))for(const s of shots)if(s.kind==='repeater'&&!s._heavy){s._heavy=true;s.r=(s.r||2)+3;s.damage*=1.25}
 if(active(p,'scatter','a')&&veryClose.length>=3)for(const s of shots)if(s.kind==='scatter'&&!s._flak){s._flak=true;s.r=(s.r||3)+2;s.damage*=1.2}
 if(active(p,'scatter','b'))for(const s of shots)if(s.kind==='scatter'&&!s._flechette){s._flechette=true;s.pierce=(s.pierce||0)+2;s.vx*=1.18;s.vy*=1.18}
 if(active(p,'ricochet','a')&&close.length>=4)for(const s of shots)if(s.kind==='ricochet'&&!s._prism){s._prism=true;s.ricochet=(s.ricochet||0)+2}
 if(active(p,'ricochet','b'))for(const s of shots)if(s.kind==='ricochet'&&!s._return){s._return=true;s.damage*=1.35;s.r=(s.r||3)+2}
 if(active(p,'hunter','b')){const e=strongest(enemies);if(e){e._executionMark=true;e._executionMult=1+Math.min(1.2,dist(p,e)/500)}}

 if(active(p,'beam','a')){const e=strongest(enemies);if(e&&dist(p,e)<420){r.solarTarget=r.solarTarget===e?e:e;r.solarRamp=clamp((r.solarRamp||0)+dt,0,3);if(r.solarRamp>1.2)damageEnemy(e,dt*8*r.solarRamp)}}else r.solarRamp=0;
 if(active(p,'beam','b')){const e=strongest(enemies);if(e&&r.lastNeedle!==e){r.lastNeedle=e;damageEnemy(e,8+state(p,'beam').evo*5)}}
 if(active(p,'sweep','a')&&r.still>1.2){r.helios=(r.helios||0)-dt;if(r.helios<=0){r.helios=2.4;for(const e of nearby(enemies,p,260))damageEnemy(e,20+state(p,'sweep').evo*8);fx(p,'ring',{x:p.x,y:p.y,r:260,life:.3})}}
 if(active(p,'sweep','b')&&speed>.3)for(const e of veryClose)damageEnemy(e,dt*(4+state(p,'sweep').evo*2));
 if(active(p,'prism','b')&&close.length>=3){const e=strongest(enemies);if(e)damageEnemy(e,dt*close.length*(2+state(p,'prism').evo))}
 if(active(p,'nova','a')){r.novaCharge=clamp((r.novaCharge||0)+veryClose.length*dt*.18,0,1);if(r.novaCharge>=1){for(const e of nearby(enemies,p,280))damageEnemy(e,55+state(p,'nova').evo*18);fx(p,'ring',{x:p.x,y:p.y,r:280,life:.45});r.novaCharge=0}}
 if(active(p,'nova','b')){r.pulseTravel=(r.pulseTravel||0)+speed*dt;if(r.pulseTravel>2.2){for(const e of nearby(enemies,p,120))damageEnemy(e,10+state(p,'nova').evo*4);fx(p,'ring',{x:p.x,y:p.y,r:120,life:.18});r.pulseTravel=0}}
 if(active(p,'arc','a')&&close.length>=4){r.arcRelay=(r.arcRelay||0)-dt;if(r.arcRelay<=0){r.arcRelay=.7;for(const e of close.slice(0,5))damageEnemy(e,5+state(p,'arc').evo*3)}}
 if(active(p,'arc','b')&&close.length){r.thunder=(r.thunder||0)-dt;if(r.thunder<=0){r.thunder=1.2;damageEnemy(close.at(-1),18+state(p,'arc').evo*8)}}

 if(active(p,'orbit','a')&&veryClose.length>=3)for(const e of veryClose)damageEnemy(e,dt*(5+state(p,'orbit').evo*3));
 if(active(p,'orbit','b'))for(const e of enemies)if(!e.dead&&(e.t==='elite'||e.t==='boss')&&dist(e,p)<125)damageEnemy(e,dt*(10+state(p,'orbit').evo*7));
 if(active(p,'launchblade','a')&&speed>.25)for(const s of shots)if(s.kind==='blade'&&!s._boom){s._boom=true;s.life=(s.life||1.5)+.8;s.ricochet=(s.ricochet||0)+1}
 if(active(p,'launchblade','b'))for(const s of shots)if(s.kind==='blade'&&!s._guil){s._guil=true;s.pierce=(s.pierce||0)+4;s.r=(s.r||6)+4;s.damage*=1.4}
 if(active(p,'slash','b')&&speed>.25)for(const e of close)damageEnemy(e,dt*(3+state(p,'slash').evo*2));
 if(active(p,'drill','a')){const e=strongest(enemies);if(e&&dist(e,p)<115){r.drillHold=r.drillTarget===e?(r.drillHold||0)+dt:0;r.drillTarget=e;e.speed*=Math.max(.82,1-dt*.8);if(r.drillHold>1)damageEnemy(e,dt*(18+state(p,'drill').evo*9))}else r.drillHold=0}
 if(active(p,'drill','b'))for(const s of shots)if(s.kind==='arsenal'&&!s._spiral){s._spiral=true;s.pierce=(s.pierce||0)+2}
 if(active(p,'ram','a')){if(p.dashTime>0)r.dashDistance=(r.dashDistance||0)+dt*(p.speed||200);else if((r.dashDistance||0)>80){const rad=Math.min(230,80+r.dashDistance*.35);for(const e of nearby(enemies,p,rad))damageEnemy(e,18+r.dashDistance*.08);fx(p,'ring',{x:p.x,y:p.y,r:rad,life:.28});r.dashDistance=0}}
 if(active(p,'ram','b')&&p.dashTime>0){r.phantomTick=(r.phantomTick||0)-dt;if(r.phantomTick<=0){r.phantomTick=.09;for(const e of veryClose)damageEnemy(e,7+state(p,'ram').evo*3);fx(p,'dot',{x:p.x-(p.dashDir?.x||0)*30,y:p.y-(p.dashDir?.y||0)*30,r:12,life:.32})}}

 if(active(p,'missile','a')&&speed>.25)for(const s of shots)if(s.kind==='missile'&&!s._macross){s._macross=true;s.turn=(s.turn||3.5)+1;s.life=(s.life||2)+.5}
 if(active(p,'missile','b'))for(const s of shots)if(s.kind==='missile'&&!s._judgment){s._judgment=true;s.damage*=1.45;s.r=(s.r||4)+3}
 if(active(p,'mortar','a')&&speed>.25&&close.length){r.carpet=(r.carpet||0)-dt;if(r.carpet<=0){r.carpet=.9;for(const e of close.slice(0,3))damageEnemy(e,12+state(p,'mortar').evo*4)}}
 if(active(p,'mortar','b')&&r.still>1.2&&close.length){r.siegeShell=(r.siegeShell||0)-dt;if(r.siegeShell<=0){r.siegeShell=2;for(const e of close)damageEnemy(e,18+state(p,'mortar').evo*7)}}
 if(active(p,'cluster','b')&&close.length>=3){const cx=close.reduce((n,e)=>n+e.x,0)/close.length,cy=close.reduce((n,e)=>n+e.y,0)/close.length;for(const e of close){e.x+=(cx-e.x)*dt*.35;e.y+=(cy-e.y)*dt*.35}}
 if(active(p,'mine','a')){r.mineTravel=(r.mineTravel||0)+speed*dt;if(r.mineTravel>1.4){shots.push({x:p.x,y:p.y,vx:0,vy:0,r:8,life:9,damage:14+state(p,'mine').evo*5,kind:'mine',pierce:0});r.mineTravel=0}}
 if(active(p,'mine','b'))for(const s of shots)if(s.kind==='mine')for(const e of enemies)if(!e.dead&&dist(s,e)<130){const a=Math.atan2(s.y-e.y,s.x-e.x);e.x+=Math.cos(a)*32*dt;e.y+=Math.sin(a)*32*dt}

 if(active(p,'sentry','a')&&r.still>1.1){r.gunline=(r.gunline||0)-dt;if(r.gunline<=0){r.gunline=.8;const e=strongest(enemies);if(e)for(const off of[-38,0,38]){const a=Math.atan2(e.y-(p.y+35),e.x-(p.x+off));shots.push({x:p.x+off,y:p.y+35,vx:Math.cos(a)*520,vy:Math.sin(a)*520,r:3,life:1.5,damage:9+state(p,'sentry').evo*4,kind:'sentry',pierce:0})}}}
 if(active(p,'sentry','b')){r.fortress=clamp((r.fortress||0)+(r.still>0?dt:-dt*2),0,4);r.fortressFire=(r.fortressFire||0)-dt;if(r.fortress>1.5&&r.fortressFire<=0){const e=strongest(enemies);if(e){r.fortressFire=.35;const a=Math.atan2(e.y-p.y,e.x-p.x);shots.push({x:p.x,y:p.y+42,vx:Math.cos(a)*600,vy:Math.sin(a)*600,r:6,life:1.6,damage:18+r.fortress*6,kind:'sentry',pierce:1})}}}
 if(active(p,'interceptor','a')){const blocked=enemyShots.filter(s=>s.dead&&s._intercepted).length;r.sanctuary=clamp((r.sanctuary||0)+blocked*dt*.5-dt*.08,0,1)}
 if(active(p,'barrier','a')&&speed<.2)for(const e of veryClose){const a=Math.atan2(e.y-p.y,e.x-p.x);e.x+=Math.cos(a)*22*dt;e.y+=Math.sin(a)*22*dt;damageEnemy(e,dt*(7+state(p,'barrier').evo*3))}
 if(active(p,'barrier','b'))for(const s of enemyShots)if(!s.dead&&dist(s,p)<110&&!s._reflected){s._reflected=true;s.dead=true;const e=strongest(enemies);if(e){const a=Math.atan2(e.y-s.y,e.x-s.x);shots.push({x:s.x,y:s.y,vx:Math.cos(a)*520,vy:Math.sin(a)*520,r:4,life:1.5,damage:(s.damage||8)*1.35,kind:'counter',pierce:0})}}

 if(active(p,'graviton','a')&&close.length>=2){const cx=close.reduce((n,e)=>n+e.x,0)/close.length,cy=close.reduce((n,e)=>n+e.y,0)/close.length;for(const e of close){e.x+=(cx-e.x)*dt*.65;e.y+=(cy-e.y)*dt*.65}}
 if(active(p,'graviton','b')&&speed>.1)for(const e of close){e.x+=(input.x||0)*48*dt;e.y+=(input.y||0)*48*dt}
 if(active(p,'repulsor','a')&&speed>.25)for(const e of veryClose){e.x+=(input.x||0)*90*dt;e.y+=(input.y||0)*90*dt}
 if(active(p,'repulsor','b')&&r.still>.8){r.omni=(r.omni||0)-dt;if(r.omni<=0){r.omni=.75;for(const e of nearby(enemies,p,150)){const a=Math.atan2(e.y-p.y,e.x-p.x);e.x+=Math.cos(a)*28;e.y+=Math.sin(a)*28}fx(p,'ring',{x:p.x,y:p.y,r:150,life:.2})}}
 if(active(p,'mark','a')){const e=strongest(enemies);if(e){e.marked=true;e._hunterMark=true}}
 if(active(p,'mark','b'))for(const e of enemies)if(e.marked&&e.dead&&!e._spreadMark){e._spreadMark=true;for(const n of enemies)if(!n.dead&&dist(e,n)<150)n.marked=true}

 if(active(p,'death','b')){const kills=p.kills||0;if(kills>(r.lastKills??kills)){for(let i=0;i<Math.min(4,kills-(r.lastKills??kills));i++){const e=strongest(enemies);if(e){const a=Math.atan2(e.y-p.y,e.x-p.x);shots.push({x:p.x,y:p.y,vx:Math.cos(a)*300,vy:Math.sin(a)*300,r:4,life:2,damage:12+state(p,'death').evo*5,kind:'soul',target:e,turn:4})}}}r.lastKills=kills}
 if(active(p,'death','a')){const kills=p.kills||0;if(kills>(r.chainKills??kills)&&close.length)for(const e of close.slice(0,3))damageEnemy(e,8+state(p,'death').evo*4);r.chainKills=kills}
 if(active(p,'temporal','a')){r.echo=(r.echo||0)-dt;if(r.echo<=0&&shots.length){r.echo=1.1;const src=shots.at(-1);if(!src._echo)shots.push({...src,x:p.x,y:p.y,life:Math.max(.8,src.life||1),damage:(src.damage||8)*.65,_echo:true})}}
 if(active(p,'temporal','b')){r.fractureAngle=(r.fractureAngle||0)+dt*.55;r.fracture={x:p.x+Math.cos(r.fractureAngle)*120,y:p.y+Math.sin(r.fractureAngle)*120,r:72};for(const s of [...shots])if(!s._fracture&&dist(s,r.fracture)<r.fracture.r){s._fracture=true;shots.push({...s,x:r.fracture.x,y:r.fracture.y,damage:(s.damage||8)*.5,_fracture:true})}fx(p,'ring',{x:r.fracture.x,y:r.fracture.y,r:r.fracture.r,life:.08})}
 return r;
}

export function applyBranchDamageModifiers(p,e,d){if(e?._executionMark)d*=e._executionMult||1;if(e?._hunterMark)d*=1.5+state(p,'mark').evo*.2;return d}
