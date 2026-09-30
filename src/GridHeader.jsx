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
};

export function GridHeader({ date, route }) {
  return (
    <header className="prototype-header">
      <div className="prototype-header-primary">
        <a className="prototype-brand" href={editorialHref()} aria-label="design / daily home"><span>design / daily</span><small>by ra.re design</small></a>
        <p className="prototype-date"><span>{headerDate(date)}</span><span>{headerDate(date, true)}</span></p>
        <p className="prototype-descriptor">{descriptors[route]}</p>
      </div>
      <nav className="prototype-nav" aria-label="Primary">
        {["today", "archive", "toolbox", "privacy"].map((name) => (
          <a key={name} className={route === name ? "active" : ""} aria-current={route === name ? "page" : undefined} href={name === "privacy" ? publishedHref("/privacy") : editorialHref(name === "today" ? "" : `/${name}`)}>{name[0].toUpperCase() + name.slice(1)}</a>
        ))}
      </nav>
    </header>
  );
}
