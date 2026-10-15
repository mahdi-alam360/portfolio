import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {handleModel} from './handler.mjs';
const port=Number(process.env.PORT||8765);
createServer(async(req,res)=>{
  try{
    if(req.url==='/api/model-lab'){
      let body=''; for await(const chunk of req){body+=chunk;if(body.length>2048){res.writeHead(413);res.end();return;}}
      const response=await handleModel(new Request(`http://localhost:${port}${req.url}`,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body}:{} )}));
      res.writeHead(response.status,Object.fromEntries(response.headers)); res.end(await response.text());
    }else if(req.url==='/'||req.url==='/model-lab/'){
      res.writeHead(200,{'content-type':'text/html'});res.end(await readFile(new URL('./wwwroot/index.html',import.meta.url)));
    }else{res.writeHead(404);res.end();}
  }catch{res.writeHead(500);res.end('Internal error');}
}).listen(port,'127.0.0.1',()=>console.log(`Model Lab http://127.0.0.1:${port}/model-lab/`));
