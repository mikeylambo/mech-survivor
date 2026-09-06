const TAU=Math.PI*2;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const rand=(a,b)=>a+Math.random()*(b-a);
const lerp=(a,b,t)=>a+(b-a)*t;
const ease={linear:t=>t,outQuad:t=>1-(1-t)*(1-t),outCubic:t=>1-(1-t)**3,inQuad:t=>t*t,smooth:t=>t*t*(3-2*t)};
const value=(v,p,f)=>typeof v==='string'&&v.startsWith('$')?(p[v.slice(1)]??f):(v??f);
const num=(v,p,f=0)=>Number(value(v,p,f));
const color=(v,p,f='#fff')=>String(value(v,p,f));

function scaledCount(v,intensity){return Math.max(1,Math.round(v*Math.max(.2,intensity)))}

export function createVFXEngine(options={}){
  const recipes=new Map(),active=[],scheduled=[];
  const maxActive=options.maxActive??1100;
  const cameraImpulse=options.cameraImpulse||(()=>{}),screenFlash=options.screenFlash||(()=>{});

  function define(id,recipe){recipes.set(id,recipe);return api}
  function has(id){return recipes.has(id)}
  function play(id,params={}){
    const recipe=recipes.get(id);if(!recipe)return false;
    const p={x:0,y:0,dx:1,dy:0,intensity:1,...params};
    for(const m of recipe.modules||[]){
      const at=num(m.at,p,0);
      if(at>0)scheduled.push({time:at,module:m,params:p});else spawnModule(m,p);
    }
    return true;
  }
  function spawnModule(m,p){
    const intensity=Math.max(0,num(p.intensity,p,1));
    if(m.type==='camera'){cameraImpulse(num(m.strength,p,3)*intensity);return}
    if(m.type==='screenFlash'){screenFlash(num(m.amount,p,.25)*intensity,color(m.color,p,'#7de8ff'));return}
    if(m.type==='particles'){
      const count=scaledCount(Math.max(1,num(m.count,p,8)),intensity),base=Math.atan2(num(p.dy,p,0),num(p.dx,p,1));
      const spread=num(m.spread,p,TAU),speed0=num(m.speedMin,p,45),speed1=num(m.speedMax,p,180),life0=num(m.lifeMin,p,.18),life1=num(m.lifeMax,p,.5);
      for(let i=0;i<count;i++){
        const a=m.omni?rand(0,TAU):base+rand(-spread/2,spread/2),s=rand(speed0,speed1)*(.75+.35*intensity),life=rand(life0,life1);
        active.push({kind:'particle',x:num(p.x,p,0)+rand(-num(m.jitter,p,0),num(m.jitter,p,0)),y:num(p.y,p,0)+rand(-num(m.jitter,p,0),num(m.jitter,p,0)),vx:Math.cos(a)*s,vy:Math.sin(a)*s,life,max:life,size0:num(m.sizeMin,p,1),size1:num(m.sizeMax,p,4),drag:num(m.drag,p,4),gravity:num(m.gravity,p,0),color:color(m.color,p,'#fff'),shape:m.shape||'square',stretch:num(m.stretch,p,1),alpha:num(m.alpha,p,1)});
      }
      return;
    }
    const life=Math.max(.01,num(m.life,p,.25));
    if(m.type==='ring')active.push({kind:'ring',x:num(p.x,p,0),y:num(p.y,p,0),life,max:life,r0:num(m.r0,p,4),r1:num(m.r1,p,50)*(.8+.2*intensity),width0:num(m.width0,p,4),width1:num(m.width1,p,1),color:color(m.color,p,'#fff'),alpha:num(m.alpha,p,1),ease:m.ease||'outCubic'});
    else if(m.type==='flash')active.push({kind:'flash',x:num(p.x,p,0),y:num(p.y,p,0),life,max:life,r0:num(m.r0,p,2),r1:num(m.r1,p,32)*(.85+.25*intensity),color:color(m.color,p,'#fff'),alpha:num(m.alpha,p,.8),ease:m.ease||'outQuad'});
    else if(m.type==='streak'){
      const base=Math.atan2(num(p.dy,p,0),num(p.dx,p,1)),count=scaledCount(num(m.count,p,5),intensity);
      for(let i=0;i<count;i++){const a=base+rand(-num(m.spread,p,.25),num(m.spread,p,.25)),offset=rand(-num(m.offset,p,10),num(m.offset,p,10));active.push({kind:'streak',x:num(p.x,p,0)-Math.cos(base)*rand(2,num(m.length,p,42))+Math.cos(base+Math.PI/2)*offset,y:num(p.y,p,0)-Math.sin(base)*rand(2,num(m.length,p,42))+Math.sin(base+Math.PI/2)*offset,angle:a,life,max:life,length:num(m.length,p,42)*rand(.5,1),width:num(m.width,p,3),color:color(m.color,p,'#fff'),alpha:num(m.alpha,p,.75)})}
    }
    else if(m.type==='arc')active.push({kind:'arc',x:num(p.x,p,0),y:num(p.y,p,0),angle:Math.atan2(num(p.dy,p,0),num(p.dx,p,1))+num(m.angle,p,0),life,max:life,r:num(m.radius,p,38),span:num(m.span,p,1.8),width:num(m.width,p,5),color:color(m.color,p,'#fff'),alpha:num(m.alpha,p,1)});
  }
  function update(dt){
    for(let i=scheduled.length-1;i>=0;i--){const q=scheduled[i];q.time-=dt;if(q.time<=0){spawnModule(q.module,q.params);scheduled.splice(i,1)}}
    for(const o of active){o.life-=dt;if(o.kind==='particle'){o.x+=o.vx*dt;o.y+=o.vy*dt;o.vy+=o.gravity*dt;const d=Math.exp(-o.drag*dt);o.vx*=d;o.vy*=d}}
    for(let i=active.length-1;i>=0;i--)if(active[i].life<=0)active.splice(i,1);
    if(active.length>maxActive)active.splice(0,active.length-maxActive);
  }
  function draw(ctx){
    ctx.save();
    for(const o of active){const t=clamp(1-o.life/o.max),fade=1-t,fn=ease[o.ease]||ease.linear,e=fn(t);ctx.globalAlpha=fade*o.alpha;ctx.strokeStyle=o.color;ctx.fillStyle=o.color;ctx.shadowColor=o.color;
      if(o.kind==='particle'){const sz=lerp(o.size1,o.size0,t);ctx.shadowBlur=6;if(o.shape==='circle'){ctx.beginPath();ctx.arc(o.x,o.y,sz,0,TAU);ctx.fill()}else if(o.shape==='streak'){const speed=Math.hypot(o.vx,o.vy)||1;ctx.lineWidth=Math.max(1,sz);ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(o.x-o.vx/speed*sz*o.stretch,o.y-o.vy/speed*sz*o.stretch);ctx.stroke()}else ctx.fillRect(o.x-sz/2,o.y-sz/2,sz,sz)}
      else if(o.kind==='ring'){ctx.shadowBlur=10;ctx.lineWidth=lerp(o.width0,o.width1,e);ctx.beginPath();ctx.arc(o.x,o.y,lerp(o.r0,o.r1,e),0,TAU);ctx.stroke()}
      else if(o.kind==='flash'){const r=lerp(o.r0,o.r1,e),g=ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,r);g.addColorStop(0,o.color);g.addColorStop(.35,o.color);g.addColorStop(1,'transparent');ctx.globalAlpha=fade*o.alpha;ctx.fillStyle=g;ctx.beginPath();ctx.arc(o.x,o.y,r,0,TAU);ctx.fill()}
      else if(o.kind==='streak'){ctx.shadowBlur=9;ctx.lineWidth=o.width;ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(o.x-Math.cos(o.angle)*o.length,o.y-Math.sin(o.angle)*o.length);ctx.stroke()}
      else if(o.kind==='arc'){ctx.shadowBlur=12;ctx.lineWidth=o.width*(1-t*.55);ctx.beginPath();ctx.arc(o.x,o.y,o.r,o.angle-o.span/2,o.angle+o.span/2);ctx.stroke()}
    }
    ctx.restore();ctx.globalAlpha=1;
  }
  function clear(){active.length=0;scheduled.length=0}
  const api={define,has,play,update,draw,clear,get activeCount(){return active.length},get recipeCount(){return recipes.size},get recipeIds(){return [...recipes.keys()]}};
  return api;
}

export const VFX_EASINGS=Object.freeze(Object.keys(ease));
