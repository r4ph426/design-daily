// Provider-neutral records. No provider tokens or raw pages belong in these records.
export const TYPES = ['website reference', 'UI pattern', 'typography', 'motion', 'branding', 'asset', 'tool', 'repository', 'MCP', 'article', 'workflow', 'inspiration source'];
export const STATES = ['New', 'Saved', 'Used'];
const TRACKING = /^(utm_.+|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|igshid|_hsenc|_hsmi)$/i;
export function cleanUrl(raw) {
  const u = new URL(raw.trim());
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || raw.length > 8192) throw new Error('Use a public http or https URL without credentials.');
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (host === 'localhost' || !host.includes('.') || /\.(local|localhost|internal|test|invalid)$/.test(host) || privateAddress(host)) throw new Error('Private or internal addresses cannot be captured.');
  u.hostname = host;
  for (const key of [...u.searchParams.keys()]) if (TRACKING.test(key)) u.searchParams.delete(key);
  u.searchParams.sort();
  // Preserve fragments: #/routes and anchored examples can identify different references.
  return u.href;
}
export function privateAddress(host) {
  if (host.includes(':')) {
    const h = host.toLowerCase();
    // Only global-unicast IPv6 is eligible; reject mapped IPv4 and special ranges.
    return !/^[23][0-9a-f]{3}:/.test(h) || /^2001:(db8|0|2|10|20):/.test(h) || /^2002:/.test(h);
  }
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(host)) return false;
  const [a,b,c] = host.split('.').map(Number);
  return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0 || b === 2)) || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113);
}
function decode(s) { return s.replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&#(\d+);/g,(_,n)=>Number(n)<=0x10ffff?String.fromCodePoint(Number(n)):''); }
export function extractCaptures(text, format = 'text') {
  if (text.length > 2_000_000) throw new Error('Import is limited to 2 MB. Split it into smaller batches.');
  const links = format === 'html'
    ? [...text.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi)].map(m=>({originalUrl:decode(m[2]),title:decode(m[3].replace(/<[^>]*>/g,''))}))
    : [...text.matchAll(/https?:\/\/[^\s<>"'\u200b]+/gi)].map(m=>({originalUrl:m[0].replace(/[.,;!]+$/,'').replace(/\)+$/,s => (m[0].match(/\(/g)||[]).length ? s : '' ), context:text.slice(Math.max(0,m.index-160),m.index+m[0].length+160)}));
  if (links.length > 1000) throw new Error('Import is limited to 1,000 links at a time.');
  const seen = new Set(), items = [], rejected = [];
  let duplicates = 0;
  for (const link of links) {
    try {
      const url = cleanUrl(link.originalUrl);
      if (seen.has(url)) { duplicates++; continue; }
      seen.add(url); items.push({...link, url});
    } catch { rejected.push(link.originalUrl); }
  }
  return {items, rejected, duplicates};
}
export function makeItem(input, now = new Date().toISOString()) {
  const url = cleanUrl(input.originalUrl || input.url);
  return {id: crypto.randomUUID(), originalUrl:input.originalUrl || input.url, url, aliases:[url], redirects:[], canonicalUrl:null,
    title: input.title || new URL(url).hostname, domain:new URL(url).hostname, description:input.description || '', image:null,
    capturedAt:now, updatedAt:now, state:'New', favourite:false, archived:false, note:'', projects:[], tags:[], type:/\/(inspo|inspiration|directory)(\/|$)/.test(new URL(url).pathname)?'inspiration source':'website reference',
    kind:/\/(inspo|inspiration|directory)(\/|$)/.test(new URL(url).pathname)?'source':'reference', origin:input.origin || 'personal', context:input.context || '', providerRefs:[], enrichment:'pending', error:null,
    summary:'', relevance:'', generatedBy:'none', classificationUncertain:true, attempts:0};
}
export function captureInto(existing, inputs, now) {
  const items = structuredClone(existing); let added=0, duplicates=0;
  for (const input of inputs) {
    const url = cleanUrl(input.originalUrl || input.url);
    const found=items.find(i=>i.url===url || i.canonicalUrl===url || (i.aliases||[]).includes(url));
    if(found){ duplicates++; continue; }
    items.unshift(makeItem(input,now)); added++;
  }
  return {items,added,duplicates};
}
export function filterItems(items, filters={}) {
  return items.filter(i=> {
    const text=[i.title,i.url,i.summary,i.description,i.note,i.context,...i.tags,...i.projects].join(' ').toLowerCase();
    return (!filters.query || text.includes(filters.query.toLowerCase())) && (!filters.type || i.type===filters.type)
      && (!filters.tag || i.tags.includes(filters.tag)) && (!filters.source || i.domain===filters.source)
      && (!filters.status || (filters.status==='Archived'? i.archived : filters.status==='Favourites'? i.favourite&&!i.archived : filters.status==='Failed'? i.enrichment==='failed'&&!i.archived : i.state===filters.status&&!i.archived))
      && (filters.status==='Archived' || !i.archived);
  });
}
export function digest(items, discoveries=[], editionDate=new Date().toISOString().slice(0,10)) {
  const active=items.filter(i=>!i.archived && i.kind!=='source');
  const recent=[...active].sort((a,b)=>b.capturedAt.localeCompare(a.capturedAt)).filter(i=>Date.parse(editionDate)-Date.parse(i.capturedAt)<7*864e5).slice(0,2);
  const older=active.filter(i=>i.state==='Saved' && !recent.some(r=>r.id===i.id)).sort((a,b)=> (b.favourite-a.favourite) || a.capturedAt.localeCompare(b.capturedAt)).slice(0,2);
  const contextTags=new Set(active.flatMap(i=>i.tags));
  const discovered=discoveries.filter(d=>!active.some(i=>i.url===d.url || i.aliases.includes(d.url))).sort((a,b)=>b.tags.filter(t=>contextTags.has(t)).length-a.tags.filter(t=>contextTags.has(t)).length).slice(0,1);
  return [...recent.map(item=>({item,reason:`A recent capture${item.projects.length?` for ${item.projects.join(', ')}`:''}.`})),...older.map(item=>({item,reason:item.note?`Your note: ${item.note}`:item.tags.length?`Revisit ${item.tags.slice(0,2).join(' and ')}${item.projects.length?` for ${item.projects.join(', ')}`:''}.`:'An older saved reference to revisit.'})),...discovered.map(item=>({item,reason:item.tags.some(t=>contextTags.has(t))?`Shares ${item.tags.filter(t=>contextTags.has(t)).join(', ')} with your collection.`:'A source from the latest Design Daily crawl.',discovery:true}))];
}
export function exportCsv(items) {
  const keys=['originalUrl','url','canonicalUrl','title','domain','capturedAt','summary','generatedBy','relevance','type','kind','tags','state','favourite','archived','note','projects','origin','context','enrichment','error','providerRefs'];
  const cell=v=>{let s=Array.isArray(v)?JSON.stringify(v):String(v??''); if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
  return [keys.join(','),...items.map(i=>keys.map(k=>cell(i[k])).join(','))].join('\r\n');
}
export function crawlDiscoveries(edition) {
  const result=[],seen=new Set();
  for(const q of edition?.questions||[])for(const s of q.signals||[]){
    try {const url=cleanUrl(s.url);if(seen.has(url))continue;seen.add(url);result.push({...makeItem({url,title:s.title,origin:'crawler',context:`${q.question}\n${s.happened||''}\n${s.changes||''}`},edition.generatedAt||`${edition.date}T00:00:00Z`),id:`crawler:${url}`,description:s.happened||'',summary:s.happened||'',tags:q.tags||[q.category],enrichment:'complete',generatedBy:'Design Daily editorial crawl',discovery:true});}catch{}
  }
  return result;
}
export function captureMetadata(item){
  return {summary:item.description || (item.title!==item.domain?`Captured as “${item.title}”. The page has not been read yet.`:'A saved link. Page metadata is waiting for the private enrichment service.'),generatedBy:'capture metadata',classificationUncertain:true,relevance:'Design relevance is awaiting source review.',enrichment:'local',error:null};
}
