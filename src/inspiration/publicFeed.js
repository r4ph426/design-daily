import {cleanUrl} from './model.js';
import {weekFor} from './weeks.js';

const mediaUrl=value=>{if(!value)return null;const url=cleanUrl(value);if(!url.startsWith('https:'))throw new Error('Published previews require HTTPS.');return url;};

// Explicit allowlist: never serialize owner records, notes, projects or account exports.
export function publicReference(record,weekKey){
  const provider=record.providerRefs?.find(p=>p.provider==='savee');
  if(!provider?.id||!weekFor(weekKey)||weekFor(weekKey).key!==weekKey)throw new Error('A Savee reference and explicit Monday publication week are required.');
  const url=cleanUrl(provider.url||record.originalUrl),image=mediaUrl(provider.image||record.image),video=mediaUrl(provider.video);
  const sourceUrl=provider.sourceUrl?cleanUrl(provider.sourceUrl):null;
  const dimensions=String(provider.description||record.summary||'').match(/(\d{2,5})\s*[×x]\s*(\d{2,5})\s*px/i);
  const summary=dimensions?`${dimensions[1]} × ${dimensions[2]} px.`:'';
  return {id:`savee-${provider.id}`,title:String(record.title||'Visual reference').slice(0,300),originalUrl:url,url,domain:new URL(sourceUrl||url).hostname,image,video,inspirationDate:weekKey,capturedAt:`${weekKey}T12:00:00Z`,kind:'reference',origin:'savee',archived:false,tags:[],projects:[],note:'',summary,description:'',providerRefs:[{provider:'savee',id:provider.id,url,sourceUrl,image,...(video?{video}:{})}]};
}

export function publishReferences(records,{weekKey,previous={items:[]},now=new Date().toISOString()}={}){
  const next=records.map(record=>publicReference(record,weekKey));
  const items=new Map(readPublicFeed({schemaVersion:1,...previous}).map(item=>[item.id,item]));
  for(const item of next)items.set(item.id,item);
  return {schemaVersion:1,author:'Rapha',updatedAt:now,items:[...items.values()]};
}

export function readPublicFeed(feed){
  if(feed?.schemaVersion!==1||!Array.isArray(feed.items)||feed.items.length>20000)throw new Error('The weekly journal could not be read.');
  const seen=new Set();
  return feed.items.map(item=>{
    const safe=publicReference(item,item.inspirationDate);
    if(seen.has(safe.id))throw new Error('Duplicate published reference.');seen.add(safe.id);return safe;
  });
}
