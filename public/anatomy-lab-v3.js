import {generateCreatureGenome,mutateCreatureGenome,drawArcaneCreature,creatureName} from './anatomy-v3.js';
export function initCreatureLab(){
 const open=document.querySelector('#creature-lab-open'),screen=document.querySelector('#creature-lab'),grid=document.querySelector('#creature-grid'),seedInput=document.querySelector('#creature-seed'),detail=document.querySelector('#creature-detail'),worldSelect=document.querySelector('#creature-world');
 if(!open||!screen||!grid)return;
 let familySelect=document.querySelector('#creature-family');
 if(!familySelect&&worldSelect){familySelect=document.createElement('select');familySelect.id='creature-family';familySelect.innerHTML='<option value="mixed">MIXED</option><option value="humanoid">HUMANOID</option><option value="orb">ORB</option><option value="serpent">SERPENT</option>';worldSelect.before(familySelect)}
 let baseSeed='CHOIR-001',selected=null,world=0,family='mixed',raf=0,entries=[];
 const hide=()=>document.querySelectorAll('.screen').forEach(e=>e.classList.add('hidden'));
 const paint=(entry,time)=>{const {canvas,g,phase}=entry,c=canvas.getContext('2d');c.fillStyle='#040713';c.fillRect(0,0,canvas.width,canvas.height);drawArcaneCreature(c,{x:110,y:g.bodyPlan==='humanoid'?63:76,r:g.bodyPlan==='humanoid'?18:23,hp:1,maxHp:1,phase,genome:g},time,{preview:true})};
 const focus=(g,time=1)=>{const canvas=document.querySelector('#creature-focus'),c=canvas.getContext('2d');c.fillStyle='#040713';c.fillRect(0,0,canvas.width,canvas.height);drawArcaneCreature(c,{x:canvas.width/2,y:g.bodyPlan==='humanoid'?canvas.height*.34:canvas.height/2,r:g.bodyPlan==='humanoid'?25:32,hp:1,maxHp:1,phase:1,genome:g},time,{preview:true})};
 function animate(ts){const t=ts*.001;for(const e of entries)paint(e,t);if(!screen.classList.contains('hidden'))raf=requestAnimationFrame(animate)}
 function render(){cancelAnimationFrame(raf);entries=[];grid.innerHTML='';for(let i=0;i<12;i++){const seed=`${baseSeed}-${i}`,g=generateCreatureGenome(seed,{world,rank:i===11?'elite':i%5===4?'brute':i%4===3?'dart':'swarm',family}),card=document.createElement('button');card.className='creature-card';card.innerHTML=`<canvas width="220" height="150"></canvas><b>${creatureName(g)}</b><small>${g.bodyPlan.toUpperCase()} · ${g.behavior.toUpperCase()}</small>`;const canvas=card.querySelector('canvas');entries.push({canvas,g,phase:i*.7});paint(entries.at(-1),0);card.onclick=()=>{selected=g;detail.textContent=JSON.stringify(g,null,2);focus(g);[...grid.children].forEach(x=>x.classList.remove('selected'));card.classList.add('selected')};grid.append(card)}if(!selected)grid.firstElementChild?.click();raf=requestAnimationFrame(animate)}
 open.onclick=()=>{hide();screen.classList.remove('hidden');render()};
 document.querySelector('#creature-regenerate').onclick=()=>{baseSeed=seedInput.value.trim()||String(Date.now());selected=null;render()};
 document.querySelector('#creature-mutant').onclick=()=>{if(!selected)return;selected=mutateCreatureGenome(selected);detail.textContent=JSON.stringify(selected,null,2);focus(selected)};
 worldSelect.onchange=e=>{world=+e.target.value;selected=null;render()};
 if(familySelect)familySelect.onchange=e=>{family=e.target.value;selected=null;render()};seedInput.value=baseSeed;
}
