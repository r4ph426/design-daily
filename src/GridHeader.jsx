import {useLayoutEffect,useRef} from "react";
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
  const navigation=useRef();
  useLayoutEffect(()=>{
    const revealActive=()=>{
      const nav=navigation.current,active=nav?.querySelector('[aria-current=page]');
      if(!nav||!active||nav.scrollWidth<=nav.clientWidth)return;
      const a=active.getBoundingClientRect(),n=nav.getBoundingClientRect();
      nav.scrollLeft+=a.left-n.left-(nav.clientWidth-a.width)/2;
    };
    revealActive();window.addEventListener('resize',revealActive);
    return()=>window.removeEventListener('resize',revealActive);
  },[route]);
  return (
    <header className="prototype-header" inert={hidden || undefined} aria-hidden={hidden || undefined} onPointerEnter={onReveal}>
      <div className="prototype-header-primary">
        <a className="prototype-brand" href={editorialHref()} aria-label="design / daily home"><span>design / daily</span><small>by ra.re design</small></a>
        <p className="prototype-date" aria-hidden={quiet || undefined}><span>{headerDate(date)}</span><span>{headerDate(date, true)}</span></p>
        <p className="prototype-descriptor" aria-hidden={quiet || undefined}>{descriptors[route]}</p>
      </div>
      <nav ref={navigation} className="prototype-nav" aria-label="Primary" inert={quiet || undefined} aria-hidden={quiet || undefined}>
        {["today", "archive", "toolbox"].map((name) => (
          <a key={name} className={route === name ? "active" : ""} aria-current={route === name ? "page" : undefined} href={name === "privacy" ? publishedHref("/privacy") : editorialHref(name === "today" ? "" : `/${name}`)}>{name[0].toUpperCase() + name.slice(1)}</a>
        ))}
        <a className={`inspiration-nav-link ${route === "inspiration" ? "active" : ""}`} aria-current={route === "inspiration" ? "page" : undefined} href={`${import.meta.env.BASE_URL}#/inspiration`}>What I came across</a>
        <a className={`privacy-nav-link ${route === "privacy" ? "active" : ""}`} aria-current={route === "privacy" ? "page" : undefined} href={publishedHref("/privacy")}>Privacy</a>
      </nav>
    </header>
  );
}
