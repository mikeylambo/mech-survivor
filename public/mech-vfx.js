export function registerMechVFX(fx,palette){
  const C={cyan:palette.cyan||'#78e7ff',blue:palette.blue||'#168fff',gold:palette.gold||'#d6ae52',red:palette.red||'#ff4664',white:palette.white||'#eaf7ff'};

  fx.define('burst',{modules:[{type:'particles',count:'$count',omni:true,speedMin:35,speedMax:190,lifeMin:.16,lifeMax:.5,sizeMin:1,sizeMax:4,drag:4,color:'$color',shape:'streak',stretch:3}]});

  fx.define('mech.dash',{modules:[{type:'flash',life:.12,r0:5,r1:34,color:C.cyan,alpha:.75},{type:'ring',life:.22,r0:8,r1:48,width0:4,width1:.7,color:C.cyan,alpha:.8},{type:'streak',count:9,life:.18,length:62,width:2.5,spread:.16,offset:15,color:C.cyan,alpha:.9},{type:'particles',count:10,spread:.55,speedMin:80,speedMax:230,lifeMin:.12,lifeMax:.28,sizeMin:1,sizeMax:3,drag:6,color:C.white,shape:'streak',stretch:5},{type:'camera',strength:4}]});

  fx.define('mech.muzzle',{modules:[{type:'flash',life:.08,r0:2,r1:24,color:C.white,alpha:1},{type:'ring',life:.12,r0:3,r1:22,width0:3,width1:.5,color:C.cyan,alpha:.9},{type:'particles',count:5,spread:.38,speedMin:130,speedMax:300,lifeMin:.08,lifeMax:.18,sizeMin:1,sizeMax:2.6,drag:8,color:C.cyan,shape:'streak',stretch:6}]});

  fx.define('mech.railFire',{modules:[{type:'flash',life:.09,r0:3,r1:34,color:C.white,alpha:1},{type:'streak',count:4,life:.11,length:96,width:3.2,spread:.035,offset:5,color:C.cyan,alpha:1},{type:'streak',count:2,life:.15,length:128,width:1.4,spread:.02,offset:2,color:C.white,alpha:.9},{type:'particles',count:8,spread:.22,speedMin:180,speedMax:420,lifeMin:.08,lifeMax:.2,sizeMin:1,sizeMax:2.5,drag:9,color:C.cyan,shape:'streak',stretch:8},{type:'camera',strength:2.8}]});

  fx.define('mech.bladeSlash',{modules:[{type:'arc',life:.16,radius:54,span:1.7,width:8,color:C.cyan,alpha:1},{type:'arc',at:.035,life:.13,radius:61,span:1.45,width:3,color:C.white,alpha:.8},{type:'particles',count:9,spread:.5,speedMin:120,speedMax:320,lifeMin:.08,lifeMax:.22,sizeMin:1,sizeMax:2.6,drag:7,color:C.cyan,shape:'streak',stretch:7}]});

  fx.define('mech.missileLaunch',{modules:[{type:'flash',life:.1,r0:2,r1:19,color:C.gold,alpha:.8},{type:'streak',count:6,life:.2,length:54,width:2.4,spread:.3,offset:8,color:C.gold,alpha:.75},{type:'particles',count:12,spread:.65,speedMin:70,speedMax:220,lifeMin:.16,lifeMax:.4,sizeMin:1,sizeMax:3.4,drag:5,color:C.white,shape:'streak',stretch:5}]});

  fx.define('mech.impact',{modules:[{type:'flash',life:.1,r0:2,r1:26,color:'$color',alpha:.9},{type:'ring',life:.18,r0:4,r1:34,width0:3.5,width1:.6,color:'$color',alpha:.85},{type:'particles',count:10,omni:true,speedMin:75,speedMax:260,lifeMin:.1,lifeMax:.3,sizeMin:1,sizeMax:3.2,drag:5,color:'$color',shape:'streak',stretch:5}]});

  fx.define('mech.enemyDeath',{modules:[{type:'flash',life:.13,r0:4,r1:30,color:C.blue,alpha:.65},{type:'ring',life:.24,r0:6,r1:40,width0:3,width1:.5,color:C.cyan,alpha:.65},{type:'particles',count:13,omni:true,speedMin:65,speedMax:250,lifeMin:.16,lifeMax:.42,sizeMin:1,sizeMax:3.5,drag:4,color:C.blue,shape:'streak',stretch:5}]});

  fx.define('mech.eliteDeath',{modules:[{type:'flash',life:.2,r0:5,r1:48,color:C.gold,alpha:.85},{type:'ring',life:.28,r0:8,r1:62,width0:5,width1:.8,color:C.gold,alpha:.9},{type:'ring',at:.07,life:.32,r0:6,r1:84,width0:3,width1:.5,color:C.cyan,alpha:.65},{type:'particles',count:25,omni:true,speedMin:80,speedMax:330,lifeMin:.18,lifeMax:.55,sizeMin:1,sizeMax:4,drag:3.7,color:C.gold,shape:'streak',stretch:6},{type:'camera',strength:5}]});

  fx.define('mech.bossDeath',{modules:[{type:'screenFlash',amount:.42,color:C.white},{type:'flash',life:.34,r0:10,r1:105,color:C.gold,alpha:1},{type:'ring',life:.42,r0:12,r1:115,width0:8,width1:1,color:C.gold,alpha:1},{type:'ring',at:.08,life:.5,r0:15,r1:155,width0:6,width1:.8,color:C.cyan,alpha:.82},{type:'ring',at:.16,life:.56,r0:20,r1:205,width0:4,width1:.5,color:C.white,alpha:.6},{type:'particles',count:48,omni:true,speedMin:110,speedMax:430,lifeMin:.28,lifeMax:.85,sizeMin:1.5,sizeMax:5,drag:2.8,color:C.gold,shape:'streak',stretch:8},{type:'camera',strength:12}]});

  fx.define('mech.novaPulse',{modules:[{type:'screenFlash',amount:.08,color:C.cyan},{type:'flash',life:.24,r0:16,r1:72,color:C.cyan,alpha:.8},{type:'ring',life:.46,r0:20,r1:'$radius',width0:12,width1:1.2,color:C.cyan,alpha:1},{type:'ring',at:.055,life:.4,r0:15,r1:'$radius',width0:4,width1:.5,color:C.white,alpha:.7},{type:'ring',at:.1,life:.48,r0:24,r1:'$radius',width0:2,width1:.35,color:C.blue,alpha:.55},{type:'particles',count:30,omni:true,speedMin:90,speedMax:310,lifeMin:.15,lifeMax:.46,sizeMin:1,sizeMax:3.4,drag:4,color:C.cyan,shape:'streak',stretch:7},{type:'camera',strength:7}]});

  fx.define('mech.missileImpact',{modules:[{type:'flash',life:.16,r0:4,r1:42,color:C.gold,alpha:.9},{type:'ring',life:.26,r0:8,r1:58,width0:5,width1:.8,color:C.gold,alpha:.9},{type:'particles',count:20,omni:true,speedMin:90,speedMax:310,lifeMin:.13,lifeMax:.42,sizeMin:1,sizeMax:4,drag:4,color:C.gold,shape:'streak',stretch:6},{type:'camera',strength:5}]});

  fx.define('mech.mineImpact',{modules:[{type:'flash',life:.16,r0:6,r1:46,color:C.cyan,alpha:.9},{type:'ring',life:.3,r0:10,r1:92,width0:6,width1:.8,color:C.cyan,alpha:.95},{type:'ring',at:.05,life:.28,r0:8,r1:70,width0:3,width1:.5,color:C.white,alpha:.6},{type:'particles',count:24,omni:true,speedMin:80,speedMax:285,lifeMin:.14,lifeMax:.38,sizeMin:1,sizeMax:3.5,drag:4,color:C.cyan,shape:'streak',stretch:6},{type:'camera',strength:6}]});

  fx.define('mech.arcHit',{modules:[{type:'flash',life:.08,r0:2,r1:18,color:C.cyan,alpha:.9},{type:'ring',life:.12,r0:2,r1:24,width0:2.5,width1:.4,color:C.white,alpha:.7},{type:'particles',count:7,omni:true,speedMin:70,speedMax:210,lifeMin:.08,lifeMax:.22,sizeMin:1,sizeMax:2.4,drag:6,color:C.white,shape:'streak',stretch:5}]});

  fx.define('mech.levelUp',{modules:[{type:'screenFlash',amount:.16,color:C.gold},{type:'flash',life:.28,r0:8,r1:70,color:C.gold,alpha:.8},{type:'ring',life:.4,r0:12,r1:92,width0:7,width1:1,color:C.gold,alpha:.9},{type:'ring',at:.08,life:.45,r0:8,r1:122,width0:3,width1:.5,color:C.white,alpha:.6},{type:'particles',count:30,omni:true,speedMin:70,speedMax:290,lifeMin:.2,lifeMax:.6,sizeMin:1,sizeMax:4,drag:3.5,color:C.gold,shape:'streak',stretch:6},{type:'camera',strength:7}]});

  fx.define('mech.playerHit',{modules:[{type:'screenFlash',amount:.18,color:C.red},{type:'flash',life:.12,r0:6,r1:38,color:C.red,alpha:.7},{type:'particles',count:14,omni:true,speedMin:80,speedMax:260,lifeMin:.12,lifeMax:.32,sizeMin:1,sizeMax:3,drag:5,color:C.red,shape:'streak',stretch:5},{type:'camera',strength:8}]});

  return fx;
}
