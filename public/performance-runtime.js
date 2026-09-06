const spriteCache=new Map();
const MAX_CACHE=180;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=s=>{let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};

export function createPerformanceGovernor(){return{ema:16.7,quality:1,entityBudget:300,lastFrame:16.7,cacheHits:0,cacheMisses:0}}
export function sampleFrame(governor,ms,entityCount=0){governor.lastFrame=ms;governor.ema=governor.ema*.92+ms*.08;const pressure=Math.max(governor.ema/16.7,entityCount/230);governor.quality=clamp(1-(pressure-1)*.32,.45,1);governor.entityBudget=Math.round(170+governor.quality*150);return governor.quality}
export function performanceTier(governor){return governor.quality>.82?'full':governor.quality>.62?'reduced':'survival'}
export function clearCreatureSpriteCache(){spriteCache.clear()}
export function creatureCacheStats(){return{size:spriteCache.size,max:MAX_CACHE}}

function keyFor(e,scale){const g=e.genome||{};return`${g.seed||g.individual?.seed||e.t||'creature'}:${Math.round((e.r||18)*scale)}:${e.t||''}`}
function renderSprite(drawBase,e,scale=1){if(typeof OffscreenCanvas==='undefined'&&typeof document==='undefined')return null;const r=Math.max(12,(e.r||18)*scale),size=Math.ceil(r*4.6),canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(size,size):Object.assign(document.createElement('canvas'),{width:size,height:size});canvas.width=size;canvas.height=size;const c=canvas.getContext('2d');if(!c)return null;const ghost={...e,x:size/2,y:size/2,r:e.r||18,hit:0,phase:0};c.save();c.shadowBlur=0;drawBase(c,ghost,0,{lod:'cached',disableShadow:true});c.restore();return{canvas,size,r}}
export function drawCachedCreature(ctx,e,time,drawBase,governor,opts={}){
 if(!e||e.t==='boss'||e.t==='elite'||opts.forceLive)return drawBase(ctx,e,time,opts);
 const quality=governor?.quality??1,scale=quality<.62?.82:1,k=keyFor(e,scale);let sprite=spriteCache.get(k);
 if(!sprite){sprite=renderSprite(drawBase,e,scale);if(!sprite)return drawBase(ctx,e,time,{...opts,lod:quality<.7?'low':'full'});spriteCache.set(k,sprite);if(governor)governor.cacheMisses++;if(spriteCache.size>MAX_CACHE)spriteCache.delete(spriteCache.keys().next().value)}else if(governor)governor.cacheHits++;
 const m=e.genome?.motion,t=time*(m?.cadence||3)+(m?.phase||0),bob=m?Math.sin(t)*(m.bob||0)*(e.r||18):0,sway=m?Math.sin(t*.53)*(m.sway||0)*(e.r||18):0;
 const size=sprite.size*(e.r||18)/(sprite.r||18);ctx.drawImage(sprite.canvas,e.x-size/2+sway,e.y-size/2+bob,size,size)
}
export function shouldDrawEntity(index,total,governor){if(!governor||total<=governor.entityBudget)return true;const stride=Math.ceil(total/governor.entityBudget);return index%stride===0}
export function glowBudget(governor){const q=governor?.quality??1;return q>.82?1:q>.62?.5:0}
