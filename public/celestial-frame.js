const TAU=Math.PI*2;
function poly(ctx,x,y,r,n,rot=0){ctx.beginPath();for(let i=0;i<n;i++){const a=rot+i*TAU/n;ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}ctx.closePath()}
export function drawCelestialFrame(ctx,p,time,move,palette,drones=[]){
 const mods=p.modules||{},x=p.x,y=p.y,strict=Math.PI/12;ctx.save();ctx.translate(x,y);ctx.rotate(Math.round((move?.x||0)*.12/strict)*strict);
 const wing=mods.thruster||mods.drone||mods.orbit;ctx.globalAlpha=.2;ctx.strokeStyle=palette.cyan;ctx.lineWidth=1;
 if(wing){ctx.beginPath();ctx.arc(0,0,34+mods.thruster*5,0,TAU);ctx.stroke();for(let i=0;i<4+mods.reactor;i++){const a=i*TAU/(4+mods.reactor)+time*.25;ctx.beginPath();ctx.moveTo(Math.cos(a)*18,Math.sin(a)*18);ctx.lineTo(Math.cos(a)*(42+mods.thruster*4),Math.sin(a)*(42+mods.thruster*4));ctx.stroke()}}
 ctx.globalAlpha=1;
 if(mods.thruster){for(const sx of[-1,1]){ctx.save();ctx.scale(sx,1);ctx.fillStyle=palette.white;poly(ctx,18+mods.thruster*2,9,10+mods.thruster*1.7,3,0);ctx.fill();ctx.fillStyle=palette.blue;ctx.shadowBlur=18;ctx.shadowColor=palette.cyan;poly(ctx,25+mods.thruster*3,16,6+mods.thruster,3,Math.PI/2);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(22+mods.thruster*3,19,4,10+mods.thruster*4);ctx.restore()}}
 ctx.shadowBlur=0;ctx.fillStyle=palette.navy;poly(ctx,0,4,21,6,Math.PI/6);ctx.fill();ctx.strokeStyle=palette.blue;ctx.lineWidth=2;ctx.stroke();
 if(mods.armor){ctx.fillStyle=palette.white;for(const sx of[-1,1]){ctx.save();ctx.scale(sx,1);poly(ctx,20+mods.armor,0,10+mods.armor,4,Math.PI/4);ctx.fill();ctx.fillStyle=palette.gold;ctx.fillRect(18+mods.armor,-5,4,10);ctx.restore()}ctx.fillStyle='#c9d7e3';poly(ctx,0,7,15+mods.armor,5,-Math.PI/2);ctx.fill()}
 ctx.fillStyle=palette.white;poly(ctx,0,-7,13,5,-Math.PI/2);ctx.fill();ctx.fillStyle=palette.blue;poly(ctx,0,-8,6+mods.reactor,4,Math.PI/4);ctx.shadowBlur=14;ctx.shadowColor=palette.cyan;ctx.fill();ctx.shadowBlur=0;ctx.fillStyle=palette.gold;ctx.fillRect(-2,-18,4,7);
 if(mods.beam){for(const sx of(mods.beam>=4?[-1,1]:[1])){ctx.save();ctx.scale(sx,1);ctx.fillStyle='#cbd9e6';ctx.fillRect(13,-9,16+mods.beam*3,7);ctx.fillStyle=palette.blue;ctx.fillRect(21,-7,10+mods.beam*3,2);ctx.restore()}}
 if(mods.missile){for(const sx of[-1,1]){ctx.save();ctx.scale(sx,1);ctx.fillStyle=palette.white;ctx.fillRect(21+mods.armor*2,-22,10,13+mods.missile*2);ctx.fillStyle=palette.navy;for(let k=0;k<mods.missile;k++){ctx.beginPath();ctx.arc(26+mods.armor*2,-18+k*3,1.5,0,TAU);ctx.fill()}ctx.restore()}}ctx.restore();
 if(mods.orbit){const count=2+mods.orbit+(mods.orbit>=5?2:0);for(let i=0;i<count;i++){const a=time*2.2+i*TAU/count,r=48+mods.orbit*7,xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r;ctx.save();ctx.translate(xx,yy);ctx.rotate(a+Math.PI/2);ctx.fillStyle=palette.cyan;ctx.shadowBlur=15;ctx.shadowColor=palette.blue;poly(ctx,0,0,10+mods.orbit,3,0);ctx.fill();ctx.restore()}}
 for(const d of drones){ctx.fillStyle=palette.white;ctx.shadowBlur=12;ctx.shadowColor=palette.blue;poly(ctx,d.x,d.y,8,4,Math.PI/4);ctx.fill();ctx.fillStyle=palette.blue;poly(ctx,d.x,d.y,4,4,Math.PI/4);ctx.fill();ctx.shadowBlur=0}
}
