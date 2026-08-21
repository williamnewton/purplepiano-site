const http=require('http'),fs=require('fs'),path=require('path');
const root='/Users/williamnewton/Documents/GitHub/purple-piano-site';
const types={'.html':'text/html','.css':'text/css','.xml':'application/xml','.txt':'text/plain','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]);
  if(p==='/')p='/index.html';
  let f=path.join(root,p);
  if(!fs.existsSync(f)&&fs.existsSync(f+'.html'))f=f+'.html';
  if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('404');}
  res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});
  fs.createReadStream(f).pipe(res);
}).listen(4321,()=>console.log('serving 4321'));
