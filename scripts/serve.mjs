import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist'),types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
http.createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost');const file=path.resolve(root,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));if(!file.startsWith(root+path.sep))throw Error();const body=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(body)}catch{res.writeHead(404);res.end('Not found')}}).listen(5173,'127.0.0.1',()=>console.log('omoi log: http://localhost:5173'));
