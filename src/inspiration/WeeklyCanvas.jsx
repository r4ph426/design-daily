import {useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,MagnifyingGlass,DotsThree,ImageSquare,X} from '../icons/index.jsx';
import {calendarDate,weekFor,shiftWeek,referenceDate,weekRange,weeklyArchive} from './weeks.js';
import {galleryWall,wallColumns} from './galleryWall.js';
import './weekly.css';
import {WeeklyVisuals} from './WeeklyVisuals.jsx';
const routeLayout=()=>{const value=new URLSearchParams(location.hash.split('?')[1]||'').get('layout');return ['v1','v2','classic'].includes(value)?value:'v2';};
const routeTag=()=>new URLSearchParams(location.hash.split('?')[1]||'').get('tag')||'';
const routeWeek=()=>weekFor(new URLSearchParams(location.hash.split('?')[1]||'').get('week')||new Date())?.key;
function CapturePlus(){return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 2V22M2 12H22"/></svg>;}
function WeekThumbnail({items}) {return <span className="week-thumbnail" aria-hidden="true">{items.filter(i=>i.image).slice(0,12).map(item=><img key={item.id} src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer"/>)}</span>;}
export function WeeklyCanvas({items,onOpen,onCapture,onBrowse,children,message,error,status,activeItem,readOnly=false}) {
  const [variant,setVariant]=useState(routeLayout),[relatedTag,setRelatedTag]=useState(routeTag);
  const [today,setToday]=useState(()=>calendarDate());
  const {current,weeks,groups}=useMemo(()=>weeklyArchive(items,today),[items,today]);
  const [selected,setSelected]=useState(routeWeek),[query,setQuery]=useState(''),[searching,setSearching]=useState(false),[allWeeks,setAllWeeks]=useState(false),[shownWeeks,setShownWeeks]=useState(24);
  const archiveDialog=useRef(),search=useRef(),weekHeading=useRef(),archiveTrigger=useRef(),previousCurrent=useRef(current.key);
  const week=weekFor(selected)||current;
  const entries=(relatedTag?items.filter(i=>i.kind!=='source'&&!i.archived&&(i.tags||[]).includes(relatedTag)):(groups.get(week.key)||[])).filter(i=>!query||[i.title,i.domain,i.note,i.summary,...i.tags,...i.projects].join(' ').toLowerCase().includes(query.toLowerCase()));
  const visualCount=entries.filter(i=>i.image||i.video||i.providerRefs?.some(p=>p.video)).length;
  const [columns,setColumns]=useState(()=>wallColumns(innerWidth));
  const wall=useRef(),wallAnchor=useRef(),weekStrip=useRef();
  const layout=useMemo(()=>galleryWall(entries.length,columns),[entries.length,columns]);
  useEffect(()=>{const resize=()=>setColumns(wallColumns(innerWidth));window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[]);
  useLayoutEffect(()=>{
    const strip=weekStrip.current;
    if(!strip)return;
    const centreActive=()=>{
      const active=strip.querySelector('[aria-current=page]');if(!active)return;
      const a=active.getBoundingClientRect(),s=strip.getBoundingClientRect();
      strip.scrollLeft+=a.left-s.left-(strip.clientWidth-a.width)/2;
    };
    const observer=new ResizeObserver(centreActive);observer.observe(strip);centreActive();
    return()=>observer.disconnect();
  },[week.key,groups]);
  useLayoutEffect(()=>{
    const viewport=wall.current,first=viewport?.querySelector('.weekly-visual');
    if(!viewport||!first){wallAnchor.current=null;return;}
    const tile=first.getBoundingClientRect(),frame=viewport.getBoundingClientRect();
    const centre=tile.top-frame.top+viewport.scrollTop+tile.height/2;
    const key=`${week.key}:${query}:${columns}`;
    viewport.scrollTop=wallAnchor.current?.key===key?viewport.scrollTop+centre-wallAnchor.current.centre:centre-viewport.clientHeight/2;
    wallAnchor.current={key,centre};
  },[layout,week.key,query,columns]);
  useEffect(()=>{const timer=setInterval(()=>setToday(calendarDate()),60000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{if(previousCurrent.current!==current.key){if(selected===previousCurrent.current)setSelected(current.key);previousCurrent.current=current.key;}},[current.key,selected]);
  useEffect(()=>{const update=()=>{setSelected(routeWeek());setVariant(routeLayout());setRelatedTag(routeTag());};window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update);},[]);
  useEffect(()=>{const params=new URLSearchParams(location.hash.split('?')[1]||'');if(activeItem&&!params.has('week'))setSelected(weekFor(referenceDate(activeItem))?.key||current.key);},[activeItem?.id,current.key]);
  useEffect(()=>{if(allWeeks)archiveDialog.current?.showModal();else if(archiveDialog.current?.open){archiveDialog.current.close();archiveTrigger.current?.focus({preventScroll:true});}},[allWeeks]);
  function selectWeek(key){setSelected(key);setQuery('');setRelatedTag('');setAllWeeks(false);const params=new URLSearchParams(location.hash.split('?')[1]||'');params.set('view','weekly');params.set('week',key);params.delete('item');params.delete('preview');params.delete('tag');history.replaceState(null,'',`${location.pathname}#/inspiration?${params}`);window.scrollTo({top:0,behavior:'instant'});requestAnimationFrame(()=>weekHeading.current?.focus({preventScroll:true}));}
  const recent=weeks.slice(Math.max(0,weeks.findIndex(w=>w.key===week.key)-1),Math.max(4,weeks.findIndex(w=>w.key===week.key)+3)).slice(0,4).reverse();
  const pending=items.filter(i=>['pending','processing'].includes(i.enrichment)).length,failed=items.filter(i=>i.enrichment==='failed').length;
  return <section className={`weekly-canvas ${variant!=='classic'?'has-visual-variant':''} ${relatedTag?'has-related-tag':''}`} aria-label="What I came across, weekly visual archive">
    <div className="weekly-toolbar">
      <div className="weekly-title"><h1 ref={weekHeading} tabIndex={-1}>{relatedTag?`#${relatedTag}`:`Week ${week.number}`}</h1><p>{relatedTag?'Across all weeks':weekRange(week)}</p></div>
      <nav className="weekly-actions" aria-label="Week navigation">
        <button aria-label="Previous week" onClick={()=>selectWeek(shiftWeek(week.key,-1).key)}><ArrowLeft size={17}/><span>Previous week</span></button>
        <button aria-label={week.key===current.key||shiftWeek(week.key,1).key===current.key?'This week':'Next week'} disabled={week.key>=current.key} onClick={()=>selectWeek(shiftWeek(week.key,1).key)}><span>{week.key===current.key||shiftWeek(week.key,1).key===current.key?'This week':'Next week'}</span><ArrowRight size={17}/></button>
        <button ref={archiveTrigger} onClick={()=>setAllWeeks(true)}>All weeks</button>
        {!readOnly&&<button className="weekly-add" onClick={onCapture}>Add a visual <CapturePlus/></button>}
        <button aria-label="Search this week" aria-expanded={searching} onClick={()=>{setSearching(!searching);if(!searching)requestAnimationFrame(()=>search.current?.focus());else setQuery('');}}><MagnifyingGlass size={19}/></button>
        {!readOnly&&<details className="weekly-more"><summary aria-label="Collection options"><DotsThree size={24}/></summary><div><button onClick={()=>onBrowse('personal')}>Search & organise</button><button onClick={()=>onBrowse('discoveries')}>Discovered for me</button><button onClick={()=>onBrowse('connections')}>Capture & connections</button></div></details>}
      </nav>
    </div>
    <div className="weekly-page-navigation"><nav ref={weekStrip} className="weekly-strip" aria-label="Recent weekly pages">{recent.map(w=><button key={w.key} aria-current={week.key===w.key?'page':undefined} onClick={()=>selectWeek(w.key)}><WeekThumbnail items={w.items}/><span><strong>{w.key===current.key?'This week':`Week ${w.number}`}</strong><small>{weekRange(w,false)}</small></span></button>)}</nav></div>
    {searching&&<div className="weekly-search"><label>Search this week<input ref={search} type="search" placeholder={readOnly?"Title or source":"Title, source, note or project"} value={query} onChange={e=>setQuery(e.target.value)}/></label><button onClick={()=>{setQuery('');setSearching(false);}}>Close search <X size={16}/></button></div>}
    {relatedTag&&<div className="weekly-related"><span>{entries.length} related references</span><button onClick={()=>selectWeek(week.key)}>Back to Week {week.number} <X size={16}/></button></div>}
    {children}
    {error&&<p className="weekly-message is-error" role="alert">{error}</p>}
    {message&&<p className="weekly-message" role="status">{message}</p>}
    {!!entries.length&&variant!=='classic'&&<WeeklyVisuals key={`${variant}:${week.key}`} items={entries} variant={variant} weekKey={week.key} query={query} onOpen={(item,event)=>onOpen(item,event,entries)}/>}
    {!!entries.length&&variant==='classic'&&<div ref={wall} className="weekly-wall" role="region" aria-label="Weekly gallery wall, scroll to explore" tabIndex={0}><div className="weekly-contact-sheet" style={{'--wall-columns':columns,'--wall-rows':layout.rows}}>{entries.map((item,index)=><button key={item.id} className={`weekly-visual ${item.image?'has-image':'has-no-image'}`} style={{gridColumn:layout.points[index].column,gridRow:layout.points[index].row}} data-wall-x={layout.points[index].x} data-wall-y={layout.points[index].y} data-reference={item.id} onClick={event=>onOpen(item,event,entries)} aria-label={`Open ${item.title}`}>
      {item.image?<img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer" onError={event=>{event.currentTarget.style.display='none';event.currentTarget.parentElement.classList.add('preview-failed');}}/>:null}
      <span className="weekly-missing"><ImageSquare size={22}/><strong>{item.title}</strong><small>{['pending','processing'].includes(item.enrichment)&&!item.image?'Preview pending':'Preview unavailable'}</small></span>
      <span className="weekly-caption"><strong>{item.title}</strong><small>{item.origin==='personal'?item.domain:item.origin==='crawler'?'Saved from Design Daily':item.origin} ↗</small></span>
    </button>)}</div></div>}
    {!entries.length&&<div className="weekly-blank">{relatedTag?<div><h2>No related references yet.</h2><button onClick={()=>selectWeek(week.key)}>Back to this week</button></div>:query?<div><h2>No matches this week.</h2><button onClick={()=>setQuery('')}>Clear search</button></div>:<div><h2>{week.key===current.key?'A new week, an open canvas.':'A quiet week.'}</h2><p>{readOnly?'No discoveries have been published for this week yet.':week.key===current.key?'Save what catches your eye. It will find its place here.':'No references were saved in this week.'}</p>{!readOnly&&week.key===current.key?<button onClick={onCapture}>Add your first visual <CapturePlus/></button>:week.key!==current.key?<button onClick={()=>selectWeek(current.key)}>Go to this week <ArrowRight size={17}/></button>:null}</div>}</div>}
    <div className="weekly-bottom"><div className="weekly-status"><span>{visualCount} {visualCount===1?'visual':'visuals'}{entries.length>visualCount?` · ${entries.length-visualCount} without a preview`:''} · {readOnly?"Rapha’s discoveries":"Private collection"}</span><span>{readOnly?status:pending?`${pending} enriching`:failed?`${failed} ${failed===1?'preview needs':'previews need'} a retry`:status.includes('SQLite')?'Local enrichment ready':'Browser storage'}</span></div></div>
    <dialog ref={archiveDialog} className="weekly-archive-dialog" aria-labelledby="weekly-archive-title" onCancel={event=>{event.preventDefault();setAllWeeks(false);}} onClick={event=>{if(event.target===archiveDialog.current)setAllWeeks(false);}}><div className="weekly-archive-top"><h2 id="weekly-archive-title">All weeks</h2><button onClick={()=>setAllWeeks(false)} aria-label="Close weekly archive"><X size={22}/></button></div><div className="weekly-archive-grid">{weeks.slice(0,shownWeeks).map(w=><button key={w.key} aria-current={week.key===w.key?'page':undefined} onClick={()=>selectWeek(w.key)}><WeekThumbnail items={w.items}/><strong>{w.key===current.key?'This week':`Week ${w.number}`}</strong><small>{weekRange(w)} · {w.items.length} references</small></button>)}</div>{weeks.length>shownWeeks&&<button onClick={()=>setShownWeeks(shownWeeks+24)}>Show earlier weeks</button>}</dialog>
  </section>;
}
