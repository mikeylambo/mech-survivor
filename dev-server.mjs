import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('./public/',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
createServer(async(req,res)=>{
  try{
    const requestPath=decodeURIComponent((req.url||'/').split('?')[0]);
    const relative=normalize(requestPath==='/'?'index.html':requestPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const file=join(root,relative);
    if(!file.startsWith(root))throw new Error('Invalid path');
    const body=await readFile(file);
    res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'}).end(body);
  }catch{res.writeHead(404).end('Not found')}
}).listen(4173,()=>console.log('Mech Survivor ready at http://localhost:4173'));
