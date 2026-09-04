const TAU=Math.PI*2;
const power=s=>(s?.tier||0)+(s?.evo||0)*1.5;
const on=(p,id)=>power(p.arsenal?.[id])>0;
const line=(ctx,x1,y1,x2,y2,c,w=2,a=.8)=>{ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore()};
const box=(ctx,x,y,w,h,c)=>{ctx.save();ctx.fillStyle='#dce8f2';ctx.strokeStyle=c;ctx.lineWidth=1;ctx.fillRect(x-w/2,y-h/2,w,h);ctx.strokeRect(x-w/2,y-h/2,w,h);ctx.restore()};
const ring=(ctx,x,y,r,c,a=.35,w=1.2)=>{ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();ctx.restore()};
const tri=(ctx,x,y,r,c,rot=0)=>{ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r*.75,r);ctx.lineTo(-r*.75,r);ctx.closePath();ctx.fill();ctx.restore()};
function familyHardware(ctx,p,id,time,pal){const s=p.arsenal?.[id],q=power(s);if(!q)return;const x=p.x,y=p.y,e=s?.evo||0,branch=s?.branch;ctx.save();ctx.shadowColor=pal.cyan;ctx.shadowBlur=4+q*.8;
 switch(id){
  case'rail':box(ctx,x+28,y-5,26+q*3,7,pal.cyan);line(ctx,x+24,y-5,x+48+q*3,y-5,pal.cyan,2);break;
  case'repeater':for(let k=-1;k<=1;k++)line(ctx,x+18,y+k*4,x+37+q*2,y+k*4,pal.white,2);break;
  case'scatter':for(let k=-2;k<=2;k++)line(ctx,x+15,y,x+30+q*2,y+k*5,pal.cyan,1.4);break;
  case'ricochet':for(let k=0;k<3;k++)tri(ctx,x+18+k*5,y-18-k*2,4,pal.gold,k*.35);break;
  case'hunter':for(let k=0;k<Math.min(5,1+Math.floor(q/2));k++)box(ctx,x-24+k*8,y-22,6,10,pal.gold);break;
  case'beam':box(ctx,x-28,y-4,23+q*2,8,pal.cyan);ring(ctx,x-40-q,y-4,4+e*2,pal.cyan,.6,2);break;
  case'sweep':{const a=time*.7;line(ctx,x,y,x+Math.cos(a)*(42+q*3),y+Math.sin(a)*(42+q*3),pal.cyan,2.2,.6);break}
  case'prism':for(let k=0;k<3+Math.min(3,e);k++)tri(ctx,x+Math.cos(k*TAU/6)*(25+q),y+Math.sin(k*TAU/6)*(25+q),4,pal.cyan,k);break;
  case'nova':ring(ctx,x,y,28+q*2,pal.cyan,.22+e*.08,2+e);break;
  case'arc':line(ctx,x-16,y-14,x-23-q*2,y-31-q,pal.cyan,1.6);line(ctx,x+16,y-14,x+23+q*2,y-31-q,pal.cyan,1.6);break;
  case'orbit':for(let k=0;k<Math.min(12,3+Math.floor(q));k++){const a=time*2+k*TAU/Math.min(12,3+Math.floor(q));tri(ctx,x+Math.cos(a)*(47+q*3),y+Math.sin(a)*(47+q*3),5+e*2,pal.cyan,a+Math.PI/2)}break;
  case'launchblade':tri(ctx,x-34,y+9,8+q*.8,pal.white,-.6);break;
  case'slash':line(ctx,x-28,y-25,x-8,y-5,pal.cyan,3);line(ctx,x+28,y-25,x+8,y-5,pal.cyan,3);break;
  case'drill':{ctx.save();ctx.translate(x+31,y+12);ctx.rotate(Math.PI/2);tri(ctx,0,0,8+q,pal.gold,0);ctx.restore();break}
  case'ram':box(ctx,x,y+25,34+q*2,8,pal.gold);break;
  case'missile':for(let k=0;k<Math.min(6,2+Math.floor(q/2));k++){box(ctx,x-28+(k%2)*56,y-20+Math.floor(k/2)*7,7,5,pal.gold)}break;
  case'mortar':for(const sx of[-1,1]){box(ctx,x+sx*(22+q),y+22,8,25+q*2,pal.gold);line(ctx,x+sx*(22+q),y+11,x+sx*(22+q),y-4-q,pal.white,2)}break;
  case'cluster':for(let k=0;k<4;k++)ring(ctx,x+Math.cos(k*TAU/4)*30,y+Math.sin(k*TAU/4)*30,3+e,pal.gold,.7,1.5);break;
  case'mine':for(let k=0;k<3;k++)tri(ctx,x-20+k*20,y+30,4+q*.3,pal.gold,k);break;
  case'plasma':for(const sx of[-1,1])ring(ctx,x+sx*28,y+20,5+q*.4,pal.cyan,.55,2);break;
  case'drone':for(let k=0;k<Math.min(8,1+Math.floor(q));k++){const a=time*.9+k*TAU/Math.min(8,1+Math.floor(q));box(ctx,x+Math.cos(a)*(65+e*5),y+Math.sin(a)*(65+e*5),7+e,7+e,pal.white)}break;
  case'funnels':for(let k=0;k<Math.min(10,2+Math.floor(q));k++){const a=time*.45+k*TAU/Math.min(10,2+Math.floor(q));tri(ctx,x+Math.cos(a)*(78+q*2),y+Math.sin(a)*(78+q*2),4,pal.gold,a)}break;
  case'sentry':box(ctx,x+45,y+34,10+e*3,16+q,pal.cyan);line(ctx,x+45,y+25,x+45,y+10,pal.cyan,2);break;
  case'interceptor':for(let k=0;k<Math.min(6,2+Math.floor(q/2));k++){const a=-time*1.1+k*TAU/6;tri(ctx,x+Math.cos(a)*(70+q),y+Math.sin(a)*(70+q),4,pal.white,a)}break;
  case'barrier':ring(ctx,x,y,39+q*3,branch==='b'?pal.gold:pal.cyan,.2+e*.07,2+e*.5);break;
  case'graviton':for(let k=0;k<2+(branch==='a'?1:0);k++)ring(ctx,x,y,34+q*3+k*7,pal.cyan,.16,1.2);break;
  case'repulsor':for(const sx of[-1,1]){line(ctx,x+sx*14,y+8,x+sx*(31+q),y+8,pal.white,2);tri(ctx,x+sx*(34+q),y+8,4,pal.cyan,sx>0?Math.PI/2:-Math.PI/2)}break;
  case'mark':ring(ctx,x,y,25+q,pal.gold,.45,1.2);for(let k=0;k<4;k++){const a=k*TAU/4;line(ctx,x+Math.cos(a)*(20+q),y+Math.sin(a)*(20+q),x+Math.cos(a)*(28+q),y+Math.sin(a)*(28+q),pal.gold,1.2)}break;
  case'death':ring(ctx,x,y,18+q*2,'#c05cff',.35+e*.05,2);for(let k=0;k<Math.min(6,Math.floor(q));k++)tri(ctx,x+Math.cos(k*TAU/6)*23,y+Math.sin(k*TAU/6)*23,3,'#c05cff',k);break;
  case'temporal':for(let k=0;k<3+e;k++)ring(ctx,x,y,31+q*2+k*6,'#9fd7ff',.12+k*.04,1.2);line(ctx,x-20-q,y,x+20+q,y,'#9fd7ff',1.2,.4);break;
 }
 ctx.restore()}
export function drawArsenalHardpoints(ctx,p,time,pal){if(!p?.arsenal)return;for(const id of Object.keys(p.arsenal))familyHardware(ctx,p,id,time,pal);const primary=p.primaryConfiguration;if(primary){ctx.save();ctx.globalAlpha=.18+.06*Math.sin(time*3);ctx.strokeStyle=primary==='broken-heaven'?'#d58cff':pal.gold;ctx.lineWidth=2;ctx.setLineDash([6,7]);ctx.beginPath();ctx.arc(p.x,p.y,92+Math.sin(time*2)*4,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.restore()}}
export function frameHardwareSummary(p){const out={installed:0,heavy:0,evolved:0,exotic:0};for(const [id,s] of Object.entries(p?.arsenal||{})){if((s.tier||0)>0){out.installed++;if((s.tier||0)>=5)out.heavy++;if(s.branch)out.evolved++;if(id==='death'||id==='temporal')out.exotic++}}return out}
