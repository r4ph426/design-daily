import test from 'node:test';
import assert from 'node:assert/strict';
import {createIdleController,motionPreset,MOTION_PRESETS} from '../src/inspiration/immersion.js';

function harness(delay=1000) {
  let now=0,id=0;const jobs=new Map(),changes=[];
  const controller=createIdleController({delay,onChange:value=>changes.push(value),schedule:(fn,wait)=>{jobs.set(++id,{fn,due:now+wait});return id;},cancel:key=>jobs.delete(key)});
  return {controller,changes,jobs,advance(ms){now+=ms;for(const [key,job] of jobs)if(job.due<=now){jobs.delete(key);job.fn();}}};
}
test('navigation returns after the last movement, with no repeated state updates',()=>{
  const h=harness();h.controller.activity();h.advance(800);h.controller.activity();h.advance(800);
  assert.deepEqual(h.changes,[true]);h.advance(200);assert.deepEqual(h.changes,[true,false]);
});
test('held drag and two-pointer gestures cannot restore controls mid-gesture',()=>{
  const h=harness();h.controller.hold();h.controller.hold();h.controller.activity();h.advance(5000);
  assert.deepEqual(h.changes,[true]);h.controller.release();h.advance(5000);assert.deepEqual(h.changes,[true]);
  h.controller.release();h.advance(999);assert.deepEqual(h.changes,[true]);h.advance(1);assert.deepEqual(h.changes,[true,false]);
});
test('escape recovery, preview and unmount cancel stale timers',()=>{
  const h=harness();h.controller.activity(4000);h.advance(1200);assert.deepEqual(h.changes,[true]);
  h.controller.reveal();assert.deepEqual(h.changes,[true,false]);assert.equal(h.jobs.size,0);
  h.controller.activity();h.controller.dispose();h.advance(5000);assert.deepEqual(h.changes,[true,false,true]);assert.equal(h.jobs.size,0);
});
test('blended ink and legacy motion options have bounded idle delays and safe URL defaults',()=>{
  assert.deepEqual(Object.keys(MOTION_PRESETS),['brand','ink','soft','retreat','cut']);
  for(const preset of Object.keys(MOTION_PRESETS)) {assert.equal(motionPreset(preset),preset);assert.ok(MOTION_PRESETS[preset].idle>=650&&MOTION_PRESETS[preset].idle<=1300);}
  assert.equal(motionPreset('invalid'),'brand');assert.equal(motionPreset(null),'brand');
});
