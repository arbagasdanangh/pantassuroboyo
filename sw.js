const V='pantas-v3-1',SHELL=['/','/assets/app.css','/assets/common.js','/icon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
 if(u.pathname.startsWith('/api/auth')||u.pathname==='/admin'||u.pathname==='/admin.html')return;
 /* file milik sendiri (halaman, API, JS, CSS): jaringan dulu, cache hanya saat offline */
 if(u.origin===location.origin){e.respondWith(fetch(r).then(x=>{if(x.ok){const c=x.clone();caches.open(V).then(h=>h.put(r,c))}return x}).catch(()=>caches.match(r).then(m=>m||caches.match('/'))));return}
 /* pustaka CDN: cache dulu, perbarui di belakang */
 e.respondWith(caches.match(r).then(m=>{const n=fetch(r).then(x=>{if(x.ok||x.type==='opaque'){const c=x.clone();caches.open(V).then(h=>h.put(r,c))}return x}).catch(()=>m);return m||n}))});
