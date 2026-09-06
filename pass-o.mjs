import fs from 'node:fs';
const path='public/meta.js';let s=fs.readFileSync(path,'utf8');const must=(ok,l)=>{if(!ok)throw new Error('pass-o: missing '+l)};
if(!s.includes("screen('#results')")){
 const from="function endRun(won,summary){bank(summary,won);if(!won)return;window.mechGame.stop();screen('#clear');$('#clear-grid').innerHTML=`${worlds[summary.world].name.toUpperCase()} · LV ${summary.level} · ${summary.kills} KILLS · ✦ ${summary.coins}`;const next=worlds[summary.world+1];$('#unlock-text').textContent=next?`${next.name.toUpperCase()} UNLOCKED`:'ALL ORBITS CLEARED';$('#next-sector').classList.toggle('hidden',!next);$('#next-sector').onclick=()=>{selectedWorld=summary.world+1;runBanked=false;window.mechGame.start(selectedWorld)}}";
 // stop() forces state back to 'title'. Calling it before the loss branch
// overwrote the 'dead' state die() had just set, which killed the Enter/Space
// retry the title screen advertises (game.js only accepts it while 'dead').
// The loss path does not need it: die() already parks the loop and hides the
// HUD, so only the objective readout is left to clear.
const to="function endRun(won,summary){bank(summary,won);if(!won){document.querySelector('#director-objective')?.classList.add('hidden');screen('#results');$('#result-grid').innerHTML='<div>LV<b>'+summary.level+'</b></div><div>KILLS<b>'+summary.kills+'</b></div><div>STARDUST<b>✦ '+summary.coins+'</b></div><div>TIME<b>'+Math.floor(summary.time/60)+':'+String(Math.floor(summary.time%60)).padStart(2,'0')+'</b></div>';$('#final-build').textContent=summary.primaryConfiguration?'PRIMARY // '+summary.primaryConfiguration.toUpperCase():'FRAME RECOVERED';return}window.mechGame.stop();screen('#clear');$('#clear-grid').innerHTML=`${worlds[summary.world].name.toUpperCase()} · LV ${summary.level} · ${summary.kills} KILLS · ✦ ${summary.coins}`;const next=worlds[summary.world+1];$('#unlock-text').textContent=next?`${next.name.toUpperCase()} UNLOCKED`:'ALL ORBITS CLEARED';$('#next-sector').classList.toggle('hidden',!next);$('#next-sector').onclick=()=>{selectedWorld=summary.world+1;runBanked=false;window.mechGame.start(selectedWorld)}}";
 must(s.includes(from),'endRun seam');s=s.replace(from,to);
}
fs.writeFileSync(path,s);console.log('pass-o: loss continuation now resolves into results screen');
