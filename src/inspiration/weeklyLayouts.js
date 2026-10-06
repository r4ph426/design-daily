import {clamp} from './exploration.js';

// Real images retain their proportions. Tall website captures use bounded
// preview windows; the original, uncropped image stays in the detail dialog.
export function weeklyAspect(item,index=0) {
  const context=[item.summary,...(item.providerRefs||[]).map(ref=>ref.description)].filter(Boolean).join(' ');
  const dimensions=context.match(/(\d{2,5})\s*[×x]\s*(\d{2,5})\s*px/i);
  const ratio=dimensions?Number(dimensions[1])/Number(dimensions[2]):null;
  return ratio>=.65&&ratio<=2.2?clamp(ratio,.7,1.8):[1.3,.78,1.5,1,.9,1.65,.8,1.15][index%8];
}

export function weeklyGallery(items,width) {
  if(!(width>0))return {tiles:[],width:0,height:0,centre:0};
  const gap=width<650?12:20,mobile=width<650;
  const laneWidths=mobile?[width]:[width*.26,width*.36,width*.26];
  const lanes=laneWidths.map((w,i)=>({width:w,x:mobile?0:(width-laneWidths.reduce((a,b)=>a+b,0)-2*gap)/2+laneWidths.slice(0,i).reduce((a,b)=>a+b+gap,0),top:0,bottom:0,count:0}));
  const order=mobile?[0]:[1,0,2,0,2,1];
  const tiles=items.map((item,index)=>{
    const lane=lanes[order[index%order.length]],ratio=weeklyAspect(item,index);
    const tileWidth=lane.width*(index===0?1:[.93,1,.87,1][index%4]);
    const height=tileWidth/ratio;
    const y=lane.count===0?-height/2:lane.count%2?lane.bottom+gap:lane.top-gap-height;
    lane.top=Math.min(lane.top,y);lane.bottom=Math.max(lane.bottom,y+height);lane.count++;
    return {item,x:lane.x+(lane.width-tileWidth)/2,y,width:tileWidth,height};
  });
  const top=Math.min(0,...tiles.map(t=>t.y)),bottom=Math.max(0,...tiles.map(t=>t.y+t.height));
  return {width,height:bottom-top,centre:-top,tiles:tiles.map(t=>({...t,y:t.y-top}))};
}

export function weeklyBands(items,width) {
  if(!(width>0))return {rows:[],width:0,height:0};
  const mobile=width<650,gap=mobile?6:8,target=mobile?160:238;
  const counts=mobile?[2,2,2]:[3,5,4],spans=mobile?[1,1,1]:[.74,1,.86];
  const rows=[];let index=0,y=0;
  while(index<items.length){
    const rowIndex=rows.length,count=Math.min(counts[rowIndex%3],items.length-index);
    const ratios=items.slice(index,index+count).map((item,offset)=>clamp(weeklyAspect(item,index+offset),.72,1.4));
    const sum=ratios.reduce((a,b)=>a+b,0),available=width*spans[rowIndex%3];
    const height=Math.min(target,(available-gap*(count-1))/sum);
    const rowWidth=height*sum+gap*(count-1);let x=(width-rowWidth)/2;
    const tiles=ratios.map((ratio,offset)=>{const tile={item:items[index+offset],x,y,width:height*ratio,height};x+=tile.width+gap;return tile;});
    rows.push({tiles,height,width:rowWidth,x:(width-rowWidth)/2,y});index+=count;y+=height+gap;
  }
  return {rows,width,height:rows.length?y-gap:0};
}
