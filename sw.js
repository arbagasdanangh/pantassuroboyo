const V='pantas-v3-2',SHELL=['/','/assets/app.css','/assets/common.js','/icon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
 if(u.pathname.startsWith('/api/auth')||u.pathname==='/admin'||u.pathname==='/admin.html')return;
 /* file milik sendiri: jaringan dulu, cache hanya saat offline */
 if(u.origin===location.origin){e.respondWith(fetch(r).then(x=>{if(x.ok){const c=x.clone();caches.open(V).then(h=>h.put(r,c))}return x}).catch(()=>caches.match(r).then(m=>m||caches.match('/'))));return}
 /* pustaka CDN: ambil ulang dengan CORS agar hanya respons sukses (ok) yang disimpan; respons gagal/opaque tidak pernah di-cache */
 e.respondWith(caches.match(r.url).then(m=>m||fetch(new Request(r.url,{mode:'cors',credentials:'omit'})).then(x=>{if(x.ok){const c=x.clone();caches.open(V).then(h=>h.put(r.url,c))}return x}).catch(()=>fetch(r))))});
