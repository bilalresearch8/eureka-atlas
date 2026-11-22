'use strict';
// v23: cache verified same-origin shell resources only. Absent assets must not
// break service-worker installation, and JS/CSS requests must never get HTML.
const CACHE='eureka-atlas-v23-20261122-shell';
const SHELL=[
  './index.html','./benchmark-lab.css','./benchmark-fallback.js','./benchmark-lab.js',
  './benchmark-targets.css','./benchmark-targets.js','./scaleup-studio.css',
  './scaleup-studio.js','./evidence-explorer.css','./evidence-explorer.js',
  './evidence-audit.css','./evidence-audit.js','./manifest.webmanifest',
  './assets/icons/eureka-atlas.svg'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(async cache=>{
    await Promise.all(SHELL.map(async url=>{
      try{await cache.add(url);}
      catch(error){if(url==='./index.html')throw error;}
    }));
    await self.skipWaiting();
  }));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(k=>k.startsWith('eureka-atlas-')&&k!==CACHE).map(k=>caches.delete(k))
  )).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;
  event.respondWith(fetch(req).then(res=>{
    if(res&&res.ok&&res.type!=='opaque'){
      const copy=res.clone();
      caches.open(CACHE).then(cache=>cache.put(req,copy)).catch(()=>{});
    }
    return res;
  }).catch(async()=>{
    const saved=await caches.match(req);
    if(saved)return saved;
    if(req.mode==='navigate')return await caches.match('./index.html')||Response.error();
    return Response.error();
  }));
});
