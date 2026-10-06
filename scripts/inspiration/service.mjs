import { mkdirSync, chmodSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { InspirationDatabase, scheduleDue, storeDigest } from './database.mjs';
import { enrichItem } from './enrich.mjs';
import { readRaindrop, readCollections } from './raindrop.mjs';
import { crawlDiscoveries, cleanUrl } from '../../src/inspiration/model.js';
import { readPublicPage } from './network.mjs';
import { readSavee, readPinterest, readPinterestBoards } from './providers.mjs';
import { parseFeed } from '../lib/crawler.mjs';

export function createInspirationService({root=process.cwd(),file=process.env.INSPIRATION_DB_PATH || path.join(root,'.private','inspiration.sqlite'),enrich=enrichItem,provider=readRaindrop,token=process.env.RAINDROP_TOKEN}={}){
  mkdirSync(path.dirname(file),{recursive:true,mode:0o700});const db=new InspirationDatabase(file);chmodSync(file,0o600);
  let processing=false,syncing=false,closed=false;
  async function processQueue(){if(processing||closed)return;processing=true;try{for(const i of db.all().filter(i=>i.enrichment==='pending').slice(0,20)){db.put({...i,enrichment:'processing'});db.enrichment(i.id,await enrich(i));}}finally{processing=false;}}
  // Interrupted jobs return to the queue on restart.
  for(const i of db.all().filter(i=>i.enrichment==='processing'))db.put({...i,enrichment:'pending'});
  async function sync(collection=db.get('collection')){if(syncing)throw new Error('A sync is already running.');if(collection===null||collection===undefined)throw new Error('Choose a Raindrop collection first.');syncing=true;db.set('sync',{...db.get('sync',{}),status:'syncing',error:null});try{const records=await provider(collection,{token});const counts=db.importProvider(records);db.set('collection',String(collection));db.set('sync',{status:'complete',lastSuccess:new Date().toISOString(),...counts,error:null});void processQueue();return counts;}catch(e){db.set('sync',{...db.get('sync',{}),status:'failed',error:e.message});throw e;}finally{syncing=false;}}
  async function syncVisual(name,board){const key=name+'Sync';db.set(key,{...db.get(key,{}),status:'syncing',error:null});try{const records=name==='savee'?await readSavee():await readPinterest(board);const counts=db.importProvider(records);if(name==='pinterest')db.set('pinterestBoard',board);db.set(key,{status:'complete',lastSuccess:new Date().toISOString(),...counts,error:null});return counts;}catch(e){db.set(key,{...db.get(key,{}),status:'failed',error:e.message});throw e;}}
  async function runDaily(date){let discoveries=[];try{discoveries=crawlDiscoveries(JSON.parse(readFileSync(path.join(root,'public/data/latest.json'),'utf8')));}catch{}
    const sources=db.get('sources',[]);for(const s of sources.filter(s=>s.enabled)){
      try{const page=await readPublicPage(s.feedUrl);if(!/application\/(rss|atom)|<(rss|feed)\b/i.test(page.contentType+' '+page.text))throw new Error('Use an RSS or Atom feed for automatic discovery.');const found=parseFeed(page.text,{name:s.name||new URL(s.feedUrl).hostname,url:s.feedUrl,category:'Culture',tags:[]}).slice(0,3);for(const r of found){try{const url=cleanUrl(r.url);discoveries.push({...r,url,id:`crawler:${url}`,tags:r.tags||[],origin:'crawler',context:r.excerpt||'',summary:r.excerpt||'',domain:new URL(url).hostname,capturedAt:r.publishedAt||new Date().toISOString(),discovery:true});}catch{}}s.lastSuccess=new Date().toISOString();s.error=null;}catch(e){s.error=e.message;}
    }db.set('sources',sources);db.set('discoveries',discoveries);storeDigest(db,discoveries,date);db.set('lastDaily',date);
    if(token&&db.get('collection')!==null){try{await sync();}catch{}}
    if(process.env.SAVEE_TOKEN){try{await syncVisual('savee');}catch{}}
    if(process.env.PINTEREST_TOKEN&&db.get('pinterestBoard')){try{await syncVisual('pinterest',db.get('pinterestBoard'));}catch{}}
    await processQueue();
  }
  let dailyRunning=false;async function tick(){if(closed)return;void processQueue();const due=scheduleDue(db.get('lastDaily'));if(due&&!dailyRunning){dailyRunning=true;try{await runDaily(due);}finally{dailyRunning=false;}}}
  const timer=setInterval(()=>{void tick();},60000);timer.unref();void tick();
  async function body(req){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>4_000_000)throw new Error('Request exceeds 4 MB. Split the import.');chunks.push(chunk);}return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');}
  const send=(res,status,data)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(data));};
  async function middleware(req,res,next){if(!req.url?.startsWith('/api/inspiration/'))return next();
    // Loopback owner only; Host validation also rejects DNS rebinding. No CORS or LAN API.
    const expected=`http://${req.headers.host}`;let host;try{host=new URL(expected).hostname;}catch{return send(res,403,{error:'Local owner service only.'});}
    if(!['localhost','127.0.0.1','[::1]'].includes(host)||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||req.headers['x-inspiration-client']!=='1'||(req.headers.origin&&req.headers.origin!==expected)||req.headers['sec-fetch-site']==='cross-site')return send(res,403,{error:'Use the local app in this browser. Private service access is restricted to this computer.'});
    const route=req.url.split('?')[0].slice('/api/inspiration/'.length);
    try{
      if(req.method==='GET'&&route==='status')return send(res,200,{available:true,savee:!!process.env.SAVEE_TOKEN,pinterest:!!process.env.PINTEREST_TOKEN,saveeSync:db.get('saveeSync'),saveeAutomation:db.get('saveeAutomation'),pinterestSync:db.get('pinterestSync'),pinterestBoard:db.get('pinterestBoard'),storage:'Private local SQLite',ai:!!process.env.OPENAI_API_KEY,raindrop:!!token,collection:db.get('collection'),sync:db.get('sync'),lastDaily:db.get('lastDaily'),digest:db.get('digest'),sources:db.get('sources',[]),discoveries:db.get('discoveries',[])});
      if(req.method==='GET'&&route==='items')return send(res,200,{items:db.all()});
      if(req.method==='POST'&&route==='merge'){const {items}=await body(req);const result=db.merge(items);void processQueue();return send(res,200,{items:result});}
      if(req.method==='PATCH'&&route.startsWith('items/')){const changes=await body(req);return send(res,200,{item:db.patch(decodeURIComponent(route.slice(6)),changes)});}
      if(req.method==='POST'&&route.startsWith('retry/')){const id=decodeURIComponent(route.slice(6)),item=db.all().find(i=>i.id===id);if(!item)throw new Error('Item unavailable');db.put({...item,enrichment:'pending',error:null});void processQueue();return send(res,200,{queued:true});}
      if(req.method==='GET'&&route==='collections')return send(res,200,{collections:await readCollections({token})});
      if(req.method==='POST'&&route==='sync'){const {collection}=await body(req);if(!token)throw new Error('Add RAINDROP_TOKEN to the local service environment.');await sync(collection);return send(res,200,db.get('sync'));}
      if(req.method==='GET'&&route==='pinterest/boards')return send(res,200,{boards:await readPinterestBoards()});
      if(req.method==='POST'&&route==='savee/sync')return send(res,200,await syncVisual('savee'));
      if(req.method==='POST'&&route==='pinterest/sync'){const {board}=await body(req);return send(res,200,await syncVisual('pinterest',board));}
      if(req.method==='POST'&&route==='sources'){const {sources}=await body(req);if(!Array.isArray(sources)||sources.length>10)throw new Error('Use up to ten permitted RSS/Atom sources.');db.set('sources',sources.map(s=>({name:String(s.name||'').slice(0,100),feedUrl:cleanUrl(s.feedUrl),enabled:s.enabled===true})));return send(res,200,{saved:true});}
      if(req.method==='POST'&&route==='digest'){await runDaily(new Date().toISOString().slice(0,10));return send(res,200,db.get('digest'));}
      return send(res,404,{error:'Unknown inspiration action.'});
    }catch(e){return send(res,400,{error:e.message});}
  }
  return {middleware,db,processQueue,sync,runDaily,close(){closed=true;clearInterval(timer);db.close();}};
}
export function inspirationVitePlugin(){let service;return {name:'private-inspiration-service',apply:'serve',configureServer(server){service=createInspirationService();server.middlewares.use(service.middleware);server.httpServer?.once('close',()=>service.close());}};}
