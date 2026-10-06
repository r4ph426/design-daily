import { captureInto, cleanUrl } from './model.js';
let opening;
function db() {
  return opening ||= new Promise((resolve,reject)=>{
    const r=indexedDB.open('design-daily-inspiration-v1',1);
    r.onupgradeneeded=()=>{r.result.createObjectStore('items',{keyPath:'id'});r.result.createObjectStore('settings');};
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(new Error('Private storage is unavailable. Enable browser storage and retry.'));
  });
}
export async function transaction(store,mode,operation){const database=await db();return new Promise((resolve,reject)=>{const tx=database.transaction(store,mode);let value;operation(tx.objectStore(store),v=>value=v);tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(new Error('Could not save. Browser storage may be full. Export a backup and retry.'));});}
export const listItems=()=>transaction('items','readonly',(s,done)=>{const r=s.getAll();r.onsuccess=()=>done(r.result);});
export const setting=(key)=>transaction('settings','readonly',(s,done)=>{const r=s.get(key);r.onsuccess=()=>done(r.result);});
export const saveSetting=(key,value)=>transaction('settings','readwrite',s=>s.put(value,key));
export const saveItems=(items)=>transaction('items','readwrite',s=>items.forEach(i=>s.put(i)));
export async function capture(inputs){return transaction('items','readwrite',(s,done)=>{const r=s.getAll();r.onsuccess=()=>{const result=captureInto(r.result,inputs);result.items.forEach(i=>s.put(i));done(result);};});}
export async function updateItem(id,changes){return transaction('items','readwrite',(s,done)=>{const r=s.get(id);r.onsuccess=()=>{if(!r.result)throw new Error('Item unavailable');const i={...r.result,...changes,updatedAt:new Date().toISOString()};s.put(i);done(i);};});}
export async function applyEnrichment(id,patch){return transaction('items','readwrite',(s,done)=>{const r=s.get(id);r.onsuccess=()=>{if(!r.result)return;const item={...r.result,...patch};const all=s.getAll();all.onsuccess=()=>{const peer=all.result.find(i=>i.id!==id && (i.aliases||[i.url]).some(url=>(item.aliases||[]).includes(url)));
    if(peer){peer.aliases=[...new Set([...peer.aliases,...item.aliases])];peer.providerRefs=[...peer.providerRefs,...item.providerRefs];peer.projects=[...new Set([...peer.projects,...item.projects])];peer.note=[peer.note,item.note].filter(Boolean).join('\n');peer.favourite||=item.favourite;s.put(peer);s.delete(id);done(peer);}else{s.put(item);done(item);}};};});}
export async function restoreJson(text){
 const data=JSON.parse(text);if(data.schemaVersion!==1||!Array.isArray(data.items)||data.items.length>20000)throw new Error('Choose a Design Daily inspiration export (up to 20,000 items).');
 const current=await listItems();let count=0;
 for(const record of data.items){const url=cleanUrl(record.originalUrl);if(current.some(i=>i.url===url||i.aliases.includes(url)))continue;
  if(!Array.isArray(record.tags)||!Array.isArray(record.projects)||typeof record.note!=='string')throw new Error('Invalid export record');
  const providerRefs=(record.providerRefs||[]).filter(p=>['raindrop','savee','pinterest'].includes(p.provider)).map(p=>({...p,url:cleanUrl(p.url),sourceUrl:p.sourceUrl?cleanUrl(p.sourceUrl):null,image:null}));
  let image=null;try{if(record.image){const safeImage=cleanUrl(record.image);if(new URL(safeImage).protocol==='https:')image=safeImage;}}catch{}
  const safe={...record,id:crypto.randomUUID(),url,aliases:[url],image,providerRefs,enrichment:'pending',error:null,tags:record.tags.map(String).slice(0,12),projects:record.projects.map(String).slice(0,20)};
  current.push(safe);count++;
 }
 await saveItems(current);if(Array.isArray(data.sources))await saveSetting('sources',data.sources.slice(0,10).map(s=>({name:String(s.name||''),feedUrl:cleanUrl(s.feedUrl),enabled:false})));
 return count;
}
export const replaceItems=(items)=>transaction('items','readwrite',s=>{s.clear();items.forEach(i=>s.put(i));});
