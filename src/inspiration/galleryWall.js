// A fixed centre and expanding clockwise rings keep earlier captures in place.
export const wallColumns = width => width > 1200 ? 5 : 3;
export function galleryWall(count, columns=5) {
  if (!Number.isInteger(count) || count<0 || !Number.isInteger(columns) || columns<1 || columns%2!==1) throw new RangeError('Use a non-negative item count and an odd column count.');
  const half=(columns-1)/2, points=[];
  const add=(x,y)=>{if(points.length<count && Math.abs(x)<=half)points.push({x,y});};
  if(count)add(0,0);
  for(let ring=1;points.length<count;ring++){
    if(ring<=half)for(let y=1-ring;y<=ring && points.length<count;y++)add(ring,y);
    for(let x=Math.min(ring-1,half);x>=Math.max(-ring,-half) && points.length<count;x--)add(x,ring);
    if(ring<=half)for(let y=ring-1;y>=-ring && points.length<count;y--)add(-ring,y);
    for(let x=Math.max(1-ring,-half);x<=Math.min(ring,half) && points.length<count;x++)add(x,-ring);
  }
  const minY=points.reduce((n,p)=>Math.min(n,p.y),0),maxY=points.reduce((n,p)=>Math.max(n,p.y),0);
  return {columns,rows:count?maxY-minY+1:0,points:points.map(p=>({...p,column:p.x+half+1,row:p.y-minY+1}))};
}
