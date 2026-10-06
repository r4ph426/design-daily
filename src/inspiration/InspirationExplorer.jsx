import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {ArrowsOutCardinal, ArrowDown, ArrowSquareOut, MagnifyingGlass, Plus, Minus, Star, Shuffle, ArrowCounterClockwise, Play, Pause} from '../icons/index.jsx';
import {boundCamera, fieldLayout, previewAspect, zoomAt, scalePreviewItems} from './exploration.js';
import {MOTION_PRESETS} from './immersion.js';
import {useFieldImmersion} from './useFieldImmersion.js';
import {useFieldDrift} from './useFieldDrift.js';
import './exploration.css';

function VisualTile({item, onOpen, onSave, discovery, failed, onFailure, onAspect, active, style, visualKey=item.id}) {
  return <article className={`exploration-tile ${active ? 'is-active' : ''}`} style={style} data-reference={item.id} data-visual-key={visualKey}>
    <button className="exploration-image" aria-label={`Open ${item.title}`} onClick={event => onOpen(item, event)}>
      {item.image && !failed ? <img src={item.image} alt="" loading="lazy" draggable={false} referrerPolicy="no-referrer"
        onLoad={event => onAspect?.(item.id, event.currentTarget.naturalWidth / event.currentTarget.naturalHeight)} onError={() => onFailure(item.id)}/>
        : <span className="exploration-link"><strong>{item.title}</strong><span>{item.domain}</span><small>{failed ? 'Preview unavailable. Open the saved reference.' : 'A saved link, without a preview.'}</small></span>}
    </button>
    <div className="exploration-caption"><span>{item.title}</span><ArrowSquareOut size={16} aria-hidden="true"/>
      <button aria-label={discovery ? `Save ${item.title} for me` : `${item.favourite ? 'Unfavourite' : 'Favourite'} ${item.title}`} aria-pressed={discovery ? undefined : item.favourite} onClick={() => onSave(item)}>
        {discovery ? <Plus size={20}/> : <Star size={20} weight={item.favourite ? 'fill' : 'regular'}/>}</button>
    </div>
  </article>;
}

