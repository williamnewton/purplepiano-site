const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const types={'.html':'text/html','.css':'text/css','.xml':'application/xml','.txt':'text/plain','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
  let p;
  try{p=decodeURIComponent(req.url.split('?')[0]);}catch(e){res.writeHead(400);return res.end('400');}
  if(p==='/')p='/index.html';
  let f=path.resolve(root,'.'+p);
  // Refuse anything that resolves outside the site root (e.g. /..%2f..%2f.ssh/...).
  if(f!==root&&!f.startsWith(root+path.sep)){res.writeHead(403);return res.end('403');}
  if(!fs.existsSync(f)&&fs.existsSync(f+'.html'))f=f+'.html';
  if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('404');}
  res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});
  fs.createReadStream(f).pipe(res);
}).listen(4321,'127.0.0.1',()=>console.log('serving http://127.0.0.1:4321'));
