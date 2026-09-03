import fs from 'node:fs';

const path='public/game.js';
let s=fs.readFileSync(path,'utf8');
const bad="desc:'Thruster harmonics synchronize around the pilot's intent.'";
const good="desc:'Thruster harmonics synchronize around pilot intent.'";
if(s.includes(bad))s=s.replace(bad,good);else if(!s.includes(good))throw new Error('post-d-fix: blessing copy seam not found');
fs.writeFileSync(path,s);
console.log('post-d-fix: sanitized blessing copy');
