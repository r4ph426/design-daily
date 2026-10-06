import dns from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import { cleanUrl, privateAddress } from '../../src/inspiration/model.js';
export const USER_AGENT='DesignDailyInspiration/1.0';
export async function resolvePublic(url,lookup=dns.lookup) {
  const u=new URL(cleanUrl(url));
  if(u.port && !['80','443'].includes(u.port))throw new Error('Only public web ports 80 and 443 are supported.');
  const addresses=await lookup(u.hostname.replace(/^\[|\]$/g,''),{all:true,verbatim:true});
  if(!addresses.length||addresses.some(a=>privateAddress(a.address)))throw new Error('Destination resolves to a private or reserved network.');
  return {url:u,address:addresses[0]};
}
// DNS is checked and pinned for each request and each redirect. No cookies, JS, or authentication.
export async function safeFetch(raw,{limit=1_000_000,timeout=10000,redirects=4,lookup=dns.lookup,beforeRequest}={}) {
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeout);const chain=[];
  try {
    let url=raw;
    for(let n=0;n<=redirects;n++) {
      if(controller.signal.aborted)throw new Error('Source timed out. Retry later.');
      const {url:u,address}=await Promise.race([resolvePublic(url,lookup),new Promise((_,reject)=>controller.signal.addEventListener('abort',()=>reject(new Error('Source timed out. Retry later.')),{once:true}))]);
      if (beforeRequest) await beforeRequest(u.href);
      const result=await new Promise((resolve,reject)=>{
        const transport=u.protocol==='https:'?https:http;
        const request=transport.get(u,{signal:controller.signal,headers:{'user-agent':USER_AGENT,accept:'text/html, application/rss+xml, application/atom+xml, text/plain', 'accept-encoding':'identity'},
          lookup:(_host,options,callback)=>callback(null,options.all?[address]:address.address,address.family)},response=>{
          const status=response.statusCode;
          if(status>=300&&status<400){response.resume();resolve({status,location:response.headers.location});return;}
          if(status!==200){response.destroy();reject(new Error(`Source returned HTTP ${status}. Open the source or retry later.`));return;}
          if(Number(response.headers['content-length']||0)>limit){response.destroy();reject(new Error('Source exceeds the response size limit.'));return;}
          const type=response.headers['content-type']||'';
          if(!/text\/|application\/(rss\+xml|atom\+xml|xml)/i.test(type)){response.destroy();reject(new Error('Source is not a supported HTML or feed document.'));return;}
          const chunks=[];let size=0;
          response.on('data',chunk=>{size+=chunk.length;if(size>limit){response.destroy();reject(new Error('Source exceeds the response size limit.'));}else chunks.push(chunk);});
          response.on('end',()=>resolve({status,text:Buffer.concat(chunks).toString('utf8'),contentType:type}));response.on('error',reject);
        });request.on('error',reject);
      });
      if(result.location){url=new URL(result.location,u).href;chain.push(cleanUrl(url));continue;}
      if(result.status>=300)throw new Error('Redirect has no destination.');
      return {...result,url:u.href,redirects:chain};
    }
    throw new Error('Too many redirects.');
  }catch(error){if(controller.signal.aborted)throw new Error('Source timed out. Retry later.');if(/CERT|SELF_SIGNED|UNABLE_TO_VERIFY|ISSUER/.test(error.code||''))throw new Error('The source certificate could not be verified. Your capture is safe. Open the original source or retry from a trusted network.');throw error;}finally{clearTimeout(timer);}
}
export function robotsPermit(text,url) {
  const groups=[];let agents=[],rules=[],started=false;
  for(const raw of text.split(/\r?\n/)){const line=raw.split('#')[0].trim();const split=line.indexOf(':');if(split<0)continue;const key=line.slice(0,split).toLowerCase(),val=line.slice(split+1).trim();
    if(key==='user-agent'){if(started){groups.push({agents,rules});agents=[];rules=[];started=false;}agents.push(val.toLowerCase());}
    else if(['allow','disallow'].includes(key)&&agents.length){started=true;if(val)rules.push({allow:key==='allow',path:val});}
  }if(agents.length)groups.push({agents,rules});
  const specific=groups.filter(g=>g.agents.some(a=>a!=='*'&&USER_AGENT.toLowerCase().startsWith(a)));
  const chosen=specific.length?specific:groups.filter(g=>g.agents.includes('*'));
  const path=new URL(url).pathname+new URL(url).search;
  const matches=chosen.flatMap(g=>g.rules).filter(r=>new RegExp('^'+r.path.split('*').map(p=>p.replace(/[.+?^{}()|[\]\\]/g,'\\$&')).join('.*').replace(/\\\$$/,'$')).test(path)).sort((a,b)=>b.path.length-a.path.length || Number(b.allow)-Number(a.allow));
  return matches[0]?.allow ?? true;
}
// Redirect-aware policy: inspect rules on every landing URL before requesting its content.
export async function readPublicPage(url,fetcher=safeFetch) {
  const rules = new Map();
  async function check(candidate) {
    const origin = new URL(candidate).origin;
    if (!rules.has(origin)) {
      try { rules.set(origin, (await fetcher(new URL('/robots.txt', candidate).href, {limit:100000})).text); }
      catch (e) { if (!e.message.includes('HTTP 404')) throw e; rules.set(origin, ''); }
    }
    if (!robotsPermit(rules.get(origin),candidate)) throw new Error('Source rules disallow automatic reading. Open it manually.');
  }
  return fetcher(url,{beforeRequest:check});
}
