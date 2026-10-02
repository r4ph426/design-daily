import { editorialHref } from "./editorial-routes.js";

const paths = [
  { category: "UI", title: "Learn to see hierarchy", copy: "Read interfaces as systems of emphasis, rhythm, and reusable decisions." },
  { category: "UX", title: "Begin with people and evidence", copy: "Understand behavior before turning an assumption into a screen." },
  { category: "Process", title: "Make the work testable", copy: "Use framing, prototypes, and critique to improve the decision." },
  { category: "Culture", title: "Design inside a wider context", copy: "Notice how incentives, authorship, power, and taste shape the work." },
];

export function ArchiveEditorialOpening({ records, onExplore }) {
  return <>
    <section className="prototype-archive-opening module-layout" aria-labelledby="prototype-archive-title">
      <div className="prototype-archive-title content-panel"><p className="eyebrow">Question archive</p><h1 id="prototype-archive-title">Questions worth <em>returning to.</em></h1></div>
      <div className="prototype-archive-orientation content-panel"><p>Find a question you remember, or follow an editorial path into the ideas shaping design practice.</p><button className="mobile-index-jump" type="button" onClick={() => {
        const index = document.querySelector("#prototype-archive-index");
        index?.scrollIntoView({ block: "start", behavior: "instant" });
        index?.querySelector("input")?.focus({ preventScroll: true });
      }}>Find a question <span aria-hidden="true">↓</span></button></div>
      <div className="prototype-archive-count content-panel"><span>{records.length}</span><p>Questions across {new Set(records.map((record) => record.editionNumber)).size} weekday editions</p><small>Popular ranks all-time team saves. Popular recently reflects distinct saves in the last 30 days.</small></div>
    </section>
    <section className="prototype-start module-layout" aria-labelledby="prototype-start-title">
      <div className="prototype-start-heading content-panel"><p className="eyebrow">Editorial starting points</p><h2 id="prototype-start-title">Start here</h2><p>Four foundations for designers finding their footing.</p></div>
      {paths.map((path, index) => <article className={`prototype-start-path prototype-start-path-${index + 1} content-panel`} key={path.category}><div className="prototype-start-content"><span>{path.category}</span><h3>{path.title}</h3><p>{path.copy}</p><a href={editorialHref(`/archive?category=${encodeURIComponent(path.category)}`)} onClick={onExplore ? (event) => onExplore(event, path.category) : undefined}>Explore {path.category} questions <span aria-hidden="true">↗</span></a></div></article>)}
    </section>
  </>;
}
