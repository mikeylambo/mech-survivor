const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function poly(ctx,x,y,r,n,rot=0){ctx.beginPath();for(let i=0;i<n;i++){const a=rot+i*TAU/n;ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}ctx.closePath()}
function mirrored(ctx,fn){for(const side of[-1,1]){ctx.save();ctx.scale(side,1);fn(side);ctx.restore()}}
function blade(ctx,x,y,len,width,p,rot=0){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.fillStyle=p.white;ctx.strokeStyle=p.blue;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(0,-len*.55);ctx.lineTo(width,-len*.12);ctx.lineTo(width*.55,len*.38);ctx.lineTo(0,len*.58);ctx.lineTo(-width*.55,len*.38);ctx.lineTo(-width,-len*.12);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=p.gold;ctx.fillRect(-1.5,-len*.22,3,len*.45);ctx.restore()}
function ring(ctx,r,p,alpha=.38,width=1.2,spin=0,segments=8){ctx.save();ctx.rotate(spin);ctx.globalAlpha=alpha;ctx.strokeStyle=p.cyan;ctx.lineWidth=width;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();for(let i=0;i<segments;i++){const a=i*TAU/segments;ctx.beginPath();ctx.moveTo(Math.cos(a)*(r-5),Math.sin(a)*(r-5));ctx.lineTo(Math.cos(a)*(r+5),Math.sin(a)*(r+5));ctx.stroke()}ctx.restore()}
export function frameVisualGenome(player){const m=player.modules||{};return{tier:Math.max(...Object.values(m),1),core:1+(m.reactor||0),halo:(m.reactor||0)+(m.drone||0)+(m.magnet||0),wings:(m.thruster||0)+(m.orbit||0),armor:m.armor||0,rails:m.beam||0,missiles:m.missile||0,drones:m.drone||0,blades:m.orbit||0,pulse:m.pulse||0,arc:m.arc||0,mines:m.mine||0,ascended:(m.reactor>=5||m.thruster>=5||m.armor>=5||m.orbit>=5)}}
export function drawCelestialFrame(ctx,p,time,move,palette,drones=[]){
 const mods=p.modules||{},g=frameVisualGenome(p),x=p.x,y=p.y,quant=Math.PI/12,aim=Math.round(Math.atan2(move?.y||-1,move?.x||0)/quant)*quant+Math.PI/2,boost=p.dashTime>0;
 ctx.save();ctx.translate(x,y);ctx.rotate(aim);
 // Sacred construction field: radial, quantized and deliberately more ordered as the build grows.
 if(g.halo){ring(ctx,31+Math.min(18,g.halo*1.8),palette,.22,1,time*.13,6+Math.min(6,g.core));if(g.core>=5)ring(ctx,43,palette,.16,1,time*-.2,12)}
 if(g.ascended){ctx.save();ctx.globalAlpha=.09;ctx.fillStyle=palette.cyan;poly(ctx,0,0,55,8,Math.PI/8+time*.04);ctx.fill();ctx.restore()}
 // Rear wing/thruster hardpoints.
 if(g.wings||g.drones){const pairs=mods.thruster>=5?2:1;for(let pair=0;pair<pairs;pair++)mirrored(ctx,()=>{const sx=15+pair*8,sy=13+pair*5,len=24+mods.thruster*3-pair*5;ctx.save();ctx.translate(sx,sy);ctx.rotate(.48+pair*.24);blade(ctx,0,0,len,5+mods.thruster*.45,palette,0);ctx.fillStyle=palette.blue;ctx.shadowColor=palette.cyan;ctx.shadowBlur=boost?24:13;ctx.beginPath();ctx.moveTo(-3,len*.45);ctx.lineTo(0,len*(boost?1.15:.82));ctx.lineTo(3,len*.45);ctx.closePath();ctx.fill();ctx.restore()})}
 // Lower locomotion vanes keep a readable front/back orientation in the top-down camera.
 mirrored(ctx,()=>{ctx.fillStyle=palette.navy;ctx.strokeStyle=palette.blue;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(8,8);ctx.lineTo(19,15);ctx.lineTo(14,27);ctx.lineTo(5,18);ctx.closePath();ctx.fill();ctx.stroke();if(mods.thruster){ctx.fillStyle=palette.cyan;ctx.shadowColor=palette.blue;ctx.shadowBlur=10;ctx.fillRect(12,18,3,7+mods.thruster*2);ctx.shadowBlur=0}});
 // Central chassis: stacked diamonds/plates instead of one polygon.
 ctx.fillStyle=palette.navy;ctx.strokeStyle=palette.blue;ctx.lineWidth=2;poly(ctx,0,3,21+Math.min(5,g.armor),6,Math.PI/6);ctx.fill();ctx.stroke();
 ctx.fillStyle='#c9d7e3';poly(ctx,0,2,15+Math.min(4,g.armor),5,-Math.PI/2);ctx.fill();ctx.strokeStyle=palette.white;ctx.lineWidth=1;ctx.stroke();
 // Shoulder armor grows into a cathedral-like silhouette.
 if(g.armor)mirrored(ctx,()=>{ctx.fillStyle=palette.white;ctx.strokeStyle=palette.gold;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(11,-7);ctx.lineTo(20+g.armor*2,-11-g.armor);ctx.lineTo(25+g.armor*2,2);ctx.lineTo(16,9);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=palette.gold;ctx.fillRect(17,-5,3,9);if(g.armor>=5){ctx.beginPath();ctx.moveTo(22,-11);ctx.lineTo(31,-23);ctx.lineTo(29,-5);ctx.closePath();ctx.fill()}});
 // Reactor / faceplate stack.
 ctx.fillStyle=palette.white;poly(ctx,0,-8,12,5,-Math.PI/2);ctx.fill();ctx.fillStyle=palette.blue;ctx.shadowColor=palette.cyan;ctx.shadowBlur=13+mods.reactor*3;poly(ctx,0,-7,5+mods.reactor*.8,4,Math.PI/4);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle=palette.gold;ctx.fillRect(-2,-21,4,9+(mods.reactor>=5?5:0));
 if(mods.reactor>=3){ctx.strokeStyle=palette.gold;ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(0,-7,10+mods.reactor,Math.PI,TAU);ctx.stroke()}
 // Rail hardpoints. Tier four makes the silhouette bilateral; final tier extends the barrels.
 if(g.rails){const sides=g.rails>=4?[-1,1]:[1];for(const side of sides){ctx.save();ctx.scale(side,1);ctx.translate(14,-5);ctx.fillStyle='#dce8f2';ctx.strokeStyle=palette.blue;ctx.lineWidth=1.1;ctx.fillRect(0,-4,17+g.rails*2.8,8);ctx.strokeRect(0,-4,17+g.rails*2.8,8);ctx.fillStyle=palette.cyan;ctx.fillRect(8,-1.4,14+g.rails*2.6,2.8);if(g.rails>=6){ctx.fillStyle=palette.gold;ctx.fillRect(8,-5,2,10);ctx.fillRect(18,-5,2,10)}ctx.restore()}}
 // Missile reliquaries are symmetrical from their first tier.
 if(g.missiles)mirrored(ctx,()=>{const h=12+g.missiles*2;ctx.fillStyle=palette.white;ctx.strokeStyle=palette.gold;ctx.lineWidth=1;ctx.fillRect(21+g.armor,-19,10,h);ctx.strokeRect(21+g.armor,-19,10,h);ctx.fillStyle=palette.navy;for(let k=0;k<Math.min(5,g.missiles+1);k++){ctx.beginPath();ctx.arc(26+g.armor,-15+k*3,1.35,0,TAU);ctx.fill()}});
 // Arc conductors, pulse geometry and mine sockets surface otherwise invisible upgrade families.
 if(g.arc)mirrored(ctx,()=>{ctx.strokeStyle=palette.cyan;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(10,-13);ctx.lineTo(14+g.arc*2,-24-g.arc);ctx.stroke();ctx.fillStyle=palette.cyan;poly(ctx,14+g.arc*2,-24-g.arc,3+g.arc*.25,4,Math.PI/4);ctx.fill()});
 if(g.pulse){ctx.globalAlpha=.16+.025*g.pulse;ctx.strokeStyle=palette.cyan;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,1,24+g.pulse*3+Math.sin(time*3)*2,0,TAU);ctx.stroke();ctx.globalAlpha=1}
 if(g.mines)mirrored(ctx,()=>{ctx.fillStyle=palette.gold;poly(ctx,10,17,3+g.mines*.5,6,0);ctx.fill()});
 ctx.restore();
 // Orbitals remain in world orientation to read as a separate radial weapon layer.
 if(g.blades){const count=2+g.blades+(g.blades>=5?2:0);for(let i=0;i<count;i++){const a=time*2.2+i*TAU/count,r=48+g.blades*7,xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r;ctx.save();ctx.translate(xx,yy);ctx.rotate(a+Math.PI/2);ctx.fillStyle=palette.cyan;ctx.shadowBlur=15;ctx.shadowColor=palette.blue;poly(ctx,0,0,10+g.blades,3,0);ctx.fill();ctx.fillStyle=palette.white;poly(ctx,0,0,5+g.blades*.4,3,0);ctx.fill();ctx.restore()}}
 // Drones become a rotating halo network at high tier.
 for(let i=0;i<drones.length;i++){const d=drones[i];ctx.save();ctx.translate(d.x,d.y);ctx.rotate(time*(g.drones>=5?2.2:1.2)+i);ctx.fillStyle=palette.white;ctx.shadowBlur=12;ctx.shadowColor=palette.blue;poly(ctx,0,0,8+(g.drones>=5?2:0),4,Math.PI/4);ctx.fill();ctx.fillStyle=palette.blue;poly(ctx,0,0,4,4,Math.PI/4);ctx.fill();ctx.fillStyle=palette.gold;ctx.fillRect(-1,-10,2,5);ctx.restore()}
}
