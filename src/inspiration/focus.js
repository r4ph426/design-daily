import {cleanUrl} from './model.js';

export function referenceSource(item) {
  const candidates=[...(item.providerRefs||[]).map(p=>p.sourceUrl),item.originalUrl,item.url];
  for(const candidate of candidates){
    if(!candidate)continue;
    try {const href=cleanUrl(candidate);return {href,label:new URL(href).hostname.replace(/^www\./,'')};}catch{}
  }
  return null;
}
export function tidyTags(values) {
  const seen=new Set();
  return values.map(v=>String(v).replace(/^#+/,'').trim().replace(/\s+/g,' ').slice(0,48)).filter(tag=>{
    const key=tag.toLowerCase();if(!tag||seen.has(key))return false;seen.add(key);return true;
  }).slice(0,12);
}
export function fitImage(width,height,availableWidth,availableHeight) {
  const ratio=Math.min(availableWidth/width,availableHeight/height);
  return {width:Math.max(1,width*ratio),height:Math.max(1,height*ratio)};
}
