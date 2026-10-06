import test from 'node:test';
import assert from 'node:assert/strict';
import {weeklyGallery,weeklyBands,weeklyAspect} from '../src/inspiration/weeklyLayouts.js';
const items=Array.from({length:30},(_,i)=>Object.freeze({id:`reference-${i}`,summary:i%2?'1280 × 6545 px':'800 × 1000 px',providerRefs:[]}));
function noOverlap(tiles){for(let i=0;i<tiles.length;i++)for(let j=i+1;j<tiles.length;j++){const a=tiles[i],b=tiles[j];assert.ok(a.x+a.width<=b.x+.001||b.x+b.width<=a.x+.001||a.y+a.height<=b.y+.001||b.y+b.height<=a.y+.001,`${i} overlaps ${j}`);}}
test('gallery keeps its central capture and existing positions while new captures grow outward',()=>{
 for(const width of [366,1132,1377]){
  const early=weeklyGallery(items.slice(0,9),width),later=weeklyGallery(items,width);
  assert.ok(Math.abs(early.tiles[0].x+early.tiles[0].width/2-width/2)<.001);
  assert.ok(Math.abs(early.tiles[0].y+early.tiles[0].height/2-early.centre)<.001);
  early.tiles.forEach((tile,i)=>{const peer=later.tiles[i];assert.equal(tile.item.id,peer.item.id);assert.equal(tile.x,peer.x);assert.equal(tile.width,peer.width);assert.equal(tile.height,peer.height);assert.ok(Math.abs((tile.y-early.centre)-(peer.y-later.centre))<.001);});
  noOverlap(later.tiles);
  assert.ok(later.tiles.every(t=>t.x>=0&&t.x+t.width<=width+.001&&t.y>=0&&t.y+t.height<=later.height+.001));
  assert.equal(new Set(later.tiles.map(t=>t.item.id)).size,30);
 }
});
test('bands reserve proportionate image windows and centre short rows within the page',()=>{
 for(const width of [296,366,1132,1377]){
  const layout=weeklyBands(items,width),tiles=layout.rows.flatMap(r=>r.tiles);
  noOverlap(tiles);assert.equal(tiles.length,30);assert.equal(new Set(tiles.map(t=>t.item.id)).size,30);
  assert.ok(layout.rows.every(r=>Math.abs(r.x*2+r.width-width)<.001));
  assert.ok(tiles.every(t=>t.width>44&&t.height>44&&t.x>=0&&t.x+t.width<=width+.001));
  assert.deepEqual(tiles.map(t=>t.item),items);
 }
});
test('empty and single-item weeks remain truthful and bounded in either variant',()=>{
 assert.equal(weeklyGallery([],1132).tiles.length,0);assert.equal(weeklyBands([],1132).rows.length,0);
 assert.equal(weeklyGallery(items.slice(0,1),366).tiles.length,1);assert.equal(weeklyBands(items.slice(0,1),366).rows[0].tiles.length,1);
 assert.equal(weeklyGallery(items,0).tiles.length,0);assert.equal(weeklyBands(items,0).rows.length,0);
 assert.equal(weeklyAspect({summary:'800 × 1000 px'},0),.8);
 assert.notEqual(weeklyAspect({summary:'1280 × 6545 px'},0),weeklyAspect({summary:'1280 × 6545 px'},1));
});
