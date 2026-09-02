import fs from 'node:fs';
const path='public/game.js';
let s=fs.readFileSync(path,'utf8');
const bad="function draw(){ctx.save();if(shake)ctx.translate(rand(-shake,shake),rand(-shake,shake));drawArena();ctx.save();ctx.translate(W/2-player.x,H/2-player.y);for(const c of caches){c.spin+=dt*3;if(dist2(c,player)<(c.r+player.r+8)**2)openCache(c)}caches=caches.filter(c=>!c.dead);\n for(const c of caches){ctx.save";
const good="function draw(){ctx.save();if(shake)ctx.translate(rand(-shake,shake),rand(-shake,shake));drawArena();ctx.save();ctx.translate(W/2-player.x,H/2-player.y);\n for(const c of caches){ctx.save";
if(s.includes(bad))s=s.replace(bad,good);else if(!s.includes(good))throw new Error('post-fix: cache draw seam not found');
fs.writeFileSync(path,s);
console.log('post-fix: removed cache update work from draw loop');
