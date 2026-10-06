const V='tanaoroshi-v3';
const CORE=['./','index.html','master.json','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>e.waitUntil((async()=>{
  const c=await caches.open(V);
  await Promise.allSettled(CORE.map(u=>c.add(new Request(u,{cache:'reload'}))));
  await self.skipWaiting();
})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  for(const k of await caches.keys())if(k!==V)await caches.delete(k);
  await self.clients.claim();
})()));
const keyOf=u=>{const k=new URL(u);k.search='';return k.href};
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const same=new URL(r.url).origin===location.origin;
  e.respondWith((async()=>{
    const c=await caches.open(V);
    if(same){
      // 自分のファイル: 常にサーバーに最新確認(ブラウザの古いキャッシュを使わない)。遅い/オフラインならキャッシュ。
      const p=fetch(r.url,{cache:'no-cache'});
      try{
        const res=await Promise.race([p,new Promise((_,j)=>setTimeout(()=>j(new Error('timeout')),8000))]);
        if(res.ok){c.put(keyOf(r.url),res.clone());return res}
        const old=await c.match(keyOf(r.url));return old||res;
      }catch(_){
        const old=await c.match(keyOf(r.url));
        if(old)return old;
        return p;
      }
    }
    // 外部ライブラリ(読み取り・OCR): キャッシュ優先
    const hit=await c.match(r);if(hit)return hit;
    const res=await fetch(r);if(res.ok||res.type==='opaque')c.put(r,res.clone());return res;
  })());
});
