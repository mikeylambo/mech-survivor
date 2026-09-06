export function initVFXLab(fx,getAnchor=()=>({x:0,y:0})){
  if(typeof document==='undefined'||document.querySelector('#slu-vfx-lab'))return;
  const root=document.createElement('aside');root.id='slu-vfx-lab';
  root.style.cssText='position:fixed;right:12px;bottom:12px;z-index:9999;width:260px;padding:10px;background:rgba(3,10,22,.94);border:1px solid rgba(120,231,255,.45);box-shadow:0 0 24px rgba(22,143,255,.18);font:12px/1.35 system-ui,sans-serif;color:#eaf7ff;border-radius:8px;display:none;backdrop-filter:blur(8px)';
  root.innerHTML=`<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:8px"><b>SLU VFX LAB</b><span style="opacity:.6">F8 / ⌘⇧V</span></div><select id="slu-vfx-recipe" style="width:100%;margin-bottom:7px;background:#071323;color:#eaf7ff;border:1px solid #168fff;padding:6px"></select><div style="display:flex;gap:6px;align-items:center;margin-bottom:7px"><span>Intensity</span><input id="slu-vfx-intensity" type="range" min="0.25" max="2" step="0.05" value="1" style="flex:1"><output id="slu-vfx-intensity-out">1.00</output></div><div style="display:flex;gap:6px"><button id="slu-vfx-play" style="flex:1;padding:7px;background:#168fff;color:white;border:0;border-radius:5px;font-weight:700">PLAY</button><button id="slu-vfx-clear" style="padding:7px;background:#101827;color:#eaf7ff;border:1px solid #334155;border-radius:5px">CLEAR</button></div><div id="slu-vfx-stats" style="margin-top:7px;opacity:.65"></div>`;
  document.body.append(root);
  const select=root.querySelector('#slu-vfx-recipe'),range=root.querySelector('#slu-vfx-intensity'),out=root.querySelector('#slu-vfx-intensity-out'),stats=root.querySelector('#slu-vfx-stats');
  for(const id of fx.recipeIds){const o=document.createElement('option');o.value=id;o.textContent=id;select.append(o)}
  const preview=()=>{const p=getAnchor()||{x:0,y:0};fx.play(select.value,{x:p.x,y:p.y,dx:1,dy:0,intensity:+range.value,radius:170,color:'#78e7ff',count:18})};
  const toggle=()=>root.style.display=root.style.display==='none'?'block':'none';
  root.querySelector('#slu-vfx-play').onclick=preview;root.querySelector('#slu-vfx-clear').onclick=()=>fx.clear();range.oninput=()=>out.value=(+range.value).toFixed(2);
  addEventListener('keydown',e=>{const macToggle=e.metaKey&&e.shiftKey&&e.code==='KeyV';if(e.code==='F8'||macToggle){e.preventDefault();toggle()}else if(root.style.display!=='none'&&e.code==='KeyV'&&!e.repeat)preview()});
  const tick=()=>{if(root.isConnected){stats.textContent=`${fx.recipeCount} recipes · ${fx.activeCount} active · V = replay`;requestAnimationFrame(tick)}};tick();
  window.SLUVFX={fx,play:(id,params={})=>{const p=getAnchor()||{x:0,y:0};return fx.play(id,{x:p.x,y:p.y,...params})},toggle};
}
