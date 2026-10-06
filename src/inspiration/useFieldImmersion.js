import {useEffect,useRef} from 'react';
import {createIdleController,MOTION_PRESETS} from './immersion.js';

export function useFieldImmersion({mode,preset,blocked,onChange,revealRef}) {
  const controller=useRef(), blockedRef=useRef(blocked);
  blockedRef.current=blocked;
  useEffect(()=>{
    onChange(false);
    if(mode!=='field')return;
    const idle=createIdleController({onChange,delay:MOTION_PRESETS[preset].idle});
    controller.current=idle;revealRef.current=()=>idle.reveal();
    const recover=event=>{if(event.key==='Escape'||event.key==='Tab')idle.reveal();};
    window.addEventListener('keydown',recover,true);
    return()=>{idle.dispose();controller.current=null;revealRef.current=null;window.removeEventListener('keydown',recover,true);};
  },[mode,preset,onChange,revealRef]);
  useEffect(()=>{if(blocked)controller.current?.reveal();},[blocked]);
  return {
    activity(source){
      const focused=document.activeElement;
      const inControls=focused?.closest('.prototype-header,.exploration-toolbar,.exploration-dock');
      if(blockedRef.current){controller.current?.reveal();return;}
      if(source==='pointer'&&inControls)focused.blur();
      else if(inControls&&focused.matches(':focus-visible')){controller.current?.reveal();return;}
      controller.current?.activity();
    },
    hold:()=>controller.current?.hold(),
    release:()=>controller.current?.release(),
    reveal:()=>controller.current?.reveal(),
    preview:()=>{if(!blockedRef.current)controller.current?.activity(4000);},
  };
}