export function InspirationExplorer({abundance=false,onExitPreview,mode, memory, items, tab, onTab, onMode, onOpen, onSave, query, onQuery, onCapture, motion, onMotion, wandering, onWandering, revealRef, blocked}) {
  const initialScale=abundance ? .4 : .85;
  const displayedItems=abundance?scalePreviewItems(items):items;
  const ink=mode==='field'&&motion==='ink';
  const [chromeHeight,setChromeHeight]=useState(180);
  const [driftOn,setDriftOn]=useState(()=>sessionStorage.getItem('inspiration-drift')!=='off');
  const driftPause=useRef({blocked,hover:false}); driftPause.current.blocked=blocked;
  const worldNode=useRef();
  const immersion=useFieldImmersion({mode,preset:motion,blocked,onChange:onWandering,revealRef});
  const [failed, setFailed] = useState(new Set()), [aspects, setAspects] = useState({}), [camera, setCamera] = useState(()=>memory.current.camera||{x:-110, y:0, scale:initialScale}), [active, setActive] = useState(null);
  const viewport = useRef(), world = {...fieldLayout(displayedItems, aspects, {width:abundance?4200:1860,top:chromeHeight/initialScale}),minScale:abundance ? .3 : .55}, frame = useRef({width:1, height:1}), cameraRef = useRef(camera), worldRef = useRef(world), pointers = useRef(new Map()), gesture = useRef(null), suppressClick = useRef(false), savedScroll = useRef(memory.current.scroll||0);
  worldRef.current = world;
  function setPosition(next, drifting=false) {
    cameraRef.current = boundCamera(next, frame.current, worldRef.current);
    if(drifting) {paint();memory.current.camera=cameraRef.current;} else setCamera(cameraRef.current);
  }
  function paint() {const c=cameraRef.current;if(worldNode.current)worldNode.current.style.transform=`translate(${c.x}px, ${c.y}px) scale(${c.scale})`;}
  useLayoutEffect(paint);
  const drift=useFieldDrift({enabled:mode==='field'&&driftOn, paused:()=>driftPause.current.blocked||driftPause.current.hover||pointers.current.size>0||!!document.activeElement?.matches('a:focus-visible,button:focus-visible,input,textarea,select'), camera:()=>cameraRef.current, frame:()=>frame.current, world:()=>worldRef.current, onMove:next=>setPosition(next,true)});
  function interact() {drift.handled();}
  function hoverControls(value) {driftPause.current.hover=value;interact();}
  function toggleDrift(event) {const next=!driftOn;setDriftOn(next);sessionStorage.setItem('inspiration-drift',next?'on':'off');if(event.detail)event.currentTarget.blur();interact();}
  function showField() {if(mode==='field')window.scrollTo({top:0,behavior:'instant'});}
  function zoom(scale, point = {x:frame.current.width/2, y:frame.current.height/2}) { interact(); showField(); immersion.activity(); setPosition(zoomAt(cameraRef.current, scale, point, frame.current, worldRef.current)); }
  function reset() { interact(); showField(); setPosition({x:-110, y:0, scale:initialScale}); setActive(null); }
  function centre(tile) { setPosition({scale:cameraRef.current.scale, x:frame.current.width/2-(tile.x+tile.width/2)*cameraRef.current.scale, y:frame.current.height/2-(tile.y+tile.height/2)*cameraRef.current.scale}); }
  const signature = `${abundance?'preview':'collection'}:${items.map(item=>item.id).join('|')}`;
  useEffect(() => {if(memory.current.signature!==signature){setActive(null);reset();}memory.current.signature=signature;}, [signature]);
  useEffect(()=>{memory.current.camera=camera;},[camera]);
  useLayoutEffect(() => {
    if(mode !== 'field' || !viewport.current) return;
    const node = viewport.current;
    const header=node.closest('.inspiration-shell').querySelector('.prototype-header');
    const shell=node.closest('.inspiration-shell'),toolbar=node.parentElement.querySelector('.exploration-toolbar');
    const measure = () => { if(!node.clientWidth)return; setChromeHeight(header.offsetHeight+toolbar.offsetHeight); shell.style.setProperty('--field-header-height', `${header.offsetHeight}px`); shell.style.setProperty('--field-toolbar-height', `${toolbar.offsetHeight}px`); shell.style.setProperty('--field-dock-height', `${dock.offsetHeight}px`); frame.current = {width:node.clientWidth, height:node.clientHeight}; setPosition(cameraRef.current); };
    const dock = node.parentElement.querySelector('.exploration-dock');
    const measureDock = () => {node.style.setProperty('--explorer-dock', `${dock.offsetHeight + 2}px`); measure();};
    const observer = new ResizeObserver(measure); observer.observe(node); observer.observe(header); observer.observe(toolbar); const dockObserver = new ResizeObserver(measureDock); dockObserver.observe(dock); window.addEventListener('resize', measureDock); measureDock();
    // Nonpassive listener belongs only to the explicitly entered field, not the page.
    const wheel = event => {event.preventDefault();interact(); if(!event.deltaX&&!event.deltaY)return; immersion.activity('pointer'); const factor = event.deltaMode === 1 ? 16 : 1; if(event.ctrlKey || event.metaKey) {const rect = node.getBoundingClientRect(); zoom(cameraRef.current.scale * Math.exp(-event.deltaY * .003), {x:event.clientX-rect.left, y:event.clientY-rect.top});} else {setPosition({...cameraRef.current, x:cameraRef.current.x-event.deltaX*factor, y:cameraRef.current.y-event.deltaY*factor});} };
    node.addEventListener('wheel', wheel, {passive:false});
    return () => {observer.disconnect(); dockObserver.disconnect(); window.removeEventListener('resize', measureDock); node.removeEventListener('wheel', wheel);};
  }, [mode]);
  useEffect(() => {if(mode === 'field') setPosition(cameraRef.current);}, [aspects]);
  useLayoutEffect(() => {const restore=requestAnimationFrame(()=>window.scrollTo({top:mode==='wall'?savedScroll.current:0,behavior:'instant'})); return ()=>cancelAnimationFrame(restore);}, [mode]);
  function chooseMode(value) {if(mode === 'wall') savedScroll.current = window.scrollY; memory.current.scroll=savedScroll.current; onMode(value);}
  function point(event) { const rect = viewport.current.getBoundingClientRect(); return {x:event.clientX-rect.left, y:event.clientY-rect.top}; }
  function begin(event) {
    if(event.button && event.button !== 0) return;
    if(event.target.closest('.exploration-caption button')) return;
    interact();
    pointers.current.set(event.pointerId, point(event));
    immersion.hold();
    suppressClick.current = false;
    gesture.current = {start:point(event), camera:cameraRef.current, distance:null, moved:false};
    if(pointers.current.size===2) {const [a,b]=[...pointers.current.values()]; gesture.current.distance=Math.hypot(a.x-b.x,a.y-b.y); gesture.current.midpoint={x:(a.x+b.x)/2,y:(a.y+b.y)/2}; gesture.current.camera=cameraRef.current;}
  }
  function move(event) {
    if(!pointers.current.has(event.pointerId)) {if(event.clientY<28||event.clientY>window.innerHeight-28)immersion.reveal();return;}
    const current=point(event); pointers.current.set(event.pointerId,current); const g=gesture.current;
    if(pointers.current.size===2 && g.distance) {immersion.activity('pointer');const [a,b]=[...pointers.current.values()]; const scale=Math.max(worldRef.current.minScale,Math.min(1.65,g.camera.scale*Math.hypot(a.x-b.x,a.y-b.y)/g.distance)), ratio=scale/g.camera.scale; setPosition({scale,x:(a.x+b.x)/2-(g.midpoint.x-g.camera.x)*ratio,y:(a.y+b.y)/2-(g.midpoint.y-g.camera.y)*ratio}); g.moved=true;}
    else if(pointers.current.size===1) {const dx=current.x-g.start.x,dy=current.y-g.start.y; if(Math.hypot(dx,dy)>5) g.moved=true; if(g.moved) {immersion.activity('pointer');viewport.current.setPointerCapture(event.pointerId); setPosition({...g.camera,x:g.camera.x+dx,y:g.camera.y+dy});}}
  }
  function end(event) {
    if(!pointers.current.has(event.pointerId))return;
    interact();immersion.release();
    suppressClick.current = !!gesture.current?.moved; pointers.current.delete(event.pointerId);
    if(pointers.current.size) gesture.current={start:[...pointers.current.values()][0],camera:cameraRef.current,distance:null,moved:true};
    else gesture.current=null;
  }
  function key(event) {
    interact();
    if(event.target !== viewport.current) return;
    showField();
    const directions={ArrowLeft:[120,0],ArrowRight:[-120,0],ArrowUp:[0,120],ArrowDown:[0,-120]};
    if(directions[event.key]) {event.preventDefault(); immersion.activity(); const [dx,dy]=directions[event.key]; setPosition({...cameraRef.current,x:cameraRef.current.x+dx,y:cameraRef.current.y+dy});}
    else if(['+','=','-','Home'].includes(event.key)) {event.preventDefault(); if(event.key==='Home') reset(); else zoom(cameraRef.current.scale*(event.key==='-'?.85:1.15));}
  }
  function focusTile(event) {
    if(!event.target.matches(':focus-visible')) return;
    const id=event.target.closest('[data-visual-key]')?.dataset.visualKey, tile=worldRef.current.tiles.find(t=>t.key===id);
    if(tile) {interact();setActive(id); centre(tile);}
  }
  function wander() {interact();showField(); immersion.activity(); const tiles=worldRef.current.tiles.filter(t=>t.key!==active); const tile=tiles[Math.floor(Math.random()*tiles.length)]; if(tile) {setActive(tile.key); centre(tile);}}
  function preview(event) {interact();if(event.detail)event.currentTarget.blur();immersion.preview();}
  function onAspect(id, aspect) {setAspects(previous => previous[id] === aspect ? previous : {...previous,[id]:aspect});}
  const tileProps={onOpen,onSave,discovery:tab==='discoveries',onFailure:id=>setFailed(previous=>new Set([...previous,id])),onAspect:mode==='field'?onAspect:undefined};
  return <section className={`inspiration-explorer mode-${mode}`} aria-label={mode==='field'?'Explorable reference field':'Visual reference wall'}>
    {abundance&&<aside className="abundance-notice" aria-label="Temporary scale preview" onPointerEnter={()=>{hoverControls(true);immersion.reveal();}} onPointerLeave={()=>hoverControls(false)}><span>Scale preview: {displayedItems.length} tiles from {items.length} references, repeated.</span><button onClick={()=>{hoverControls(false);onExitPreview();}}>Return to my collection</button></aside>}
    {ink&&<><div className="field-toolbar-plate" aria-hidden="true"/><div className="field-dock-plate" aria-hidden="true"/></>}
    <div className="exploration-toolbar" inert={wandering&&!ink||undefined} aria-hidden={wandering&&!ink||undefined} onPointerEnter={()=>{hoverControls(true);immersion.reveal();}} onPointerLeave={()=>hoverControls(false)}>
      <h1>{abundance?'Scale preview':'What I came across'}</h1>
      <nav aria-label="Collection"><button aria-pressed={tab==='personal'} onClick={()=>onTab('personal')}>My captures</button><button aria-pressed={tab==='discoveries'} onClick={()=>onTab('discoveries')}>Discovered for me</button></nav>
      <label className="exploration-search"><MagnifyingGlass size={18} aria-hidden="true"/><input aria-label="Search visual references" type="search" placeholder="Search…" value={query} onChange={event=>onQuery(event.target.value)}/></label>
      <button className="exploration-capture" onClick={onCapture}>Capture links <Plus size={16}/></button>
    </div>
    {mode==='field'? <div ref={viewport} className="exploration-viewport" tabIndex={0} role="region" aria-label="Scroll or drag to explore references. Arrow keys move; plus and minus zoom; Home resets. Escape shows navigation." onKeyDown={key} onFocusCapture={focusTile} onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
      onClickCapture={event=>{if(suppressClick.current){event.preventDefault();event.stopPropagation();suppressClick.current=false;}}}>
      <div ref={worldNode} className="exploration-world" style={{width:world.width,height:Math.max(0,world.height),'--field-scale':camera.scale,transform:`translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`}}>
        {world.tiles.map(tile=><VisualTile key={tile.key} visualKey={tile.key} {...tileProps} item={tile.item} failed={failed.has(tile.item.id)} active={active===tile.key} style={{left:tile.x,top:tile.y,width:tile.width,height:tile.height}}/>)}
      </div>
      {!items.length&&<p className="exploration-empty">{query?'Nothing matches this search.':'Capture a reference to start exploring.'}</p>}
    </div> : <div className="exploration-wall">{items.map((item,index)=><VisualTile key={item.id} {...tileProps} item={item} failed={failed.has(item.id)} style={{'--preview-ratio':previewAspect(item,index,aspects)}}/>)}</div>}
    {mode==='wall'&&!items.length&&<p className="exploration-empty">{query?'Nothing matches this search.':'Capture a reference to start exploring.'}</p>}
    <div className="exploration-dock" inert={wandering&&!ink||undefined} aria-hidden={wandering&&!ink||undefined} onPointerEnter={()=>{hoverControls(true);immersion.reveal();}} onPointerLeave={()=>hoverControls(false)}>
      <p>{mode==='field'?<ArrowsOutCardinal size={20}/>:<ArrowDown size={20}/>}<span>{mode==='field'?'Scroll or drag to wander':'Scroll to keep exploring'}</span></p>
      <nav aria-label="Browsing style">{mode==='wall'&&<><button onClick={()=>chooseMode('field')}>Field</button><button aria-pressed>Wall</button></>}<button onClick={()=>chooseMode('index')}>Index</button></nav>
      {mode==='field'&&<><div className="field-motion-control">{['ink','brand'].includes(motion)?<button className="field-preview-label" onClick={preview} title="Preview navigation for four seconds">Preview navigation <Play size={18}/></button>:<><label htmlFor="field-motion">Motion</label><select id="field-motion" aria-label="Motion behaviour" value={motion} onChange={event=>onMotion(event.target.value)}>{Object.entries(MOTION_PRESETS).map(([value,preset])=><option key={value} value={value}>{preset.label}</option>)}</select><button onClick={preview} aria-label="Preview motion" title="Preview motion for four seconds"><Play size={18}/></button></>}</div><div className="exploration-camera"><button onClick={toggleDrift} aria-pressed={driftOn} aria-label={driftOn?'Pause drift':'Resume drift'} title={driftOn?'Pause drift':'Resume drift'}>{driftOn?<Pause size={18}/>:<Play size={18}/>}</button><button onClick={wander} aria-label="Wander to another reference" title="Wander to another reference"><Shuffle size={20}/></button><button onClick={()=>{reset();immersion.activity();}} aria-label="Reset field" title="Reset field"><ArrowCounterClockwise size={20}/></button><button onClick={()=>zoom(cameraRef.current.scale*.85)} aria-label="Zoom out"><Minus size={18}/></button><span aria-live="polite">{Math.round(camera.scale*100)}%</span><button onClick={()=>zoom(cameraRef.current.scale*1.15)} aria-label="Zoom in"><Plus size={18}/></button></div></>}
      {mode==='wall'&&<span className="exploration-hint">Open a reference for its story.</span>}
    </div>
  </section>;
}
