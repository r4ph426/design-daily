import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import https from 'node:https';
import {EventEmitter} from 'node:events';
import {cleanUrl,extractCaptures,captureInto,makeItem,filterItems,digest,exportCsv,crawlDiscoveries,privateAddress} from '../src/inspiration/model.js';
import {resolvePublic,robotsPermit,readPublicPage,safeFetch} from '../scripts/inspiration/network.mjs';
import {extractMetadata,enrichItem,metadataEnrichment} from '../scripts/inspiration/enrich.mjs';
import {readRaindrop,raindropCapture} from '../scripts/inspiration/raindrop.mjs';
import {readSavee,readPinterest,saveeCapture} from '../scripts/inspiration/providers.mjs';
import {InspirationDatabase,scheduleDue,storeDigest} from '../scripts/inspiration/database.mjs';
import {createInspirationService} from '../scripts/inspiration/service.mjs';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/inspiration/raindrop.json',import.meta.url)));
function database(){return new InspirationDatabase(path.join(mkdtempSync(path.join(tmpdir(),'design-inspiration-')),'items.sqlite'));}
const response=body=>({ok:true,json:async()=>body});
test('messy Chrome and conversation links are extracted, cleaned and re-imported idempotently',()=>{
 const parsed=extractCaptures('Tabs\nTypography https://example.com/fonts?utm_source=chrome&family=Inter\n[Read](https://example.com/article)\nhttps://example.com/fonts?family=Inter\nhttp://127.0.0.1/secret\nhttps://user:password@example.com/');
 assert.equal(parsed.items.length,2);assert.equal(parsed.duplicates,1);assert.equal(parsed.rejected.length,2);
 const first=captureInto([],parsed.items);const second=captureInto(first.items,parsed.items);assert.equal(second.added,0);assert.equal(second.duplicates,2);assert.equal(second.items[0].originalUrl,'https://example.com/article');
 assert.equal(cleanUrl('https://example.com/?q=design&ref=meaningful&utm_campaign=a#detail'),'https://example.com/?q=design&ref=meaningful#detail');
 assert.equal(cleanUrl('https://example.com/#/works/1'),'https://example.com/#/works/1');
});
test('Chrome bookmark HTML preserves title and meaningful query parameters',()=>{
 const r=extractCaptures('<DL><DT><A HREF="https://example.com/?id=3&amp;utm_source=chrome">Design &amp; type</A><DT><A HREF="javascript:alert(1)">Skip</A></DL>','html');assert.equal(r.items.length,1);assert.equal(r.items[0].title,'Design & type');assert.equal(r.items[0].url,'https://example.com/?id=3');assert.equal(r.rejected.length,1);
});
test('SSRF protection rejects private literals, mixed DNS and reserved IPv6',async()=>{
 for(const url of ['http://2130706433/','http://0x7f000001/','http://localhost/','http://x.internal/','http://169.254.169.254/latest','http://[::1]/'])assert.throws(()=>cleanUrl(url));
 for(const host of ['10.1.2.3','100.64.1.1','192.0.0.1','198.18.0.1','::ffff:127.0.0.1','2001:db8::1','fe80::1'])assert.equal(privateAddress(host),true);
 await assert.rejects(resolvePublic('https://example.com/',async()=>[{address:'93.184.216.34',family:4},{address:'10.0.0.1',family:4}]),/private/);
 await assert.rejects(resolvePublic('https://example.com:8080/',async()=>[]),/ports/);
 const publicResolved=await resolvePublic('https://example.com/',async()=>[{address:'93.184.216.34',family:4}]);assert.equal(publicResolved.address.address,'93.184.216.34');
});
test('robots rules are honoured before a redirected page is requested',async()=>{
 assert.equal(robotsPermit('User-agent: *\nDisallow: /private\nAllow: /private/public','https://example.com/private/a'),false);
 assert.equal(robotsPermit('User-agent: *\nDisallow: /private\nAllow: /private/public','https://example.com/private/public'),true);
 assert.equal(robotsPermit('User-agent: *\nDisallow: /*?secret=','https://example.com/?secret=a'),false);
 const called=[];const fetcher=async(url,options)=>{called.push(url);if(url.endsWith('robots.txt'))return {text:'User-agent: *\nDisallow: /private'};await options.beforeRequest('https://example.com/allowed');await options.beforeRequest('https://example.com/private');throw new Error('Must never read this private path');};
 await assert.rejects(readPublicPage('https://example.com/allowed',fetcher),/disallow/);assert.equal(called.filter(u=>u.endsWith('robots.txt')).length,1);
});
test('metadata is grounded and tolerates attribute order, relative images and canonical aliases',async()=>{
 const meta=extractMetadata('<title>Type &amp; Layout</title><meta content="A typeface library." name="description"><meta content="/preview.jpg" property="og:image"><link href="/fonts" rel="canonical">','https://example.com/font?x=1');assert.equal(meta.title,'Type & Layout');assert.equal(meta.image,'https://example.com/preview.jpg');assert.equal(meta.canonicalUrl,'https://example.com/fonts');assert.equal(metadataEnrichment(meta,'https://example.com/fonts').type,'typography');
 const item=makeItem({url:'https://example.com/fonts?utm_source=a'});const patch=await enrichItem(item,{read:async()=>({url:item.url,text:'<title>Typeface</title><meta name="description" content="A font reference.">',redirects:[]}),ai:async()=>null});assert.equal(patch.generatedBy,'metadata');assert.match(patch.summary,/font reference/);assert.equal(patch.enrichment,'complete');
});
test('failed enrichment and AI failure retain captures and metadata',async()=>{
 const db=database(),item=makeItem({url:'https://example.com/failed'});db.put(item);const failure=await enrichItem(item,{read:async()=>{throw new Error('Source timed out. Retry later.');}});db.enrichment(item.id,failure);assert.equal(db.all().length,1);assert.equal(db.all()[0].enrichment,'failed');assert.equal(db.all()[0].originalUrl,item.originalUrl);
 const fallback=await enrichItem(item,{read:async()=>({text:'<title>Design</title>',url:item.url,redirects:[]}),ai:async()=>{throw new Error('AI unavailable');}});assert.equal(fallback.enrichment,'complete');assert.equal(fallback.generatedBy,'metadata');assert.match(fallback.error,/AI/);db.close();
});
test('canonical redirects deduplicate while preserving local context',()=>{
 const db=database(),a=makeItem({url:'https://example.com/a'}),b=makeItem({url:'https://example.com/b'});a.note='Keep the layout';b.projects=['Portal'];b.favourite=true;db.put(a);db.put(b);db.enrichment(b.id,{aliases:[a.url,b.url],canonicalUrl:a.url,enrichment:'complete'});assert.equal(db.all().length,1);assert.equal(db.all()[0].favourite,true);assert.deepEqual(db.all()[0].projects,['Portal']);assert.equal(db.all()[0].note,a.note);db.close();
});
test('local SQLite persists, filters search notes and projects, and CSV escapes formulas',()=>{
 const file=path.join(mkdtempSync(path.join(tmpdir(),'inspiration-persist-')),'db.sqlite');let db=new InspirationDatabase(file);const i=makeItem({url:'https://example.com/'});i.tags=['UI'];i.type='UI pattern';i.note='Keyboard navigation';i.projects=['Checkout'];i.state='Saved';i.title='=HYPERLINK("bad")';db.put(i);db.close();db=new InspirationDatabase(file);assert.equal(filterItems(db.all(),{query:'checkout',tag:'UI',type:'UI pattern',status:'Saved',source:'example.com'}).length,1);assert.equal(filterItems(db.all(),{query:'keyboard'}).length,1);assert.match(exportCsv(db.all()),/'=HYPERLINK/);const parsed=JSON.parse(JSON.stringify({schemaVersion:1,items:db.all()}));assert.deepEqual(parsed.items[0].projects,['Checkout']);db.close();
});
test('crawler discoveries save into the personal collection without duplicates',()=>{
 const records=crawlDiscoveries({date:'2026-10-02',questions:[{question:'How does motion teach?',tags:['UI'],signals:[{url:'https://example.com/motion',title:'Motion patterns',happened:'A new motion reference.'},{url:'https://example.com/motion',title:'Repeated'}]}]});assert.equal(records.length,1);const first=captureInto([],records);assert.equal(first.items[0].origin,'crawler');assert.equal(captureInto(first.items,records).added,0);
});
test('digest remains small and explains picks without mixing source directories',()=>{
 const active=Array.from({length:12},(_,n)=>({...makeItem({url:`https://example.com/${n}`},'2026-09-01T12:00:00Z'),state:'Saved',tags:['UI'],note:n===0?'Study hierarchy':''}));active.push({...makeItem({url:'https://example.com/inspo'}),kind:'source'});const result=digest(active,[{...makeItem({url:'https://example.com/new'}),tags:['UI']}],'2026-10-04');assert.ok(result.length<=5);assert.ok(result.every(p=>p.reason));assert.ok(!result.some(p=>p.item.kind==='source'));
});
test('Raindrop pagination is GET-only and full rereads refresh changes without touching notes',async()=>{
 const requests=[];const records=await readRaindrop(123,{token:'fixture-secret',fetcher:async(url,options)=>{requests.push({url,options});return response({items:fixture.items});}});assert.equal(records.length,2);assert.match(requests[0].url,/perpage=50&page=0/);assert.equal(requests[0].options.method,undefined);
 const db=database();assert.deepEqual(db.importProvider(records),{added:2,changed:0});assert.deepEqual(db.importProvider(records),{added:0,changed:0});const original=db.all()[0];db.patch(original.id,{note:'My reason',projects:['Study'],state:'Used',favourite:true,tags:['local']});const changed=structuredClone(fixture.items[0]);changed.link='https://example.com/updated';changed.lastUpdate='2026-10-04T12:00:00Z';db.importProvider([raindropCapture(changed,123)]);const item=db.all().find(i=>i.id===original.id);assert.equal(item.note,'My reason');assert.deepEqual(item.tags,['local']);assert.equal(item.state,'Used');assert.equal(item.originalUrl,original.originalUrl);assert.equal(item.url,'https://example.com/updated');db.close();
});
test('provider authorization failures are actionable and never include tokens',async()=>{
 await assert.rejects(readRaindrop(1,{token:'super-secret',fetcher:async()=>({ok:false,status:401})}),e=>e.message.includes('token')&&!e.message.includes('super-secret'));
 await assert.rejects(readRaindrop(-99,{token:'x'}),/Trash/);
});
test('Savee cursor and Pinterest board bookmark imports preserve individual visual IDs',async()=>{
 const calls=[];const data=[{id:'s1',url:'https://savee.com/i/a/',name:'Poster',source_url:'https://example.com/',media:{thumbnail:'https://dm.savee.com/a.jpg'}},{id:'s2',url:'https://savee.com/i/b/',name:'Second view',source_url:'https://example.com/',media:{}}];
 const saved=await readSavee({token:'fixture',fetcher:async url=>{calls.push(url);return response(calls.length===1?{data:[data[0]],has_more:true,next_cursor:'opaque'}:{data:[data[1]],has_more:false});}});assert.equal(saved.length,2);assert.match(calls[1],/cursor=opaque/);const db=database();db.importProvider(saved);assert.equal(db.all().length,2);assert.equal(db.all()[0].image,'https://dm.savee.com/a.jpg');assert.equal(db.all()[0].enrichment,'complete');
 const pins=await readPinterest('123',{token:'fixture',fetcher:async()=>response({items:[{id:'45',title:'Pin',link:'https://example.com/',description:'Original caption',media:{images:{'600x':{url:'https://i.pinimg.com/a.jpg'}}}}],bookmark:null})});db.importProvider(pins);assert.equal(db.all().length,3);assert.equal(pins[0].provider.sourceUrl,'https://example.com/');db.close();
});
test('weekday scheduling reuses daily crawl time and avoids weekends and repeats',()=>{
 assert.equal(scheduleDue(null,new Date('2026-10-04T12:00:00Z')),null);assert.equal(scheduleDue(null,new Date('2026-10-05T00:00:00Z')),'2026-10-05');assert.equal(scheduleDue('2026-10-05',new Date('2026-10-05T12:00:00Z')),null);assert.equal(scheduleDue(null,new Date('2026-10-04T22:30:00Z')),null);
 const workflow=readFileSync(new URL('../.github/workflows/publish.yml',import.meta.url),'utf8');assert.match(workflow,/17 1 \* \* 1-5/);assert.match(workflow,/Europe\/Berlin/);
});
test('API rejects cross-origin, non-loopback and rebinding requests; valid capture survives failure',async()=>{
 const root=mkdtempSync(path.join(tmpdir(),'inspiration-service-'));const service=createInspirationService({root,file:path.join(root,'db.sqlite'),enrich:async()=>({enrichment:'failed',error:'Fixture extraction failure'})});
 async function call(headers,address,route='status',method='GET',body=''){let result,status;const request={url:`/api/inspiration/${route}`,method,headers,socket:{remoteAddress:address},async *[Symbol.asyncIterator](){if(body)yield Buffer.from(body);}};await service.middleware(request,{writeHead(s){status=s;},end(s){result=JSON.parse(s);}},()=>{});return {status,result};}
 try{
  for(const [headers,address] of [[{host:'evil.example','x-inspiration-client':'1'},'127.0.0.1'],[{host:'localhost:5173','x-inspiration-client':'1',origin:'https://evil.example'},'127.0.0.1'],[{host:'localhost:5173','x-inspiration-client':'1'},'192.168.1.10'],[{host:'localhost:5173'},'127.0.0.1']])assert.equal((await call(headers,address)).status,403);
  const headers={host:'localhost:5173','x-inspiration-client':'1',origin:'http://localhost:5173'};assert.equal((await call(headers,'127.0.0.1')).status,200);
  const item=makeItem({url:'https://example.com/'});await call(headers,'127.0.0.1','merge','POST',JSON.stringify({items:[item]}));await service.processQueue();assert.equal(service.db.all().length,1);
 }finally{service.close();}
});
test('desktop extension transfers only web tabs, selected/current/all scope, and never transmits secrets',async()=>{
 const code=readFileSync(new URL('../public/capture-extension/popup.js',import.meta.url),'utf8');
 for(const mode of ['current','selected','all']){let handler,query,created;const field={value:'https://r4ph426.github.io/design-daily/'};const context={URL,document:{querySelector:s=>s==='#app'?field:{textContent:''},querySelectorAll:()=>[{dataset:{mode},addEventListener:(_e,h)=>handler=h}]},window:{close(){}},chrome:{storage:{local:{get:async()=>({}),set:async()=>{}}},tabs:{query:async q=>{query=q;return [{title:'Design',url:'https://example.com/'},{title:'Internal',url:'chrome://settings/'}];},create:async v=>created=v}}};vm.runInNewContext(code,context);await handler();assert.equal(query.currentWindow,true);assert.equal(query.active,mode==='current'?true:undefined);assert.equal(query.highlighted,mode==='selected'?true:undefined);const u=new URL(created.url);assert.equal(u.search,'');const payload=new URLSearchParams(u.hash.split('?')[1]).get('text');assert.match(payload,/example.com/);assert.ok(!payload.includes('chrome://'));}
});
test('PWA share target and Pages artifacts are base-path safe',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../public/inspiration.webmanifest',import.meta.url)));assert.equal(manifest.share_target.method,'POST');assert.equal(new URL(manifest.share_target.action,'https://r4ph426.github.io/design-daily/inspiration.webmanifest').pathname,'/design-daily/inspiration-share');assert.equal(manifest.start_url,'./#/inspiration/capture');assert.ok(existsSync('public/inspiration-192.png'));
});

