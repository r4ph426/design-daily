import { DatabaseSync } from 'node:sqlite';
import { makeItem, cleanUrl, STATES, TYPES, digest } from '../../src/inspiration/model.js';
export class InspirationDatabase {
  constructor(file){this.db=new DatabaseSync(file);this.db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY, record TEXT NOT NULL); CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);');}
  all(){return this.db.prepare('SELECT record FROM items').all().map(r=>JSON.parse(r.record));}
  put(i){this.db.prepare('INSERT INTO items VALUES (?,?) ON CONFLICT(id) DO UPDATE SET record=excluded.record').run(i.id,JSON.stringify(i));return i;}
  get(key,fallback=null){const r=this.db.prepare('SELECT value FROM settings WHERE key=?').get(key);return r?JSON.parse(r.value):fallback;}
  set(key,value){this.db.prepare('INSERT INTO settings VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key,JSON.stringify(value));}
  merge(records){if(!Array.isArray(records)||records.length>20000)throw new Error('Invalid capture batch');this.db.exec('BEGIN');try{for(const raw of records){const fresh=makeItem({originalUrl:raw.originalUrl,title:raw.title,origin:raw.origin,context:raw.context},raw.capturedAt);const existing=this.all().find(i=>i.id===raw.id || i.aliases.includes(fresh.url));
      const local={state:STATES.includes(raw.state)?raw.state:'New',note:String(raw.note||'').slice(0,10000),projects:(raw.projects||[]).map(p=>String(p).slice(0,100)).slice(0,20),favourite:!!raw.favourite,archived:!!raw.archived,tags:Array.isArray(raw.tags)?raw.tags.map(t=>String(t).slice(0,40)).slice(0,12):[],type:TYPES.includes(raw.type)?raw.type:fresh.type,kind:['reference','source'].includes(raw.kind)?raw.kind:fresh.kind};
      if(existing){if(raw.updatedAt>existing.updatedAt)this.put({...existing,...local,updatedAt:raw.updatedAt});}
      else this.put({...fresh,...local,id:raw.id||fresh.id,updatedAt:raw.updatedAt||fresh.updatedAt,providerRefs:(raw.providerRefs||[]).filter(p=>['raindrop','savee','pinterest'].includes(p.provider)),summary:String(raw.summary||'').slice(0,1600),generatedBy:String(raw.generatedBy||'none').slice(0,100)});
    }this.db.exec('COMMIT');}catch(e){this.db.exec('ROLLBACK');throw e;}return this.all();}
  patch(id,changes){const item=this.all().find(i=>i.id===id);if(!item)throw new Error('Item unavailable');const next={...item,updatedAt:new Date().toISOString()};for(const key of ['note','projects','favourite','archived','state','kind','type','tags'])if(key in changes)next[key]=changes[key];if(!STATES.includes(next.state)||!TYPES.includes(next.type)||!['reference','source'].includes(next.kind)||!Array.isArray(next.projects)||!Array.isArray(next.tags)||typeof next.note!=='string'||next.note.length>10000)throw new Error('Invalid item changes');return this.put(next);}
  enrichment(id,patch){const item=this.all().find(i=>i.id===id);if(!item)return;const next={...item,...patch};const peer=this.all().find(i=>i.id!==id && i.aliases.some(a=>next.aliases.includes(a)));
    if(peer){peer.aliases=[...new Set([...peer.aliases,...next.aliases])];peer.providerRefs=[...peer.providerRefs,...next.providerRefs];peer.projects=[...new Set([...peer.projects,...next.projects])];peer.note=[peer.note,next.note].filter(Boolean).join('\n');peer.favourite||=next.favourite;this.put(peer);this.db.prepare('DELETE FROM items WHERE id=?').run(id);return peer;}return this.put(next);}
  importProvider(records){let added=0,changed=0;this.db.exec('BEGIN');try{for(const input of records){const url=cleanUrl(input.originalUrl);let item=this.all().find(i=>i.providerRefs.some(p=>p.provider===input.provider.provider&&p.id===input.provider.id) || i.aliases.includes(url));if(!item){item=makeItem(input);added++;}else{const ref=item.providerRefs.find(p=>p.id===input.provider.id&&p.provider===input.provider.provider);if(ref&&JSON.stringify(ref)===JSON.stringify(input.provider))continue;changed++;}
      item.providerRefs=[...item.providerRefs.filter(p=>!(p.provider===input.provider.provider&&p.id===input.provider.id)),input.provider];item.aliases=[...new Set([...item.aliases,url])];
      // Provider metadata remains separate from personal notes, tags, state, project and favourites.
      if(item.origin==='raindrop'){item.url=url;item.domain=new URL(url).hostname;item.title=input.title||item.title;item.description=input.description||'';item.enrichment='pending';}
      if(['savee','pinterest'].includes(item.origin)){item.title=input.title||item.title;item.description=input.provider.description;item.image=input.provider.image;item.summary=input.provider.description||`Saved as “${item.title}”. No visual analysis has been performed.`;item.enrichment='complete';item.generatedBy='provider metadata';item.relevance='A personal visual reference. Review the original context before reusing it.';}
      this.put(item);
    }this.db.exec('COMMIT');}catch(e){this.db.exec('ROLLBACK');throw e;}return {added,changed};}
  close(){this.db.close();}
}
export function scheduleDue(lastRun,now=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',weekday:'short',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);const p=Object.fromEntries(parts.map(v=>[v.type,v.value]));const date=`${p.year}-${p.month}-${p.day}`;
  return !['Sat','Sun'].includes(p.weekday) && `${p.hour}:${p.minute}`>='01:17' && lastRun!==date ? date : null;
}
export function storeDigest(database,discoveries,date){const picks=digest(database.all(),discoveries,date).map(p=>({id:p.item.id,title:p.item.title,url:p.item.url,reason:p.reason,discovery:!!p.discovery}));database.set('digest',{date,picks});return picks;}
