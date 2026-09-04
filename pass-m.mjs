import fs from 'node:fs';
const path='public/retention.js';let s=fs.readFileSync(path,'utf8');
const from="KEY='mech-survivor-retention-v2'",to="KEY='mech-survivor-retention-v1'";
if(s.includes(from))s=s.replace(from,to);else if(!s.includes(to))throw new Error('pass-m: retention key seam missing');
fs.writeFileSync(path,s);console.log('pass-m: preserved retention v1 save compatibility');