test('public transport bounds streams, pins DNS, blocks private redirects and times out DNS',async t=>{
 const lookup=async host=>[{address:host==='private.example'?'10.0.0.1':'93.184.216.34',family:4}];let scenario='large',requested=[];
 t.mock.method(https,'get',(url,options,receive)=>{requested.push(url.href);const request=new EventEmitter();queueMicrotask(()=>{const res=new EventEmitter();res.resume=()=>{};res.destroy=()=>{};res.statusCode=scenario==='redirect'?302:200;res.headers=scenario==='redirect'?{location:'https://private.example/'}:{'content-type':'text/html'};options.lookup(url.hostname,{all:false},(_err,address)=>assert.equal(address,'93.184.216.34'));receive(res);if(scenario!=='redirect'){res.emit('data',Buffer.from('oversized response'));res.emit('end');}});return request;});
 await assert.rejects(safeFetch('https://example.com/',{lookup,limit:3}),/size limit/);
 scenario='redirect';requested=[];await assert.rejects(safeFetch('https://example.com/',{lookup}),/private/);assert.equal(requested.length,1);
 await assert.rejects(safeFetch('https://example.com/',{lookup:()=>new Promise(()=>{}),timeout:10}),/timed out/);
});
test('installed PWA POST shares stay in private IndexedDB and redirect to a clean capture URL',async()=>{
 const handlers={};let saved;
 const indexedDB={open(){const request={};queueMicrotask(()=>{request.result={transaction(){const tx={objectStore:()=>({put(value,key){saved={value,key};}})};queueMicrotask(()=>tx.oncomplete());return tx;},close(){}};request.onsuccess();});return request;}};
 const context={URL,Response,indexedDB,self:{registration:{scope:'https://example.com/design-daily/'},addEventListener:(name,callback)=>handlers[name]=callback}};
 vm.runInNewContext(readFileSync(new URL('../public/inspiration-sw.js',import.meta.url),'utf8'),context);
 let result;handlers.fetch({request:{url:'https://example.com/design-daily/inspiration-share',method:'POST',formData:async()=>new Map([['title','Design'],['text','Private draft context'],['url','https://example.org/ref']])},respondWith:p=>result=p});
 const response=await result;assert.equal(response.status,303);assert.equal(response.headers.get('location'),'https://example.com/design-daily/#/inspiration/capture');assert.equal(saved.key,'shared-draft');assert.match(saved.value,/Private draft context/);assert.ok(!response.headers.get('location').includes('Private'));
});
