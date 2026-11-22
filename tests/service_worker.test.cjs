'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'sw.js'),'utf8');
new vm.Script(source,{filename:'sw.js'});
const handlers={};
const cacheMap=new Map();
const cached={add:async url=>{cacheMap.set(url,{ok:true,url});},put:async(req,res)=>{cacheMap.set(req.url,res);}};
const ctx={
 self:{addEventListener:(type,fn)=>{handlers[type]=fn;},skipWaiting:()=>{},clients:{claim:()=>{}}},
 caches:{open:async()=>cached,keys:async()=>[],delete:async()=>true,match:async req=>cacheMap.get(typeof req==='string'?req:req.url)},
 fetch:async req=>{if(String(req.url).includes('offline'))throw Error('offline');return {ok:true,type:'basic',url:req.url,clone(){return this;}};},
 location:{origin:'https://example.org'},URL,Response:{error:()=>({error:true})}
};
vm.runInNewContext(source+'\nglobalThis.shell=SHELL;',ctx);
(async()=>{
 const shell=ctx.shell;
 for(const relative of shell){assert.ok(fs.existsSync(path.join(root,relative.replace(/^\.\//,''))),'missing precache resource '+relative);}
 let install;
 handlers.install({waitUntil:p=>{install=p;}});
 await install;
 assert.ok(cacheMap.has('./index.html'),'shell index cached');
 function call(request){let response;handlers.fetch({request,respondWith:p=>{response=p;}});return response;}
 const page=await call({method:'GET',url:'https://example.org/offline-page',mode:'navigate'});
 assert.equal(page.url,'./index.html','offline navigation uses shell document');
 const js=await call({method:'GET',url:'https://example.org/offline-script.js',mode:'no-cors'});
 assert.equal(js.error,true,'offline JS never receives HTML shell');
 await call({method:'GET',url:'https://example.org/online-script.js',mode:'no-cors'});
 assert.ok(cacheMap.has('https://example.org/online-script.js'),'working same-origin script cached');
 const notFound=await call({method:'GET',url:'https://another.org/offline-script.js',mode:'navigate'});
 assert.equal(notFound,undefined,'cross-origin requests are not intercepted');
 console.log('PASS: every precached resource exists; offline navigations and scripts have safe separate fallbacks.');
})().catch(e=>{console.error(e);process.exitCode=1;});
