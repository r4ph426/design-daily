import test from 'node:test';
import assert from 'node:assert/strict';
import {fieldLayout, boundCamera, zoomAt, previewAspect, scalePreviewItems} from '../src/inspiration/exploration.js';

test('the finite field lays out every reference once without overlapping', () => {
  const items = Array.from({length:43}, (_,id)=>({id:String(id)}));
  const world = fieldLayout(items, {'0':.1,'1':4});
  assert.deepEqual(world.tiles.map(tile=>tile.item.id),items.map(item=>item.id));
  for(const a of world.tiles) {
    assert.ok(a.x>=0 && a.y>=0 && a.x+a.width<=world.width && a.y+a.height<=world.height+.001);
    for(const b of world.tiles) if(a!==b) assert.ok(a.x+a.width<=b.x || b.x+b.width<=a.x || a.y+a.height<=b.y || b.y+b.height<=a.y);
  }
  assert.equal(fieldLayout([]).height,0);
});

test('camera bounds prevent losing the field and centre small results', () => {
  assert.deepEqual(boundCamera({x:-9000,y:9000,scale:3},{width:600,height:400},{width:1200,height:900}),{scale:1.65,x:-1412,y:32});
  assert.deepEqual(boundCamera({x:99,y:-99,scale:.1},{width:600,height:400},{width:260,height:180}),{scale:.55,x:228.5,y:150.5});
});

test('zoom keeps the reference under the pointer when no edge clamps apply', () => {
  const camera={x:-500,y:-500,scale:1}, point={x:250,y:250};
  const next=zoomAt(camera,1.3,point,{width:800,height:600},{width:2500,height:2500});
  assert.equal((point.x-next.x)/next.scale,(point.x-camera.x)/camera.scale);
  assert.equal((point.y-next.y)/next.scale,(point.y-camera.y)/camera.scale);
});

test('wall previews reserve bounded image proportions from recorded dimensions', () => {
  assert.equal(previewAspect({id:'one',providerRefs:[{description:'1280 × 13476 px. Full capture.'}]}),.55);
  assert.equal(previewAspect({id:'two',summary:'1920 x 1080 px.'}),1920/1080);
  assert.equal(previewAspect({id:'three'},0,{'three':4}),1.8);
  assert.equal(previewAspect({id:'four'},1),1);
});

test('the selected field uses aligned image rows with varied widths and narrow gutters',()=>{
 const items=Array.from({length:30},(_,id)=>({id:String(id)}));
 const world=fieldLayout(items,Object.fromEntries(items.map(i=>[i.id,.09])),{top:200});
 const first=world.tiles.filter(t=>t.y===200);
 assert.ok(first.length>=5&&first.length<=7);
 assert.ok(new Set(first.map(t=>t.width)).size>=4);
 assert.equal(new Set(first.map(t=>t.height)).size,1);
 for(let i=1;i<first.length;i++)assert.ok(Math.abs(first[i].x-first[i-1].x-first[i-1].width-8)<.001);
 assert.ok(Math.abs(first.at(-1).x+first.at(-1).width-1860)<.001);
 assert.equal(fieldLayout(items.slice(0,1)).tiles[0].height,280);
});

test('scale preview reuses real records without adding or mutating collection data',()=>{
 const items=Array.from({length:30},(_,id)=>Object.freeze({id:String(id),title:`Reference ${id}`}));
 const preview=scalePreviewItems(Object.freeze(items));
 assert.equal(preview.length,300);assert.equal(items.length,30);
 assert.equal(preview[30],items[0]);assert.equal(preview[299],items[29]);
 const world=fieldLayout(preview,{}, {width:4200});
 assert.equal(new Set(world.tiles.map(t=>t.key)).size,300);
 assert.equal(new Set(world.tiles.map(t=>t.item.id)).size,30);
 assert.deepEqual(scalePreviewItems([]),[]);
 assert.equal(boundCamera({x:-110,y:0,scale:.4},{width:1128,height:988},{...world,minScale:.3}).scale,.4);
});
