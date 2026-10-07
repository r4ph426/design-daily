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

// Native video controls occupy the bottom of the player. Leave that region
// to the browser rather than intercepting play, seeking or fullscreen clicks.
export function videoControlZone(point,bounds){
  return !!bounds&&point.clientX>=bounds.left&&point.clientX<=bounds.right&&point.clientY>=Math.max(bounds.top,bounds.bottom-64)&&point.clientY<=bounds.bottom;
}
