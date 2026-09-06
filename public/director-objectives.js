const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

export function createSpatialObjective(event,player,{random=Math.random}={}){
 if(!event||event.mechanic==='combat')return null;
 const angle=random()*Math.PI*2;
 const distance=event.mechanic==='extract'?420+random()*140:event.mechanic==='escort'?90:220+random()*120;
 const x=player.x+Math.cos(angle)*distance,y=player.y+Math.sin(angle)*distance;
 const base={mechanic:event.mechanic,x,y,radius:event.mechanic==='defend'?145:120,progress:0,inside:false,failed:false,status:''};
 if(event.mechanic==='defend')return{...base,integrity:100,maxIntegrity:100,status:'RELAY 100%'};
 if(event.mechanic==='escort'){
  const travelAngle=angle+(random()-.5)*1.1,travel=520+random()*180;
  return{...base,x:player.x+Math.cos(angle)*90,y:player.y+Math.sin(angle)*90,radius:155,targetX:player.x+Math.cos(travelAngle)*travel,targetY:player.y+Math.sin(travelAngle)*travel,status:'COURIER WAITING'};
 }
 return base;
}

export function updateSpatialObjective(field,event,player,dt,{nearbyEnemies=()=>[]}={}){
 if(!field||!event||field.failed)return{progress:event?.progress||0,failed:!!field?.failed,status:''};
 field.inside=dist(field,player)<=field.radius;
 if(field.mechanic==='hold'){
  field.progress=clamp(field.progress+(field.inside?dt:-dt*.32),0,event.target);
  field.status=field.inside?'FIELD LOCKED':'RETURN TO FIELD';
 }
 if(field.mechanic==='extract'){
  if(field.inside)field.progress=clamp(field.progress+dt,0,event.target);
  field.status=field.inside?'EXTRACTION LOCKING':'REACH EXTRACTION';
 }
 if(field.mechanic==='defend'){
  const threats=nearbyEnemies(field.x,field.y,field.radius+45).filter(e=>!e.dead);
  const pressure=threats.length*.45+(field.inside?0:1.75);
  field.integrity=clamp(field.integrity-pressure*dt,0,field.maxIntegrity);
  if(field.inside)field.progress=clamp(field.progress+dt,0,event.target);
  field.failed=field.integrity<=0;
  field.status=`RELAY ${Math.ceil(field.integrity)}%${field.inside?' · DEFENDING':' · GET IN RANGE'}`;
 }
 if(field.mechanic==='escort'){
  const close=dist(field,player)<=field.radius;
  field.inside=close;
  if(close){
   const dx=field.targetX-field.x,dy=field.targetY-field.y,len=Math.hypot(dx,dy)||1,speed=62;
   field.x+=dx/len*Math.min(len,speed*dt);field.y+=dy/len*Math.min(len,speed*dt);
   field.progress=clamp(field.progress+dt,0,event.target);
  }
  field.status=close?'COURIER ADVANCING':'RETURN TO COURIER';
 }
 return{progress:field.progress,failed:field.failed,status:field.status,inside:field.inside};
}

export function drawSpatialObjective(ctx,field,event,elapsed,palette={}){
 if(!field||!event)return;
 const cyan=palette.cyan||'#78e7ff',gold=palette.gold||'#d6ae52',red=palette.red||'#ff4664',pulse=.5+.5*Math.sin(elapsed*5);
 ctx.save();ctx.translate(field.x,field.y);
 ctx.globalAlpha=.16+.08*pulse;ctx.fillStyle=field.failed?red:cyan;ctx.beginPath();ctx.arc(0,0,field.radius,0,Math.PI*2);ctx.fill();
 ctx.globalAlpha=.8;ctx.strokeStyle=field.inside?gold:field.failed?red:cyan;ctx.lineWidth=3;ctx.setLineDash([12,9]);ctx.beginPath();ctx.arc(0,0,field.radius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
 ctx.globalAlpha=1;ctx.fillStyle='#071323';ctx.strokeStyle=field.inside?gold:cyan;ctx.lineWidth=2;
 if(field.mechanic==='defend'){ctx.fillRect(-13,-22,26,44);ctx.strokeRect(-13,-22,26,44);ctx.fillStyle=gold;ctx.fillRect(-8,15,16,-32*(field.integrity/field.maxIntegrity))}
 else {ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(13,8);ctx.lineTo(-13,8);ctx.closePath();ctx.fill();ctx.stroke()}
 if(field.mechanic==='escort'){
  const dx=field.targetX-field.x,dy=field.targetY-field.y;ctx.globalAlpha=.45;ctx.strokeStyle=gold;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(dx,dy);ctx.stroke();
 }
 ctx.restore();
}
