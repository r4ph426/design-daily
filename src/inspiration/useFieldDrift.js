import {useEffect,useRef} from 'react';
import {createDrift,stepDrift,DRIFT_DELAY} from './drift.js';

export function useFieldDrift(options) {
  const current=useRef(options),lastInteraction=useRef(performance.now());current.current=options;
  const handled=()=>{lastInteraction.current=performance.now();};
  useEffect(()=>{
    if(!options.enabled)return;
    const preference=matchMedia('(prefers-reduced-motion: reduce)');
    const drift=createDrift();let raf,last=performance.now();
    const reset=()=>{handled();drift.amount=0;};
    const frame=now=>{
      const elapsed=(now-last)/1000;last=now;
      const o=current.current,paused=preference.matches||document.hidden||o.paused();
      if(paused){handled();drift.amount=0;}
      const camera=o.camera();
      const next=stepDrift(drift,camera,o.frame(),o.world(),elapsed,!paused&&now-lastInteraction.current>DRIFT_DELAY);
      if(next.x!==camera.x||next.y!==camera.y)o.onMove(next);
      raf=requestAnimationFrame(frame);
    };
    // Ambient movement never renews the navigation's wandering timer.
    window.addEventListener('keydown',handled,true);
    window.addEventListener('pointerdown',handled,true);
    document.addEventListener('visibilitychange',reset);
    preference.addEventListener('change',reset);
    raf=requestAnimationFrame(frame);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('keydown',handled,true);window.removeEventListener('pointerdown',handled,true);document.removeEventListener('visibilitychange',reset);preference.removeEventListener('change',reset);};
  },[options.enabled]);
  return {handled};
}
