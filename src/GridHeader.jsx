import {useEffect,useRef,useState} from "react";
import {DotsThree} from "./icons/index.jsx";
import { editorialHref, publishedHref } from "./editorial-routes.js";
import "./grid-header.css";
import "./square-field.css";

function headerDate(date, compact = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return date || "";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: compact ? undefined : "long",
    day: "numeric",
    month: compact ? "short" : "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

const descriptors = {
  today: "A daily editorial source of truth for design teams",
  archive: "A searchable record of questions shaping design",
  toolbox: "An editorial guide to tools for design teams",
  privacy: "",
  inspiration: "ra.re · Design Assets & Sources",
};

export function GridHeader({ date, route, hidden = false, quiet = false, onReveal }) {
  const [moreOpen,setMoreOpen]=useState(false);
  const header=useRef(),moreButton=useRef(),morePanel=useRef();
  const moreActive=!['today','archive'].includes(route);
  useEffect(()=>setMoreOpen(false),[route]);
  useEffect(()=>{
    if(!moreOpen)return;
    morePanel.current?.querySelector('a')?.focus();
    const outside=event=>{if(!header.current?.contains(event.target))setMoreOpen(false);};
    const key=event=>{if(event.key==='Escape'){setMoreOpen(false);moreButton.current?.focus();}};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key);};
  },[moreOpen]);
  const destinations=[
    {name:'today',label:'Today',href:editorialHref()},
    {name:'archive',label:'Archive',href:editorialHref('/archive')},
    {name:'toolbox',label:'Toolbox',href:editorialHref('/toolbox')},
    {name:'inspiration',label:'What I came across',href:`${import.meta.env.BASE_URL}#/inspiration`},
    {name:'privacy',label:'Privacy',href:publishedHref('/privacy')},
  ];
  function link(destination,extra=''){return <a key={destination.name} className={`${destination.name}-nav-link ${route===destination.name?'active':''} ${extra}`} aria-current={route===destination.name?'page':undefined} href={destination.href} onClick={()=>setMoreOpen(false)}>{destination.label}</a>;}
  return <header ref={header} className="prototype-header" inert={hidden || undefined} aria-hidden={hidden || undefined} onPointerEnter={onReveal}>
    <div className="prototype-header-primary">
      <a className="prototype-brand" href={editorialHref()} aria-label="design / daily home"><span>design / daily</span><small>by ra.re design</small></a>
      <p className="prototype-date" aria-hidden={quiet || undefined}><span>{headerDate(date)}</span><span>{headerDate(date,true)}</span></p>
      <p className="prototype-descriptor" aria-hidden={quiet || undefined}>{descriptors[route]}</p>
    </div>
    <nav className="prototype-nav" aria-label="Primary" inert={quiet || undefined} aria-hidden={quiet || undefined}>
      {destinations.map(destination=>link(destination,['today','archive'].includes(destination.name)?'':'desktop-destination'))}
      <button ref={moreButton} className={`prototype-more-trigger ${moreActive?'active':''}`} aria-label="More pages" aria-expanded={moreOpen} aria-controls="primary-more-pages" onClick={()=>setMoreOpen(!moreOpen)}><DotsThree size={24}/><span className="prototype-nav-sr">More</span></button>
    </nav>
    {moreOpen&&<nav ref={morePanel} id="primary-more-pages" className="prototype-more-panel" aria-label="More pages">{destinations.slice(2).map(destination=>link(destination))}</nav>}
  </header>;
}
