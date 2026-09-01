import {generateCreatureGenome as baseGenerate,mutateCreatureGenome as baseMutate,drawArcaneCreature as baseDraw,creatureName as baseName,genomeSummary as baseSummary,creatureParts as baseParts} from './anatomy-v3.js';

const TAU=Math.PI*2;
function hashSeed(input){let h=2166136261>>>0;for(const ch of String(input)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let a=hashSeed(seed)||1;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const pick=(r,a)=>a[Math.floor(r()*a.length)];
const MORPHOTYPES=['small-biped','heavy-biped','hunter','quadruped','avian','insectoid','serpent','orb-blob','aquatic','plant-beast','kaiju'];
export const creatureParts={...baseParts,morphotypes:['mixed',...MORPHOTYPES]};

function morphotypeFor(seed,rank,world,requested='mixed'){
 if(requested&&requested!=='mixed'&&MORPHOTYPES.includes(requested))return requested;
 const r=rng(`${seed}:morph:${rank}:${world}`);
 if(rank==='boss')return pick(r,['kaiju','heavy-biped','serpent','plant-beast']);
 if(rank==='brute')return pick(r,['heavy-biped','quadruped','kaiju']);
 if(rank==='dart')return pick(r,['avian','hunter','aquatic','insectoid']);
 const pool=['small-biped','small-biped','hunter','quadruped','avian','insectoid','serpent','orb-blob','aquatic','plant-beast','heavy-biped'];
 return pick(r,pool);
}
function baseOptions(morph){
 if(morph==='small-biped')return{family:'humanoid',parent:'balanced'};
 if(morph==='heavy-biped'||morph==='kaiju'||morph==='plant-beast')return{family:'humanoid',parent:'heavy'};
 if(morph==='hunter'||morph==='avian'||morph==='insectoid')return{family:'humanoid',parent:'hunter'};
 if(morph==='quadruped')return{family:'humanoid',parent:'runner'};
 if(morph==='serpent'||morph==='aquatic')return{family:'serpent',parent:'mixed'};
 return{family:'orb',parent:'mixed'};
}
function ensureAppendage(g,type,zone='back',mirror=true,length=.85){g.appendages.push({type,zone,socket:.5,length,thickness:.8,angle:.55,mirror})}
function tuneMorphotype(g,morph,world){
 g.morphotype=morph;g.version=4;
 const q=g.anatomy?.proportions,s=g.anatomy?.structure||{};
 if(q&&morph==='small-biped'){q.head*=1.42;q.torso*=.78;q.arm*=.82;q.leg*=.78;q.shoulder*=.84;q.thickness*=1.08;g.presentation.scale*=.84;s.hunched=false;s.digitigrade=false}
 if(q&&morph==='heavy-biped'){q.head*=.9;q.shoulder*=1.18;q.hip*=1.12;q.torso*=1.13;q.thickness*=1.28;q.arm*=.86;q.leg*=.9;g.presentation.scale*=1.08}
 if(q&&morph==='hunter'){q.head*=.85;q.arm*=1.16;q.leg*=1.08;q.torso*=.92;q.thickness*=.82;q.lean=(q.lean||0)+.07}
 if(q&&morph==='quadruped'){q.torso*=1.18;q.arm*=1.12;q.leg*=.9;q.head*=.82;q.shoulder*=.84;q.hip*=1.1;q.lean=.34;q.hunch=.18;s.digitigrade=true;g.behavior=pick(rng(g.seed+':quad'),['charge','chase'])}
 if(q&&morph==='avian'){q.head*=.76;q.torso*=.78;q.arm*=.82;q.leg*=1.22;q.thickness*=.72;q.lean=.13;s.digitigrade=true;ensureAppendage(g,'fin','back',true,1.35);g.behavior='strafe'}
 if(q&&morph==='insectoid'){q.head*=.64;q.torso*=.86;q.arm*=1.05;q.leg*=.94;q.thickness*=.68;s.extraArms=true;ensureAppendage(g,'spine','back',true,.8);if(!g.mutations.includes('eyeCluster'))g.mutations.push('eyeCluster')}
 if(morph==='aquatic'){g.presentation.scale*=.92;g.segments=Math.max(g.segments,6);ensureAppendage(g,'fin','segment',true,.72);ensureAppendage(g,'fin','rear',true,.8);g.behavior='orbit'}
 if(morph==='orb-blob'){g.presentation.scale*=.9;g.anatomy.lobes=Math.max(3,g.anatomy.lobes||4);g.anatomy.ring=false}
 if(q&&morph==='plant-beast'){q.shoulder*=1.08;q.torso*=1.1;q.arm*=.88;q.leg*=.84;q.thickness*=1.12;ensureAppendage(g,'tendril','back',true,1.1);ensureAppendage(g,'spine','shoulder',true,.72);if(world>1&&!g.mutations.includes('crystalGrowth'))g.mutations.push('crystalGrowth')}
 if(q&&morph==='kaiju'){q.head*=.7;q.shoulder*=1.25;q.hip*=1.14;q.torso*=1.2;q.arm*=.86;q.leg*=1.02;q.thickness*=1.34;q.lean=.1;g.presentation.scale*=1.28;ensureAppendage(g,'spine','back',true,.95);s.hunched=true}
 g.stats={...g.stats};
 if(morph==='heavy-biped'||morph==='kaiju'||morph==='plant-beast')g.stats.hp*=1.16;
 if(morph==='hunter'||morph==='avian'||morph==='quadruped')g.stats.speed*=1.12;
 if(morph==='insectoid')g.stats.contact*=1.1;
 return g;
}
export function generateCreatureGenome(seed,{world=0,rank='swarm',difficulty=1,morphotype='mixed',family='mixed',parent='mixed'}={}){
 const morph=morphotypeFor(seed,rank,world,morphotype);
 const mapped=morphotype==='mixed'?baseOptions(morph):baseOptions(morph);
 const g=baseGenerate(seed,{world,rank,difficulty,family:family!=='mixed'?family:mapped.family,parent:parent!=='mixed'?parent:mapped.parent});
 return tuneMorphotype(g,morph,world);
}
export function mutateCreatureGenome(g,mutationSeed=Date.now()){
 const n=baseMutate(g,mutationSeed);n.morphotype=g.morphotype||n.morphotype||'small-biped';return tuneMorphotype(n,n.morphotype,n.world||0);
}
export function creatureName(g){return`${baseName(g)} // ${(g.morphotype||g.bodyPlan).toUpperCase()}`}
export function genomeSummary(g){return`${(g.morphotype||'').toUpperCase()} · ${baseSummary(g)}`}

function palette(g){const h=g.presentation.hue,a=g.presentation.accent;return{body:`hsl(${h} 48% 13%)`,mid:`hsl(${h} 42% 25%)`,rim:`hsl(${a} 88% 61%)`,core:`hsl(${a} 100% 73%)`,hot:`hsl(${(a+38)%360} 95% 70%)`}}
function limb(ctx,a,b,r1,r2,p){const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l;ctx.fillStyle=p.body;ctx.strokeStyle=p.rim;ctx.lineWidth=Math.max(1,r1*.12);ctx.beginPath();ctx.moveTo(a.x+nx*r1,a.y+ny*r1);ctx.lineTo(b.x+nx*r2,b.y+ny*r2);ctx.lineTo(b.x-nx*r2,b.y-ny*r2);ctx.lineTo(a.x-nx*r1,a.y-ny*r1);ctx.closePath();ctx.fill();ctx.stroke()}
function eye(ctx,x,y,r,p){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.fillStyle=p.body;ctx.beginPath();ctx.arc(x,y,r*.34,0,TAU);ctx.fill()}
function health(ctx,e,p){if(e.hp>=e.maxHp)return;ctx.fillStyle='#07101d';ctx.fillRect(e.x-e.r,e.y-e.r-9,e.r*2,3);ctx.fillStyle=p.rim;ctx.fillRect(e.x-e.r,e.y-e.r-9,e.r*2*e.hp/e.maxHp,3)}
function drawQuadruped(ctx,e,time,p){const g=e.genome,b=19*((e.r||28)/22)*g.presentation.scale,w=Math.sin(time*5+(e.phase||0));ctx.save();ctx.translate(e.x,e.y);ctx.fillStyle=p.body;ctx.strokeStyle=p.rim;ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(0,0,b*1.05,b*.5,-.08,0,TAU);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(b*.82,-b*.28,b*.42,b*.36,-.25,0,TAU);ctx.fill();ctx.stroke();eye(ctx,b*.97,-b*.36,b*.065,p);for(const side of[-1,1]){const y=side*b*.28;for(const x of[-b*.58,b*.52]){const root={x,y},knee={x:x+b*.08*w,y:y+b*.46},foot={x:x+b*.16*w,y:y+b*.88};limb(ctx,root,knee,b*.12,b*.08,p);limb(ctx,knee,foot,b*.08,b*.035,p)}}ctx.strokeStyle=p.rim;ctx.lineWidth=b*.08;ctx.beginPath();ctx.moveTo(-b*.95,0);ctx.quadraticCurveTo(-b*1.4,-b*.18,-b*1.62,-b*.5);ctx.stroke();ctx.restore();health(ctx,e,p)}
function drawAvian(ctx,e,time,p){const g=e.genome,b=18*((e.r||28)/22)*g.presentation.scale,flap=.22*Math.sin(time*6+(e.phase||0));ctx.save();ctx.translate(e.x,e.y);ctx.fillStyle=p.body;ctx.strokeStyle=p.rim;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,0,b*.46,b*.78,0,0,TAU);ctx.fill();ctx.stroke();for(const side of[-1,1]){ctx.save();ctx.rotate(side*(.75+flap));ctx.beginPath();ctx.moveTo(0,-b*.1);ctx.lineTo(side*b*1.4,b*.1);ctx.lineTo(side*b*.62,b*.5);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}ctx.beginPath();ctx.moveTo(0,-b*.78);ctx.lineTo(b*.18,-b*1.05);ctx.lineTo(-b*.18,-b*1.05);ctx.closePath();ctx.fill();ctx.stroke();eye(ctx,b*.07,-b*.86,b*.055,p);ctx.restore();health(ctx,e,p)}
function drawInsectoid(ctx,e,time,p){const g=e.genome,b=17*((e.r||28)/22)*g.presentation.scale,w=.15*Math.sin(time*7+(e.phase||0));ctx.save();ctx.translate(e.x,e.y);ctx.fillStyle=p.body;ctx.strokeStyle=p.rim;ctx.lineWidth=1.4;for(const [y,rx,ry] of[[-b*.48,b*.35,b*.32],[0,b*.48,b*.42],[b*.55,b*.38,b*.48]]){ctx.beginPath();ctx.ellipse(0,y,rx,ry,0,0,TAU);ctx.fill();ctx.stroke()}for(let i=0;i<3;i++)for(const side of[-1,1]){const root={x:side*b*.25,y:-b*.2+i*b*.34},mid={x:side*b*(.72+i*.08),y:root.y+b*(i-1)*.08},tip={x:side*b*(1.02+i*.11),y:mid.y+b*(.22+w*side)};limb(ctx,root,mid,b*.055,b*.032,p);limb(ctx,mid,tip,b*.032,b*.012,p)}for(const side of[-1,1])eye(ctx,side*b*.13,-b*.55,b*.05,p);ctx.restore();health(ctx,e,p)}
function drawPlant(ctx,e,time,p){const g=e.genome,b=19*((e.r||28)/22)*g.presentation.scale,sway=.12*Math.sin(time*3+(e.phase||0));ctx.save();ctx.translate(e.x,e.y);ctx.fillStyle=p.body;ctx.strokeStyle=p.rim;ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(0,b*.18,b*.55,b*.72,0,0,TAU);ctx.fill();ctx.stroke();for(let i=0;i<5;i++){const a=-Math.PI*.85+i*Math.PI*.425+sway,root={x:0,y:-b*.1},tip={x:Math.cos(a)*b*1.12,y:Math.sin(a)*b*.9};limb(ctx,root,tip,b*.07,b*.012,p)}ctx.fillStyle=p.core;ctx.shadowColor=p.core;ctx.shadowBlur=14;ctx.beginPath();ctx.arc(0,b*.05,b*.12,0,TAU);ctx.fill();ctx.shadowBlur=0;ctx.restore();health(ctx,e,p)}
function drawAquatic(ctx,e,time,p){const g=e.genome,b=18*((e.r||28)/22)*g.presentation.scale,w=.12*Math.sin(time*4+(e.phase||0));ctx.save();ctx.translate(e.x,e.y);ctx.fillStyle=p.body;ctx.strokeStyle=p.rim;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,0,b*.92,b*.45,w,0,TAU);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-b*.82,0);ctx.lineTo(-b*1.35,-b*.42);ctx.lineTo(-b*1.28,b*.42);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(0,-b*.35);ctx.lineTo(b*.1,-b*.82);ctx.lineTo(b*.42,-b*.3);ctx.closePath();ctx.fill();ctx.stroke();eye(ctx,b*.56,-b*.1,b*.06,p);ctx.restore();health(ctx,e,p)}
export function drawArcaneCreature(ctx,e,time=0,opts={}){const m=e.genome?.morphotype,p=e.genome?palette(e.genome):null;if(!m||!p)return baseDraw(ctx,e,time,opts);if(m==='quadruped')return drawQuadruped(ctx,e,time,p);if(m==='avian')return drawAvian(ctx,e,time,p);if(m==='insectoid')return drawInsectoid(ctx,e,time,p);if(m==='plant-beast')return drawPlant(ctx,e,time,p);if(m==='aquatic')return drawAquatic(ctx,e,time,p);return baseDraw(ctx,e,time,opts)}