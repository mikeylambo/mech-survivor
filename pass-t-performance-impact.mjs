import fs from 'node:fs';
const path='public/game.js';let s=fs.readFileSync(path,'utf8');
const need=(t,l)=>{if(!s.includes(t))throw new Error('pass-t: missing '+l)};
if(!s.includes("from './performance-runtime.js'"))s="import {createPerformanceGovernor,sampleFrame,drawCachedCreature} from './performance-runtime.js';\nimport {createImpactRuntime,updateImpact,impactTransform,impactPreset} from './impact-runtime.js';\n"+s;
if(!s.includes('const perf=createPerformanceGovernor()')){
 const a="const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');";need(a,'canvas seam');s=s.replace(a,a+"\nconst perf=createPerformanceGovernor(),impact=createImpactRuntime();");
}
if(!s.includes("impactPreset(impact,'dash')")){
 const a="toast('VECTOR DASH')";need(a,'dash seam');s=s.replace(a,a+";impactPreset(impact,'dash')");
}
if(!s.includes("impactPreset(impact,'level')")){
 const a="function openLevel(bonus=false){";need(a,'level seam');s=s.replace(a,a+"impactPreset(impact,'level');");
}
if(!s.includes("impactPreset(impact,e.t==='boss'?'boss-break':'elite-kill')")){
 const a="e.dead=true;player.kills++;";need(a,'kill seam');s=s.replace(a,"e.dead=true;if(e.t==='boss'||e.t==='elite')impactPreset(impact,e.t==='boss'?'boss-break':'elite-kill');player.kills++;");
}
if(!s.includes("impactPreset(impact,'boss-break');toast(`COMMANDER // PHASE ${phase}`)")){
 const a="toast(`COMMANDER // PHASE ${phase}`)";need(a,'boss phase seam');s=s.replace(a,"impactPreset(impact,'boss-break');"+a);
}
for(const a of ["shake=10;burst(player.x,player.y,palette.red,14)","shake=7;burst(player.x,player.y,palette.red,9)"]){if(s.includes(a))s=s.replace(a,"impactPreset(impact,'player-hit');"+a)}
if(!s.includes('drawCachedCreature(ctx,')){
 const re=/drawArcaneCreature\(ctx,([A-Za-z_$][\w$]*),elapsed(?:,[^)]*)?\)/g;let count=0;s=s.replace(re,(_,name)=>{count++;return`drawCachedCreature(ctx,${name},elapsed,drawArcaneCreature,perf)`});if(!count)throw new Error('pass-t: missing creature draw seam');
}
if(!s.includes('impactTransform(ctx,W,H,impact)')){
 const a='function draw(){ctx.save();';need(a,'draw transform seam');s=s.replace(a,a+'impactTransform(ctx,W,H,impact);');
}
const loopRe=/function loop\(now\)\{const dt=Math\.min\(\.033,\(now-last\)\/1000\|\|0\);last=now;if\(state==='play'\)update\(dt\);if\(!\['title','dead'\]\.includes\(state\)&&player\)draw\(\);requestAnimationFrame\(loop\)\}/;
if(!s.includes('sampleFrame(perf,realDt*1000,enemies.length)')){
 need(loopRe.test(s),'main loop seam');s=s.replace(loopRe,"function loop(now){const realDt=Math.min(.05,(now-last)/1000||0);last=now;sampleFrame(perf,realDt*1000,enemies.length);const step=updateImpact(impact,realDt);if(state==='play'&&step.dt>0)update(Math.min(.033,step.dt));if(!['title','dead'].includes(state)&&player)draw();requestAnimationFrame(loop)}");
}
if(!s.includes('performance:perf')){
 const a='window.mechGame={';need(a,'debug api seam');s=s.replace(a,"window.__mechRuntime={performance:perf,impact};\n"+a);
}
for(const [t,l] of [['drawCachedCreature(ctx,','cached creatures'],['sampleFrame(perf,realDt*1000,enemies.length)','governor'],["impactPreset(impact,'dash')",'dash haptics'],["impactPreset(impact,'boss-break')",'boss impact'],['updateImpact(impact,realDt)','timescale']])need(t,l);
fs.writeFileSync(path,s);console.log('pass-t: 60fps covenant + hitstop zoom-punch and haptics integrated');
