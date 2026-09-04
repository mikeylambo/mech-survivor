import fs from 'node:fs';
const path='public/game.js';let s=fs.readFileSync(path,'utf8');const must=(ok,l)=>{if(!ok)throw new Error('pass-n: missing '+l)};
if(!s.includes('stick.y+(keys.has')){
 const from="let x=stick.x+(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),y=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);";
 const to="let x=stick.x+(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),y=stick.y+(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);";
 must(s.includes(from),'touch Y input seam');s=s.replace(from,to);
}
if(!s.includes('const mobileCamera=W<760')){
 const from='ctx.save();ctx.translate(W/2-player.x,H/2-player.y);for(const c of caches)';
 const to="ctx.save();const mobileCamera=W<760,camZoom=mobileCamera?1.18:1,camY=mobileCamera?H*.46:H/2;ctx.translate(W/2,camY);ctx.scale(camZoom,camZoom);ctx.translate(-player.x,-player.y);for(const c of caches)";
 must(s.includes(from),'camera transform seam');s=s.replace(from,to);
}
if(!s.includes("class=\"choice-copy\"")){
 const re=/function renderChoiceCard\(u,i\)\{[\s\S]*?return d\}/;
 must(re.test(s),'choice renderer seam');
 s=s.replace(re,`function renderChoiceCard(u,i){const d=document.createElement('button');const arsenal=u.kind==='arsenal';d.className='choice '+(arsenal&&(u.stage==='branch'||u.stage==='evo')?'evolution':'');const effect=arsenal?u.effect:effectFor(u);const level=arsenal?arsenalTierLabel(player,u):tierLabel(u);const copy=(u.desc||'').split(/[.!?]/)[0].trim();d.innerHTML='<span class="type">'+u.type+' // '+(i+1)+'</span><h3>'+u.name+'</h3><div class="effect">'+effect+'</div><div class="level">'+level+'</div><p class="choice-copy">'+copy+'</p>';d.onclick=()=>choose(i);if(player.banishes>0&&u.stage!=='branch'){const bx=document.createElement('span');bx.className='banish-action';bx.textContent='BANISH · '+player.banishes;bx.onclick=e=>{e.stopPropagation();banishChoice(i)};d.append(bx)}return d}`);
}
fs.writeFileSync(path,s);console.log('pass-n: mobile vertical input + portrait camera + concise upgrade cards applied');
