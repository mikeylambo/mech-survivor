import fs from 'node:fs';
const path='public/arsenal-runtime.js';
let s=fs.readFileSync(path,'utf8');
s=s.replace("const rt=(p,id)=>p._arsenalRt||(p._arsenalRt={}), key=>{};\n",'');
fs.writeFileSync(path,s);
console.log('post-g-fix: arsenal runtime sanitized');
