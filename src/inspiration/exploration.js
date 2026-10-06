export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function previewAspect(item, index = 0, measured = {}) {
  const context = [item.summary, ...(item.providerRefs || []).map(ref => ref.description)].filter(Boolean).join(' ');
  const dimensions = context.match(/(\d{2,5})\s*[×x]\s*(\d{2,5})\s*px/i);
  const ratio = measured[item.id] || (dimensions && Number(dimensions[1]) / Number(dimensions[2])) || [1.3, 1, 1.6, .85][index % 4];
  return clamp(ratio, .55, 1.8);
}

// A display-only scale study. Reuse original objects so opening a tile still
// shows its real source. Nothing enters capture, storage, sync or export.
export function scalePreviewItems(items, count=300) {
  return items.length ? Array.from({length:count},(_,index)=>items[index%items.length]) : [];
}

// Equal-height image bands with varied widths, following the selected visual source.
// Long webpage captures get a bounded preview window; details retain the full image.
export function fieldLayout(items, aspects = {}, {width:bandWidth=1860, top=0} = {}) {
  const gap=8, targetHeight=280, windows=[1,.95,1.25,1.05,.95,.75,.8,1.3,1.65,1.3,.85,1.1];
  const ratios=items.map((item,index)=>{
    const context=[item.summary,...(item.providerRefs||[]).map(ref=>ref.description)].filter(Boolean).join(' ');
    const dimensions=context.match(/(\d{2,5})\s*[×x]\s*(\d{2,5})\s*px/i);
    const ratio=aspects[item.id]||(dimensions&&Number(dimensions[1])/Number(dimensions[2]));
    return ratio>=.7&&ratio<=1.8 ? clamp(ratio,.8,1.35) : windows[index%windows.length];
  });
  const tiles=[];let y=top,index=0,width=0;
  while(index<items.length) {
    let count=1,sum=ratios[index];
    const error=(n,total)=>Math.abs((bandWidth-gap*(n-1))/total-targetHeight);
    while(index+count<items.length&&error(count+1,sum+ratios[index+count])<error(count,sum)) {sum+=ratios[index+count];count++;}
    const complete=index+count<items.length||sum*targetHeight+gap*(count-1)>=bandWidth*.85;
    const height=complete?(bandWidth-gap*(count-1))/sum:targetHeight;
    let x=0;
    for(let offset=0;offset<count;offset++) {
      const at=index+offset,tileWidth=ratios[at]*height;
      tiles.push({key:`${at}:${items[at].id}`,item:items[at],x,y,width:tileWidth,height});x+=tileWidth+gap;
    }
    width=Math.max(width,x-gap);y+=height+gap;index+=count;
  }
  return {tiles,width,height:tiles.length?y-gap:0};
}

export function boundCamera(camera, viewport, world) {
  const scale = clamp(camera.scale, world.minScale || .55, 1.65);
  const axis = (position, frame, content) => content * scale <= frame
    ? (frame - content * scale) / 2
    : clamp(position, frame - content * scale - 32, 32);
  return {scale, x: axis(camera.x, viewport.width, world.width), y: axis(camera.y, viewport.height, world.height)};
}

export function zoomAt(camera, scale, point, viewport, world) {
  scale = clamp(scale, world.minScale || .55, 1.65);
  const ratio = scale / camera.scale;
  return boundCamera({scale, x: point.x - (point.x - camera.x) * ratio, y: point.y - (point.y - camera.y) * ratio}, viewport, world);
}
