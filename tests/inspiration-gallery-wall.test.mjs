import test from 'node:test';
import assert from 'node:assert/strict';
import {galleryWall,wallColumns} from '../src/inspiration/galleryWall.js';
test('the first visual is at the centre and the first ring surrounds it',()=>{
 const one=galleryWall(1,3);assert.equal(one.points[0].column,2);assert.equal(one.points[0].x,0);assert.equal(one.points[0].y,0);
 const ring=galleryWall(9,3);assert.equal(ring.rows,3);
 assert.deepEqual(new Set(ring.points.map(p=>`${p.x},${p.y}`)),new Set(['0,0','1,0','1,1','0,1','-1,1','-1,0','-1,-1','0,-1','1,-1']));
});
test('adding captures preserves all existing spatial coordinates',()=>{
 for(const columns of [3,5]) {
  const first=galleryWall(17,columns),later=galleryWall(80,columns);
  assert.deepEqual(first.points.map(({x,y})=>({x,y})),later.points.slice(0,17).map(({x,y})=>({x,y})));
 }
});
test('large and sparse collections never overlap or spill outside their columns',()=>{
 for(const columns of [3,5])for(const count of [0,1,2,7,30,301,3000]){
  const layout=galleryWall(count,columns);assert.equal(layout.points.length,count);
  assert.equal(new Set(layout.points.map(p=>`${p.column},${p.row}`)).size,count);
  assert.ok(layout.points.every(p=>p.column>=1&&p.column<=columns&&p.row>=1&&p.row<=layout.rows));
 }
});
test('the annotated tablet breakpoint uses larger visuals, with a compact mobile wall',()=>{
 assert.equal(wallColumns(1192),3);assert.equal(wallColumns(1200),3);assert.equal(wallColumns(1440),5);assert.equal(wallColumns(390),3);
 assert.throws(()=>galleryWall(-1,3),RangeError);assert.throws(()=>galleryWall(2,4),RangeError);
});
