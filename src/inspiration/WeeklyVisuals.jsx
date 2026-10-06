import {useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {ArrowsOutCardinal,Crosshair,ImageSquare} from '../icons/index.jsx';
import {weeklyBands,weeklyGallery} from './weeklyLayouts.js';
import './weekly-variants.css';

function Reference({tile,onOpen,suppressClick}) {
  const {item}=tile;
  const [failed,setFailed]=useState(false);
  useEffect(()=>setFailed(false),[item.image]);
  return <button className={`weekly-reference ${item.image&&!failed?'has-preview':'without-preview'}`} data-reference={item.id} aria-label={`Open ${item.title}`} style={{left:tile.x,top:tile.y,width:tile.width,height:tile.height}} onClick={event=>{if(suppressClick?.current&&event.detail!==0){event.preventDefault();return;}onOpen(item,event);}}>
    {item.image&&!failed?<img key={item.image} src={item.image} alt="" loading="lazy" draggable={false} referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:<span className="weekly-reference-missing"><ImageSquare size={24}/><strong>{item.title}</strong><small>Preview unavailable · Open reference</small></span>}
    <span className="weekly-reference-caption"><strong>{item.title}</strong><small>{item.domain} ↗</small></span>
  </button>;
}

export function WeeklyVisuals({items,variant,weekKey,query,onOpen}) {
  const viewport=useRef(),anchor=useRef(),gesture=useRef(),suppressClick=useRef(false);
  const [width,setWidth]=useState(0),[dragging,setDragging]=useState(false);
  const gallery=variant==='v1';
  const layout=useMemo(()=>gallery?weeklyGallery(items,width):weeklyBands(items,width),[gallery,items,width]);
  useLayoutEffect(()=>{
    const node=viewport.current;
    const measure=()=>setWidth(node.clientWidth);
    const observer=new ResizeObserver(measure);observer.observe(node);measure();return()=>observer.disconnect();
  },[]);
  useLayoutEffect(()=>{
    if(!gallery||!width)return;
    const node=viewport.current,key=`${weekKey}:${query}:${width}`;
    if(anchor.current?.key===key)node.scrollTop+=layout.centre-anchor.current.centre;
    else node.scrollTop=layout.centre+24-node.clientHeight/2;
    anchor.current={key,centre:layout.centre};
  },[gallery,layout.centre,width,weekKey,query]);
  function centre(){viewport.current.scrollTo({top:layout.centre+24-viewport.current.clientHeight/2,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});}
  function begin(event){
    if(!gallery||event.pointerType!=='mouse'||event.button!==0)return;
    suppressClick.current=false;
    gesture.current={id:event.pointerId,x:event.clientX,y:event.clientY,scroll:viewport.current.scrollTop,moved:false};
  }
  function move(event){
    const drag=gesture.current;if(!drag||event.pointerId!==drag.id)return;
    if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>6){
      drag.moved=true;suppressClick.current=true;setDragging(true);viewport.current.setPointerCapture(event.pointerId);
    }
    if(drag.moved){event.preventDefault();viewport.current.scrollTop=drag.scroll+drag.y-event.clientY;}
  }
  function end(){gesture.current=null;setDragging(false);}
  const tiles=gallery?layout.tiles:layout.rows?.flatMap(row=>row.tiles)||[];
  return <div className={`weekly-visual-experience variant-${variant}`}>
    <div ref={viewport} className={`weekly-art-viewport ${dragging?'is-dragging':''}`} role="region" aria-label={gallery?'Gallery wall, scroll or drag to explore':'Image bands, scroll to explore'} tabIndex={gallery?0:undefined} onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
      <div className="weekly-art-composition" style={{height:layout.height}}>{tiles.map(tile=><Reference key={tile.item.id} tile={tile} onOpen={onOpen} suppressClick={suppressClick}/>)}</div>
    </div>
    {gallery&&<div className="weekly-gallery-controls"><span><ArrowsOutCardinal size={18}/>Scroll or drag to explore</span><button onClick={centre}>Back to centre <Crosshair size={18}/></button></div>}
  </div>;
}
