import fs from 'node:fs';
const path='public/game.js';let s=fs.readFileSync(path,'utf8');const must=(ok,l)=>{if(!ok)throw new Error('pass-n: missing '+l)};
if(!s.includes('stick.y+(keys.has')){
 const from="let x=stick.x+(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),y=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);";
 const to="let x=stick.x+(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),y=stick.y+(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);";
 must(s.includes(from),'touch Y input seam');s=s.replace(from,to);
}
if(!s.includes('const mobileCamera=W<760')){
 const from='ctx.translate(W/2-player.x,H/2-player.y);';
 // Mobile zooms OUT, not in. It used to be 1.18 — an 18% zoom IN on the
 // platform with the least screen to spare, which is backwards for a
 // horde survivor: the whole read of the game is peripheral, and a phone
 // already sees less of the field than a desktop does. Below 1 the phone
 // gets a WIDER field of view than desktop, which is what the reference
 // games do. The tradeoff to watch when tuning is sprite and HUD
 // legibility at the wider view; 0.88 is the starting point, tuned live.
 const to="const mobileCamera=W<760,camZoom=mobileCamera?0.88:1,camY=mobileCamera?H*.46:H/2;ctx.translate(W/2,camY);ctx.scale(camZoom,camZoom);ctx.translate(-player.x,-player.y);";
 must(s.includes(from),'camera transform seam');s=s.replace(from,to);
}
if(!s.includes("class=\"choice-copy\"")){
 const re=/function renderChoiceCard\(u,i\)\{[\s\S]*?return d\}/;
 must(re.test(s),'choice renderer seam');
 s=s.replace(re,`function renderChoiceCard(u,i){const d=document.createElement('button');const arsenal=u.kind==='arsenal';d.className='choice '+(arsenal&&(u.stage==='branch'||u.stage==='evo')?'evolution':'');const effect=arsenal?u.effect:effectFor(u);const level=arsenal?arsenalTierLabel(player,u):tierLabel(u);const copy=(u.desc||'').split(/[.!?]/)[0].trim();d.innerHTML='<span class="type">'+u.type+' // '+(i+1)+'</span><h3>'+u.name+'</h3><div class="effect">'+effect+'</div><div class="level">'+level+'</div><p class="choice-copy">'+copy+'</p>';d.onclick=()=>choose(i);if(player.banishes>0&&u.stage!=='branch'){const bx=document.createElement('span');bx.className='banish-action';bx.textContent='BANISH · '+player.banishes;bx.onclick=e=>{e.stopPropagation();banishChoice(i)};d.append(bx)}return d}`);
}
fs.writeFileSync(path,s);console.log('pass-n: mobile vertical input + portrait camera + concise upgrade cards applied');
