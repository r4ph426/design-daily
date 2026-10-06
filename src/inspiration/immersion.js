export const MOTION_PRESETS = {
  brand: {label:'Fixed brand', idle:900},
  ink: {label:'Blended ink', idle:900},
  soft: {label:'Soft fade', idle:1000},
  retreat: {label:'Fade and retreat', idle:1300},
  cut: {label:'Clear cut', idle:650},
};

export function motionPreset(value) { return Object.hasOwn(MOTION_PRESETS,value) ? value : 'brand'; }

// Gestures stay unobstructed even when the pointer pauses while still held.
export function createIdleController({onChange, delay=1000, schedule=setTimeout, cancel=clearTimeout}) {
  let timer, moving=false, held=0, disposed=false;
  const clear=()=>{if(timer!==undefined)cancel(timer);timer=undefined;};
  const change=value=>{if(!disposed&&moving!==value){moving=value;onChange(value);}};
  const settle=wait=>{clear();if(moving&&!held)timer=schedule(()=>{timer=undefined;change(false);},wait);};
  return {
    activity(wait=delay){if(disposed)return;change(true);settle(wait);},
    hold(){if(disposed)return;held++;clear();},
    release(){if(disposed)return;held=Math.max(0,held-1);settle(delay);},
    reveal(){clear();change(false);},
    dispose(){clear();disposed=true;},
  };
}
