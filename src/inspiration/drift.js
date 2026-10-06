import {boundCamera,clamp} from './exploration.js';

export const DRIFT_DELAY = 3000;
export const DRIFT_SPEED = 12; // Screen pixels per second, independent of zoom.
export const createDrift = () => ({heading:-2.35,target:-2.35,next:10,time:0,amount:0});

// Follow photogRAPHI's changing heading and exponential easing, within a finite field.
export function stepDrift(state, camera, frame, world, elapsed, floating, random=Math.random) {
  const dt=clamp(elapsed,0,.05); // Never jump after a hidden tab or stalled frame.
  state.time+=dt;
  state.amount+=(Number(floating)-state.amount)*(1-Math.exp(-(floating ? .5 : 6)*dt));
  if(!floating||state.amount<.001)return camera;
  if(state.time>state.next) {state.target=state.heading+(random()<.5?-1:1)*(.6+random()*1.8);state.next=state.time+8+random()*7;}
  state.heading+=(state.target-state.heading)*(1-Math.exp(-.35*dt))+Math.sin(state.time*.23)*.05*dt;
  const speed=DRIFT_SPEED*state.amount*dt;
  const proposed={...camera,x:camera.x+Math.cos(state.heading)*speed,y:camera.y+Math.sin(state.heading)*speed};
  const next=boundCamera(proposed,frame,world);
  const horizontal=world.width*camera.scale>frame.width,vertical=world.height*camera.scale>frame.height;
  if((horizontal&&Math.abs(next.x-proposed.x)>.001)||(vertical&&Math.abs(next.y-proposed.y)>.001)) {
    let x=Math.cos(state.heading),y=Math.sin(state.heading);
    if(horizontal&&Math.abs(next.x-proposed.x)>.001)x=-x;
    if(vertical&&Math.abs(next.y-proposed.y)>.001)y=-y;
    state.heading=state.target=Math.atan2(y,x);
  }
  return next;
}
