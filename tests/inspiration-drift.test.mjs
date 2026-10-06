import test from 'node:test';
import assert from 'node:assert/strict';
import {createDrift,stepDrift,DRIFT_SPEED} from '../src/inspiration/drift.js';
const frame={width:800,height:600},world={width:2400,height:2800};
test('ambient drift eases in at a bounded screen speed and pauses for interaction',()=>{
 const state=createDrift();let camera={x:-300,y:-300,scale:.85};
 const start={...camera};for(let n=0;n<120;n++)camera=stepDrift(state,camera,frame,world,1/60,true,()=>.5);
 assert.ok(Math.hypot(camera.x-start.x,camera.y-start.y)>5);
 assert.ok(Math.hypot(camera.x-start.x,camera.y-start.y)<2*DRIFT_SPEED);
 assert.deepEqual(stepDrift(state,camera,frame,world,1,false),camera);
});
test('a returning frame cannot jump and drift turns away from finite boundaries',()=>{
 const state={...createDrift(),amount:1,heading:0,target:0};const camera={x:32,y:-300,scale:1};
 const next=stepDrift(state,camera,frame,world,20,true);
 assert.equal(next.x,32);assert.ok(Math.cos(state.heading)<0);
 const following=stepDrift(state,next,frame,world,1/60,true);assert.ok(following.x<32);
 assert.ok(Math.hypot(following.x-next.x,following.y-next.y)<DRIFT_SPEED*.05+.01);
});
test('small collections remain centred rather than drifting into empty space',()=>{
 const camera={x:270,y:210,scale:1},state=createDrift();
 assert.deepEqual(stepDrift(state,camera,frame,{width:260,height:180},1/60,true),camera);
});
