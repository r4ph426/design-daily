import {useEffect,useRef,useState} from 'react';
import {GridHeader} from '../GridHeader.jsx';
import {WeeklyCanvas} from './WeeklyCanvas.jsx';
import {ImageFocus} from './ImageFocus.jsx';
import {calendarDate} from './weeks.js';
import {readPublicFeed} from './publicFeed.js';
import './inspiration.css';

export function PublicInspiration(){
  const [items,setItems]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[updated,setUpdated]=useState(''),[detail,setDetail]=useState(null),[origin,setOrigin]=useState(null),[sequence,setSequence]=useState([]);
  const trigger=useRef();
  useEffect(()=>{
    const controller=new AbortController();
    fetch(`${import.meta.env.BASE_URL}data/inspiration.json`,{cache:'no-store',signal:controller.signal}).then(response=>{if(!response.ok)throw new Error('The weekly journal is unavailable. Please try again later.');return response.json();}).then(feed=>{setItems(readPublicFeed(feed));setUpdated(feed.updatedAt);setLoading(false);}).catch(e=>{if(e.name!=='AbortError'){setError(e.message);setLoading(false);}});
    return()=>controller.abort();
  },[]);
  useEffect(()=>{
    const restore=()=>{const id=new URLSearchParams(location.hash.split('?')[1]||'').get('item');const item=items.find(i=>i.id===id);setDetail(item||null);if(item)setSequence(items.filter(i=>i.inspirationDate===item.inspirationDate));};
    restore();window.addEventListener('hashchange',restore);return()=>window.removeEventListener('hashchange',restore);
  },[items]);
  function setItem(item){const params=new URLSearchParams(location.hash.split('?')[1]||'');if(item)params.set('item',item.id);else params.delete('item');history.replaceState(null,'',`${location.pathname}#/inspiration?${params}`);setDetail(item);}
  function open(item,event,entries){trigger.current=event.currentTarget;const bounds=event.currentTarget.getBoundingClientRect(),img=event.currentTarget.querySelector('img');setOrigin({...bounds.toJSON(),naturalWidth:img?.naturalWidth,naturalHeight:img?.naturalHeight});setSequence(entries);setItem(item);}
  function close(){setItem(null);requestAnimationFrame(()=>trigger.current?.focus({preventScroll:true}));}
  function related(tag){setItem(null);const params=new URLSearchParams(location.hash.split('?')[1]||'');params.set('tag',tag);location.hash=`/inspiration?${params}`;}
  return <div className="prototype-shell is-toolbox inspiration-shell is-weekly-experience public-inspiration">
    <GridHeader date={calendarDate()} route="inspiration"/>
    <main id="inspiration-main" className="inspiration-main">
      {loading?<p className="weekly-message" role="status">Loading Rapha’s discoveries…</p>:<WeeklyCanvas items={items} onOpen={open} activeItem={detail} readOnly error={error} status={updated?`Updated ${calendarDate(updated)}`:''}/>}
    </main>
    {detail&&<ImageFocus item={detail} sequence={sequence} origin={origin} onClose={close} onStep={setItem} onRelated={related}/>}
  </div>;
}
