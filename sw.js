/* Promo Salon Bois — app installable. Le réseau d'abord (toujours la dernière version) ; la copie gardée ne sert que sans connexion.
   Seules les pages de l'app sont gardées : les échanges avec la base ne passent jamais par ici. */
const C='psb-v1';
self.addEventListener('install',()=>{self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==C)await caches.delete(k);await self.clients.claim();})());});
self.addEventListener('fetch',e=>{const r=e.request;let u;try{u=new URL(r.url);}catch(x){return;}
  if(r.method!=='GET'||u.origin!==self.location.origin)return;
  e.respondWith((async()=>{const c=await caches.open(C);
    try{const n=await fetch(r);if(n&&n.ok&&n.type==='basic')c.put(r,n.clone()).catch(()=>{});return n;}
    catch(err){const nav=r.mode==='navigate',m=await c.match(r,{ignoreSearch:nav})||(nav?await c.match('./',{ignoreSearch:true}):null);if(m)return m;throw err;}})());});
