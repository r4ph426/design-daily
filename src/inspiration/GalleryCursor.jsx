import {useEffect,useRef} from 'react';
import './gallery-cursor.css';

// Scoped to the weekly art surface; controls and focused image actions keep their own cursors.
export function GalleryCursor({scope,blocked=false}) {
  const dot=useRef();
  useEffect(()=>{
    const root=scope.current,node=dot.current;
    const media=matchMedia('(hover:hover) and (pointer:fine)');
    let pointer=null;
    function hide(){node.classList.remove('is-visible','is-over-reference');root?.classList.remove('has-dot-cursor');}
    function paint(){
      if(blocked||!media.matches||!pointer||document.querySelector('dialog[open]')){hide();return;}
      const target=document.elementFromPoint(pointer.x,pointer.y);
      const surface=target?.closest('.weekly-art-viewport,.weekly-wall,.weekly-blank');
      if(!surface||!root?.contains(surface)||target.closest('input,textarea,select,a,button:not(.weekly-reference):not(.weekly-visual),[contenteditable=true]')||surface.classList.contains('is-dragging')){hide();return;}
      node.style.transform=`translate3d(${pointer.x}px,${pointer.y}px,0)`;
      node.classList.toggle('is-over-reference',!!target.closest('.weekly-reference,.weekly-visual'));
      node.classList.add('is-visible');root.classList.add('has-dot-cursor');
    }
    function move(event){if(event.pointerType!=='mouse'||event.buttons){hide();return;}pointer={x:event.clientX,y:event.clientY};paint();}
    function leave(){pointer=null;hide();}
    document.addEventListener('pointermove',move,{passive:true});
    document.addEventListener('pointerleave',leave);
    document.addEventListener('keydown',hide);
    document.addEventListener('visibilitychange',hide);
    window.addEventListener('scroll',paint,{capture:true,passive:true});
    window.addEventListener('blur',leave);
    media.addEventListener('change',hide);
    hide();
    return()=>{
      hide();document.removeEventListener('pointermove',move);document.removeEventListener('pointerleave',leave);
      document.removeEventListener('keydown',hide);document.removeEventListener('visibilitychange',hide);
      window.removeEventListener('scroll',paint,true);window.removeEventListener('blur',leave);media.removeEventListener('change',hide);
    };
  },[scope,blocked]);
  return <div ref={dot} className="gallery-dot-cursor" aria-hidden="true"><span/></div>;
}
