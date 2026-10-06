import { cleanUrl } from '../../src/inspiration/model.js';
export function raindropCapture(r,collection){return {originalUrl:r.link,title:r.title,description:r.excerpt,origin:'raindrop',provider:{provider:'raindrop',id:String(r._id),collection:String(collection),updatedAt:r.lastUpdate||r.created,url:cleanUrl(r.link),title:r.title||'',description:r.excerpt||'',tags:(r.tags||[]).slice(0,30),image:r.cover||null}};}
export async function readRaindrop(collection,{token=process.env.RAINDROP_TOKEN,fetcher=fetch}={}){
  if(!token)throw new Error('Add RAINDROP_TOKEN to the local service environment, then restart it.');
  if(!/^-?\d+$/.test(String(collection))||Number(collection)<-1)throw new Error('Choose a collection or Unsorted. Trash is not imported.');
  const records=[];
  for(let page=0;page<200;page++){
    const response=await fetcher(`https://api.raindrop.io/rest/v1/raindrops/${collection}?perpage=50&page=${page}&sort=-created&nested=false`,{headers:{authorization:`Bearer ${token}`},signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw new Error(response.status===401?'Raindrop token expired or was rejected. Replace the server token.':`Raindrop returned HTTP ${response.status}. Retry later.`);
    const body=await response.json();if(body.result===false||!Array.isArray(body.items))throw new Error('Raindrop returned an invalid response.');
    records.push(...body.items.map(r=>raindropCapture(r,collection)));if(body.items.length<50)return records;
  }throw new Error('Collection exceeds the 10,000 item sync limit. Choose a smaller collection.');
}
export async function readCollections({token=process.env.RAINDROP_TOKEN,fetcher=fetch}={}){
  if(!token)throw new Error('Add RAINDROP_TOKEN to the local service environment.');
  const collections=[{_id:-1,title:'Unsorted'}];
  for(const endpoint of ['collections','collections/childrens']){const r=await fetcher(`https://api.raindrop.io/rest/v1/${endpoint}`,{headers:{authorization:`Bearer ${token}`},signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error(`Raindrop returned HTTP ${r.status}. Check the server token.`);const body=await r.json();if(!Array.isArray(body.items))throw new Error('Invalid collection response');collections.push(...body.items.map(c=>({_id:c._id,title:c.title})));}
  return collections;
}
