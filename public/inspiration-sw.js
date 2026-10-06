// Only the public app shell is cached. Private records and shared text stay in IndexedDB.
const SHELL='design-daily-inspiration-shell-v2';
const scope=self.registration.scope;
const index=new URL('index.html',scope).href;
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(SHELL);
  const response=await fetch(index,{cache:'reload'});
  if(response.ok){await cache.put(index,response.clone());const html=await response.text();const assets=[...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(m=>new URL(m[1],index)).filter(u=>u.origin===new URL(scope).origin&&/\/assets\//.test(u.pathname));const queue=assets.map(u=>u.href),seen=new Set();
    while(queue.length&&seen.size<40){const asset=queue.shift();if(seen.has(asset))continue;seen.add(asset);try{const r=await fetch(asset);if(!r.ok)continue;await cache.put(asset,r.clone());if(new URL(asset).pathname.endsWith('.js')){const code=await r.text();for(const m of code.matchAll(/["'](\.\/[^"']+\.(?:js|css))["']/g)){const dependency=new URL(m[1],asset);if(dependency.origin===new URL(scope).origin&&dependency.pathname.includes('/assets/'))queue.push(dependency.href);}}}catch{}}
}
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('design-daily-inspiration-shell-')&&key!==SHELL)await caches.delete(key);await self.clients.claim();})()));
async function saveDraft(text){return new Promise((resolve,reject)=>{const open=indexedDB.open('design-daily-inspiration-v1',1);open.onupgradeneeded=()=>{open.result.createObjectStore('items',{keyPath:'id'});open.result.createObjectStore('settings');};open.onerror=()=>reject(open.error);open.onsuccess=()=>{const db=open.result;const tx=db.transaction('settings','readwrite');tx.objectStore('settings').put(text,'shared-draft');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};};});}
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method==='POST'&&url.href===new URL('inspiration-share',scope).href){event.respondWith((async()=>{const form=await event.request.formData();const text=[form.get('title'),form.get('text'),form.get('url')].filter(v=>typeof v==='string'&&v).join('\n');if(text.length>2000000)return new Response('This share exceeds 2 MB. Copy a smaller group of links into the capture page.',{status:413});await saveDraft(text);return Response.redirect(new URL('./#/inspiration/capture',scope).href,303);})());return;}
 if(event.request.method!=='GET'||url.origin!==new URL(scope).origin||url.pathname.includes('/api/'))return;
 if(event.request.mode==='navigate'){event.respondWith((async()=>{try{return await fetch(event.request);}catch{const cache=await caches.open(SHELL);return await cache.match(index)||new Response('Open Design Daily online once before capturing offline.',{status:503});}})());return;}
 // Versioned code, shared fonts and public tokens only. Never cache private data or query strings.
 if(!url.search&&(/\/assets\//.test(url.pathname)||/\/fonts\//.test(url.pathname)||url.pathname.endsWith('/tokens.css'))){event.respondWith((async()=>{const cache=await caches.open(SHELL);const found=await cache.match(event.request);if(found)return found;const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;})());}
});
