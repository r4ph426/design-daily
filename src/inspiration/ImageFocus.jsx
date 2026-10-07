import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowSquareOut,X,Plus,Info,MagnifyingGlassPlus,MagnifyingGlassMinus} from '../icons/index.jsx';
import {fitImage,referenceSource,tidyTags,videoControlZone} from './focus.js';
import './image-focus.css';

const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
const easing='cubic-bezier(.2,.7,.2,1)';

export function ImageFocus({item,sequence,origin,onClose,onStep,onRelated,onPatch,suggestedTags=[],error}) {
  const cursor=useRef(),cursorLabel=useRef(),pointer=useRef(),dialog=useRef(),dock=useRef(),stage=useRef(),frame=useRef(),scroll=useRef(),image=useRef(),tagInput=useRef(),tagButton=useRef(),infoButton=useRef();
  const [finePointer,setFinePointer]=useState(()=>matchMedia('(hover:hover) and (pointer:fine)').matches);
  const [area,setArea]=useState({width:innerWidth,height:innerHeight-140}),[dockHeight,setDockHeight]=useState(64);
  const [size,setSize]=useState({width:origin?.naturalWidth||1,height:origin?.naturalHeight||1});
  const [loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false),[zoom,setZoom]=useState(1);
  const [editing,setEditing]=useState(false),[information,setInformation]=useState(false),[draft,setDraft]=useState(''),[saving,setSaving]=useState(false),[undo,setUndo]=useState(null),[feedback,setFeedback]=useState('');
  const closing=useRef(false),animated=useRef(false),entrance=useRef(),points=useRef(new Map()),gesture=useRef(),pinch=useRef(),skipClick=useRef(false),working=useRef(false),restingZoom=useRef(1),zoomAnchor=useRef();
  const video=item.video||item.providerRefs?.find(p=>p.video)?.video;
  const source=referenceSource(item),tags=item.tags||[],index=sequence.findIndex(i=>i.id===item.id);
  const fitted=fitImage(size.width,size.height,Math.max(1,area.width-(area.width>720?96:24)),Math.max(1,area.height-32));
  const canPrevious=index>0,canNext=index>=0&&index<sequence.length-1;
  const cursorEnabled=finePointer&&!!(item.image||video)&&!failed&&!editing&&!information&&zoom<=restingZoom.current*1.01;
  const clampZoom=value=>Math.min(Math.max(4,restingZoom.current*2),Math.max(1,value));
  function step(direction){if(working.current||closing.current)return;if(direction<0&&!canPrevious||direction>0&&!canNext)return;onStep(sequence[index+direction]);}

  useEffect(()=>{
    const media=matchMedia('(hover:hover) and (pointer:fine)');
    const changed=()=>{setFinePointer(media.matches);hideCursor();};
    media.addEventListener('change',changed);
    return()=>media.removeEventListener('change',changed);
  },[]);
  useEffect(()=>{if(!cursorEnabled||saving)hideCursor();else if(pointer.current)showCursor(pointer.current);},[cursorEnabled,saving,item.id]);
  function overVideoControls(event){return videoControlZone(event,stage.current?.querySelector("video")?.getBoundingClientRect());}
  function hideCursor(){cursor.current?.classList.remove('is-visible');}
  function cursorZone(x){const view=stage.current.getBoundingClientRect(),position=(x-view.left)/view.width;return position<1/3?'previous':position>2/3?'next':'close';}
  function showCursor(event){
    pointer.current={clientX:event.clientX,clientY:event.clientY,pointerType:event.pointerType};
    stage.current?.classList.toggle("over-video-controls",overVideoControls(event));
    if(!cursorEnabled||event.pointerType!=='mouse'||saving||closing.current||event.buttons||points.current.size||overVideoControls(event)||event.target?.closest('a,button,input,textarea,select')){hideCursor();return;}
    const view=stage.current.getBoundingClientRect();if(event.clientX<view.left||event.clientX>view.right||event.clientY<view.top||event.clientY>view.bottom){hideCursor();return;}
    const zone=cursorZone(event.clientX),disabled=zone==='previous'&&!canPrevious||zone==='next'&&!canNext;
    const node=cursor.current;if(!node)return;
    node.style.transform=`translate3d(${event.clientX}px,${event.clientY}px,0)`;
    node.dataset.action=zone;node.dataset.disabled=disabled?'true':'false';
    cursorLabel.current.textContent=disabled?(zone==='previous'?'First image':'Last image'):zone==='previous'?'Previous':zone==='next'?'Next':'Close';
    node.classList.add('is-visible');
  }
  function stageClick(event){
    if(!cursorEnabled||pointer.current?.pointerType!=='mouse'||event.detail===0||overVideoControls(event)||event.target.closest('a,button,input,textarea,select'))return;
    event.preventDefault();event.stopPropagation();if(skipClick.current||working.current||closing.current)return;
    const zone=cursorZone(event.clientX);
    if(zone==='close'){hideCursor();void leave();}else step(zone==='previous'?-1:1);
  }

  useLayoutEffect(()=>{
    const body=document.body,previous={overflow:body.style.overflow,paddingRight:body.style.paddingRight};
    const scrollbar=innerWidth-document.documentElement.clientWidth;
    if(scrollbar)body.style.paddingRight=`${parseFloat(getComputedStyle(body).paddingRight)+scrollbar}px`;
    body.style.overflow='hidden';dialog.current.showModal();
    const measure=()=>{setArea({width:stage.current.clientWidth,height:stage.current.clientHeight});setDockHeight(dock.current.offsetHeight);};
    const observer=new ResizeObserver(measure);observer.observe(stage.current);observer.observe(dock.current);measure();
    return()=>{observer.disconnect();body.style.overflow=previous.overflow;body.style.paddingRight=previous.paddingRight;};
  },[]);
  useLayoutEffect(()=>{
    entrance.current?.cancel();setZoom(1);setLoaded(false);setFailed(false);setEditing(false);setInformation(false);setDraft('');setUndo(null);setFeedback('');
    points.current.clear();scroll.current.classList.remove('is-dragging');gesture.current=null;pinch.current=null;zoomAnchor.current=null;
    scroll.current.scrollTo({top:0,left:0});
    if(image.current?.complete&&image.current.naturalWidth)ready();
  },[item.id]);
  useLayoutEffect(()=>{if(!loaded)return;const previous=restingZoom.current;const next=size.height/size.width>2.1?Math.max(1,(area.width-(area.width>720?96:24))/fitted.width):1;restingZoom.current=next;if(Math.abs(zoom-previous)<.01)setZoom(next);},[area.width,area.height]);
  useEffect(()=>{if(editing)tagInput.current?.focus({preventScroll:true});},[editing]);
  useEffect(()=>{
    if(!loaded||!frame.current||reduced())return;
    const node=frame.current,destination=node.getBoundingClientRect();
    if(!animated.current&&origin?.width){
      const scale=Math.max(origin.width/destination.width,origin.height/destination.height);
      const side=Math.max(0,(destination.width-origin.width/scale)/2),bottom=Math.max(0,destination.height-origin.height/scale);
      entrance.current=node.animate([
        {transform:`translate(${origin.left-side*scale-destination.left}px,${origin.top-destination.top}px) scale(${scale})`,clipPath:`inset(0px ${side}px ${bottom}px ${side}px)`},
        {transform:'none',clipPath:'inset(0px)'}
      ],{duration:350,easing});
    }else entrance.current=node.animate([{opacity:.35,transform:'translateX(12px)'},{opacity:1,transform:'none'}],{duration:180,easing});
    animated.current=true;
  },[loaded,item.id]);
  function ready(){
    const img=image.current;if(!img||(video?!img.videoWidth:!img.naturalWidth))return;
    const width=stage.current.clientWidth-(stage.current.clientWidth>720?96:24),height=stage.current.clientHeight-32;
    const fit=fitImage(img.naturalWidth||img.videoWidth,img.naturalHeight||img.videoHeight,Math.max(1,width),Math.max(1,height));
    restingZoom.current=(img.naturalHeight||img.videoHeight)/(img.naturalWidth||img.videoWidth)>2.1?Math.max(1,width/fit.width):1;
    setSize({width:img.naturalWidth||img.videoWidth,height:img.naturalHeight||img.videoHeight});setZoom(restingZoom.current);setLoaded(true);
  }
  function zoomAround(value,point){
    const bounds=frame.current?.getBoundingClientRect(),view=stage.current.getBoundingClientRect();
    const anchor=point||{x:view.left+view.width/2,y:view.top+view.height/2};
    if(bounds)zoomAnchor.current={x:anchor.x,y:anchor.y,fx:(anchor.x-bounds.left)/bounds.width,fy:(anchor.y-bounds.top)/bounds.height};
    setZoom(clampZoom(value));
  }
  useLayoutEffect(()=>{
    const anchor=zoomAnchor.current,bounds=frame.current?.getBoundingClientRect();
    if(anchor&&bounds){scroll.current.scrollLeft+=bounds.left+anchor.fx*bounds.width-anchor.x;scroll.current.scrollTop+=bounds.top+anchor.fy*bounds.height-anchor.y;}
    zoomAnchor.current=null;
  },[zoom]);
  async function leave(after=onClose){
    if(closing.current||working.current)return;closing.current=true;entrance.current?.cancel();
    if(!reduced()){
      const target=document.querySelector(`[data-reference="${CSS.escape(item.id)}"]`),back=target?.getBoundingClientRect(),node=frame.current;
      let animation;
      if(node&&zoom===1&&back?.width&&back.top<innerHeight&&back.bottom>0){
        const current=node.getBoundingClientRect(),scale=Math.max(back.width/current.width,back.height/current.height),side=Math.max(0,(current.width-back.width/scale)/2),bottom=Math.max(0,current.height-back.height/scale);
        animation=node.animate([{transform:'none',clipPath:'inset(0px)'},{transform:`translate(${back.left-side*scale-current.left}px,${back.top-current.top}px) scale(${scale})`,clipPath:`inset(0px ${side}px ${bottom}px ${side}px)`}],{duration:240,easing,fill:'forwards'});
      }else animation=dialog.current.animate([{opacity:1},{opacity:0}],{duration:160,easing,fill:'forwards'});
      dialog.current.classList.add('is-leaving');await animation.finished.catch(()=>{});
    }
    after();
  }
  function toggleZoom(){zoomAround(zoom>1?1:Math.max(2,restingZoom.current));}
  function inspectImage(event){zoomAround(zoom<=restingZoom.current?Math.max(restingZoom.current,zoom*2):restingZoom.current,{x:event.clientX,y:event.clientY});}
  function resetPanel(setter,button){setter(false);requestAnimationFrame(()=>button.current?.focus({preventScroll:true}));}
  async function saveTags(next){
    if(working.current)return;const previous=[...tags],values=tidyTags(next);if(JSON.stringify(previous)===JSON.stringify(values)){setDraft('');setFeedback('Tag already added');return;}working.current=true;setSaving(true);setFeedback('');
    try {const result=await onPatch(item,{tags:values});if(result){setUndo(previous);setFeedback('Tags saved');setDraft('');}else setFeedback('Could not save tags. Try again.');}
    finally{working.current=false;setSaving(false);}
  }
  async function restoreTags(){const previous=undo;if(!previous||working.current)return;working.current=true;setSaving(true);try{if(await onPatch(item,{tags:previous})){setUndo(null);setFeedback('Change undone');}}finally{working.current=false;setSaving(false);}}
  function cancel(event){event.preventDefault();if(editing)resetPanel(setEditing,tagButton);else if(information)resetPanel(setInformation,infoButton);else void leave();}
  function key(event){
    if(event.target.closest('video,input,textarea,select,[contenteditable=true]')||editing||information)return;
    if(event.key==='ArrowLeft'){event.preventDefault();step(-1);}if(event.key==='ArrowRight'){event.preventDefault();step(1);}
  }
  function distance(){const [a,b]=[...points.current.values()];return a&&b?Math.hypot(a.x-b.x,a.y-b.y):0;}
  function down(event){
    if(event.button!==0)return;skipClick.current=false;if(event.target.closest("video"))return;hideCursor();if(zoom>1)scroll.current.classList.add('is-dragging');points.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(points.current.size===1)gesture.current={x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,moved:false,pinched:false};
    if(points.current.size===2){gesture.current.pinched=true;pinch.current={distance:distance(),zoom};}
  }
  function move(event){
    if(!points.current.has(event.pointerId))return;points.current.set(event.pointerId,{x:event.clientX,y:event.clientY});const g=gesture.current;if(!g)return;
    if(Math.hypot(event.clientX-g.x,event.clientY-g.y)>6){g.moved=true;event.currentTarget.setPointerCapture(event.pointerId);}
    if(points.current.size===2&&pinch.current?.distance){const [a,b]=[...points.current.values()];zoomAround(pinch.current.zoom*distance()/pinch.current.distance,{x:(a.x+b.x)/2,y:(a.y+b.y)/2});}
    else if(zoom>1){scroll.current.scrollLeft-=event.clientX-g.lastX;scroll.current.scrollTop-=event.clientY-g.lastY;}
    g.lastX=event.clientX;g.lastY=event.clientY;
  }
  function up(event){
    const g=gesture.current;points.current.delete(event.pointerId);skipClick.current=!!g&&(g.moved||g.pinched);
    if(event.type==='pointerup'&&event.pointerType==='touch'&&zoom<=restingZoom.current*1.01&&!g?.pinched&&g?.moved&&Math.abs(event.clientX-g.x)>60&&Math.abs(event.clientX-g.x)>Math.abs(event.clientY-g.y)*1.5)step(event.clientX<g.x?1:-1);
    if(!points.current.size){gesture.current=null;pinch.current=null;scroll.current.classList.remove('is-dragging');if(event.type==='pointerup')showCursor(event);}
  }
  return <dialog ref={dialog} className="image-focus" aria-labelledby="image-focus-title" onCancel={cancel} onKeyDown={key} onClick={event=>{if(event.target===dialog.current)void leave();}}>
    <header className="image-focus-heading"><h2 id="image-focus-title">{item.title}</h2><button autoFocus aria-label="Close image" disabled={saving} onClick={()=>void leave()}><X size={22}/></button></header>
    <div ref={stage} className={`image-focus-stage ${cursorEnabled?'has-action-cursor':''}`} onPointerMoveCapture={showCursor} onPointerLeave={()=>{pointer.current=null;hideCursor();}} onClickCapture={stageClick}>
      <div ref={scroll} className={`image-focus-scroll ${zoom>1?'is-zoomed':''}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <div className="image-focus-plane" style={{width:`max(100%, ${fitted.width*zoom}px)`,height:`max(100%, ${fitted.height*zoom}px)`}} onClick={event=>{if(skipClick.current)return;if(event.target===event.currentTarget)void leave();}}>
          {item.image&&!failed?<div ref={frame} className={`image-focus-frame ${loaded?'is-loaded':''}`} style={{width:fitted.width*zoom,height:fitted.height*zoom}}><img ref={image} key={item.image} src={item.image} alt={item.title} referrerPolicy="no-referrer" draggable={false} onLoad={ready} onError={()=>setFailed(true)} onClick={event=>{if(!skipClick.current)inspectImage(event);}}/></div>:video&&!failed?<div ref={frame} className={`image-focus-frame ${loaded?"is-loaded":""}`} style={{width:fitted.width,height:fitted.height}}><video ref={image} key={video} src={video} controls playsInline preload="metadata" aria-label={item.title} onLoadedMetadata={ready} onError={()=>setFailed(true)}/></div>:<div className="image-focus-unavailable"><p>{item.providerRefs?.some(p=>p.video)?'Video reference':'Preview unavailable'}</p>{source&&<a href={source.href} target="_blank" rel="noopener noreferrer">Open source <ArrowSquareOut size={16}/></a>}</div>}
        </div>
      </div>
      {item.image&&!loaded&&!failed&&<p className="image-focus-loading" role="status">Loading image…</p>}
    </div>
    <footer ref={dock} className="image-focus-dock">
      <div className="image-focus-source">{source&&<a href={source.href} target="_blank" rel="noopener noreferrer" aria-label={`Open source on ${source.label}`}>{source.label}<ArrowSquareOut size={16}/></a>}</div>
      <div className="image-focus-tags">{tags.slice(0,3).map(tag=><button key={tag} onClick={()=>void leave(()=>onRelated(tag))} title={`Explore references tagged ${tag}`}>#{tag}</button>)}{onPatch&&<button ref={tagButton} aria-label="Edit tags" aria-expanded={editing} disabled={saving} onClick={()=>{setEditing(!editing);setInformation(false);}}><Plus size={17}/><span>Tag</span>{tags.length>3&&<span>{tags.length-3} more</span>}</button>}</div>
      <div className="image-focus-tools">{onPatch&&<button ref={infoButton} aria-label="Show reference context" aria-expanded={information} onClick={()=>{setInformation(!information);setEditing(false);}}><Info size={20}/></button>}{item.image&&!failed&&<button aria-label={zoom>1?'Fit image':'Zoom image'} aria-pressed={zoom>1} onClick={toggleZoom}>{zoom>1?<MagnifyingGlassMinus size={20}/>:<MagnifyingGlassPlus size={20}/>}</button>}<button aria-label="Previous image" disabled={!canPrevious||saving} onClick={()=>step(-1)}><ArrowLeft size={20}/></button><span className="image-focus-count">{index>=0?`${index+1} / ${sequence.length}`:'1 / 1'}</span><button aria-label="Next image" disabled={!canNext||saving} onClick={()=>step(1)}><ArrowRight size={20}/></button></div>
    </footer>
    {editing&&<section className="image-focus-panel" style={{bottom:dockHeight+12}} aria-label="Tag editor"><div className="image-focus-panel-heading"><span>Tags</span><button aria-label="Close tag editor" onClick={()=>resetPanel(setEditing,tagButton)}><X size={18}/></button></div><div className="image-focus-edit-tags">{tags.map(tag=><button key={tag} disabled={saving} aria-label={`Remove tag ${tag}`} onClick={()=>void saveTags(tags.filter(t=>t!==tag))}>#{tag}<X size={12}/></button>)}</div><form onSubmit={event=>{event.preventDefault();if(draft.trim())void saveTags([...tags,draft]);}}><label htmlFor="focus-new-tag" className="image-focus-sr">Add a tag</label><input ref={tagInput} id="focus-new-tag" placeholder="Add a tag…" value={draft} disabled={saving||tags.length>=12} maxLength={48} onChange={event=>setDraft(event.target.value)} list="focus-tag-suggestions" autoComplete="off"/><datalist id="focus-tag-suggestions">{suggestedTags.filter(t=>!tags.includes(t)).map(t=><option key={t} value={t}/>)}</datalist><button aria-label="Add tag" disabled={saving||!draft.trim()||tags.length>=12}><Plus size={19}/></button></form><div className="image-focus-save-status" role="status">{saving?'Saving…':feedback||'Optional. Click a tag on the image to explore related references.'}{undo&&<button disabled={saving} onClick={()=>void restoreTags()}>Undo</button>}</div></section>}
    {information&&<section className="image-focus-panel" style={{bottom:dockHeight+12}} aria-label="Reference context"><div className="image-focus-panel-heading"><span>Reference context</span><button aria-label="Close reference context" onClick={()=>resetPanel(setInformation,infoButton)}><X size={18}/></button></div><p>{item.note||item.description||'No note added.'}</p>{item.providerRefs?.filter(p=>p.url&&p.url!==source?.href).map(p=><a key={`${p.provider}:${p.id}`} href={referenceSource({originalUrl:p.url})?.href} target="_blank" rel="noopener noreferrer">View saved reference on {p.provider}<ArrowSquareOut size={15}/></a>)}</section>}
    {error&&<p className="image-focus-error" style={{bottom:dockHeight+12}} role="alert">{error}</p>}
    <div ref={cursor} className="image-focus-cursor" aria-hidden="true">
      <div className="image-focus-cursor-mark"><ArrowLeft className="cursor-previous" size={144} weight="thin"/><X className="cursor-close" size={144} weight="thin"/><ArrowRight className="cursor-next" size={144} weight="thin"/></div>
      <span ref={cursorLabel}/>
    </div>
    <span className="image-focus-sr">With a mouse, the left third goes back, the middle closes and the right third goes forward. Use the dock to zoom. Arrow keys browse images. Escape returns to the canvas. Tap the image to zoom; drag to inspect it. Tags open related references.</span>
  </dialog>;
}
