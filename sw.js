const V='tanaoroshi-v1';
const CORE=['./','index.html','master.json','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const keyOf=u=>{const k=new URL(u);k.search='';return k.href};
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const same=new URL(r.url).origin===location.origin;
  e.respondWith((async()=>{
    const c=await caches.open(V);
    if(same){ // 自分のファイル: ネット優先、オフライン時はキャッシュ
      try{const res=await fetch(r);if(res.ok)c.put(keyOf(r.url),res.clone());return res}
      catch(_){return (await c.match(keyOf(r.url)))||(await c.match('index.html'))}
    }
    // 外部ライブラリ(読み取り・OCR用): キャッシュ優先
    const hit=await c.match(r);if(hit)return hit;
    const res=await fetch(r);if(res.ok||res.type==='opaque')c.put(r,res.clone());return res;
  })());
});
