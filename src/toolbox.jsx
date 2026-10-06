import { safeExternalHref } from "../shared/public-url.mjs";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookmarkSimple,
  Check,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import toolboxData from "../data/toolbox.json";

const { weekLabel, weeklySignals, tools } = toolboxData;
const toolTypes = ["All types", "MCP", "Skill", "Agent", "Tool"];
const practices = ["All practices", "Taste", "Drafting", "UI sketches", "Flows", "Accessibility", "Review", "Creative exploration", "Pattern research"];
const verdicts = ["All verdicts", "Useful now", "Worth trying", "Best practice", "Watching"];

function ToolContribution() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle");

  const submit = (event) => {
    event.preventDefault();
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("invalid");
      setStatus("accepted");
    } catch {
      setStatus("error");
    }
  };

  return (
    <aside className="toolbox-contribution page-opening-aside" aria-labelledby="tool-contribution-title">
      <div>
        <h2 id="tool-contribution-title">Contribute to the next crawl</h2>
        <p>Know a tool we should evaluate? Send us a link and we’ll test it for a future weekly edition.</p>
      </div>
      <form onSubmit={submit} noValidate>
        <label htmlFor="tool-url">Tool URL</label>
        <div className="toolbox-url-control contribution-control contribution-control-light">
          <input
            id="tool-url"
            type="url"
            inputMode="url"
            placeholder="https://example.com"
            value={url}
            onChange={(event) => { setUrl(event.target.value); setStatus("idle"); }}
            aria-describedby="tool-url-help tool-url-status"
          />
          <button className="contribution-submit" type="submit">Add to crawl</button>
        </div>
        <p id="tool-url-help" className="toolbox-form-help">No account needed. We review submissions weekly.</p>
        {status === "accepted" && <p id="tool-url-status" className="toolbox-form-status" role="status"><Check size={15} weight="bold" /> Added to next week’s crawl.</p>}
        {status === "error" && <p id="tool-url-status" className="toolbox-form-status error" role="alert">Enter a valid public URL.</p>}
      </form>
    </aside>
  );
}

function WeeklySignal({ signal }) {
  return (
    <article className="weekly-signal">
      <span className="weekly-number">{signal.id}</span>
      <div className="weekly-signal-copy">
        <h3>{signal.title}</h3>
        <p className={signal.verdict === "Useful now" ? "toolbox-highlight" : "weekly-verdict"}>{signal.verdict}</p>
        <p className="weekly-summary">{signal.summary}</p>
        <a href={safeExternalHref(signal.url)} target="_blank" rel="noopener noreferrer">Source: {signal.source} <ArrowUpRight size={14} /></a>
      </div>
    </article>
  );
}

function ToolRow({ tool, saved, onSave }) {
  return (
    <article className="toolbox-tool-row">
      <div className="toolbox-tool-id">
        <span>{tool.id}</span>
        <small>{tool.type}</small>
        <small>{tool.practices.join(" · ")}</small>
      </div>
      <div className="toolbox-tool-copy">
        <h3>{tool.title}</h3>
        <p>{tool.description}</p>
      </div>
      <dl className="toolbox-tool-facts">
        <div><dt>Our verdict</dt><dd className={tool.verdict === "Useful now" ? "toolbox-highlight" : ""}>{tool.verdict}</dd></div>
        <div><dt>Confidence</dt><dd>{tool.confidence}</dd></div>
        <div><dt>Last reviewed</dt><dd>{tool.reviewed}</dd></div>
        <div><dt>Source</dt><dd><a href={safeExternalHref(tool.url)} target="_blank" rel="noopener noreferrer">{tool.source} <ArrowUpRight size={13} /></a></dd></div>
        <div><dt>Access</dt><dd>{tool.access}</dd></div>
        <div><dt>Setup time</dt><dd>{tool.setup}</dd></div>
      </dl>
      <div className="toolbox-recommendation">
        <h4>Why we recommend it</h4>
        <p>{tool.recommendation}</p>
        <button type="button" aria-pressed={saved} onClick={onSave}>
          <BookmarkSimple size={17} weight={saved ? "fill" : "regular"} />
          {saved ? "Bookmarked" : "Bookmark tool"}
        </button>
      </div>
    </article>
  );
}

export function ToolboxPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All types");
  const [practice, setPractice] = useState("All practices");
  const [verdict, setVerdict] = useState("All verdicts");
  const [savedTools, setSavedTools] = useState(() => {
    try { return JSON.parse(localStorage.getItem("design-daily-tool-bookmarks-v1")) || {}; }
    catch { return {}; }
  });

  const visibleTools = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tools.filter((tool) => {
      const matchesQuery = !normalizedQuery || [tool.title, tool.type, tool.description, tool.verdict, ...tool.categories, ...tool.practices]
        .join(" ").toLowerCase().includes(normalizedQuery);
      const matchesType = type === "All types" || tool.type === type;
      const matchesPractice = practice === "All practices" || tool.practices.includes(practice);
      const matchesVerdict = verdict === "All verdicts" || tool.verdict === verdict;
      return matchesQuery && matchesType && matchesPractice && matchesVerdict;
    });
  }, [query, type, practice, verdict]);

  const toggleSave = (id) => {
    setSavedTools((current) => {
      const next = { ...current, [id]: !current[id] };
      localStorage.setItem("design-daily-tool-bookmarks-v1", JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="toolbox-page">
      <section className="toolbox-hero page-opening" aria-labelledby="toolbox-title">
        <div className="toolbox-intro page-opening-main">
          <p className="toolbox-eyebrow page-opening-eyebrow">Toolbox</p>
          <h1 id="toolbox-title"><span className="page-opening-title-line">Tools worth bringing</span><span className="page-opening-title-line">into the work.</span></h1>
          <p className="page-opening-summary">A weekly editorial source of truth for UX/UI designers. Every recommendation is tested, sourced, and reviewed by our team, so you can spend less time searching and more time designing.</p>
        </div>
        <ToolContribution />
      </section>

      <section className="toolbox-weekly" id="toolbox-weekly" aria-labelledby="weekly-title">
        <header className="toolbox-weekly-heading">
          <div><p className="toolbox-eyebrow">New this week</p><h2 id="weekly-title">What’s new and sparking our interest</h2></div>
          <p>{weekLabel}</p>
        </header>
        <div className="weekly-signal-grid">
          {weeklySignals.map((signal) => <WeeklySignal key={signal.id} signal={signal} />)}
        </div>
      </section>

      <section className="toolbox-index" aria-labelledby="our-toolbox-title">
        <header className="toolbox-index-heading">
          <p className="toolbox-eyebrow">Our toolbox</p>
          <h2 id="our-toolbox-title">Our toolbox</h2>
          <p>A maintained collection of tools we use, recommend, or are actively testing.</p>
        </header>
        <div className="toolbox-controls">
          <label className="toolbox-search">
            <span className="visually-hidden">Search tools</span>
            <MagnifyingGlass size={19} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tools, use cases, or keywords" />
          </label>
          <div className="toolbox-type-filters" aria-label="Tool type">
            {toolTypes.map((item) => <button key={item} type="button" className={type === item ? "selected" : ""} aria-pressed={type === item} onClick={() => setType(item)}>{item}</button>)}
          </div>
          <div className="toolbox-verdict-filters">
            <label><span className="visually-hidden">Verdict</span><select value={verdict} onChange={(event) => setVerdict(event.target.value)}>{verdicts.map((item) => <option key={item}>{item}</option>)}</select></label>
            <button type="button" className={verdict === "Worth trying" ? "selected" : ""} onClick={() => setVerdict(verdict === "Worth trying" ? "All verdicts" : "Worth trying")}>Worth trying</button>
            <button type="button" className={verdict === "Best practice" ? "selected" : ""} onClick={() => setVerdict(verdict === "Best practice" ? "All verdicts" : "Best practice")}>Best practice</button>
          </div>
          <div className="toolbox-practice-filters" aria-label="Design practice">
            <span>Use in practice</span>
            <div>
              {practices.map((item) => <button key={item} type="button" className={practice === item ? "selected" : ""} aria-pressed={practice === item} onClick={() => setPractice(item)}>{item}</button>)}
            </div>
          </div>
        </div>
        <p className="toolbox-results" aria-live="polite">{visibleTools.length} {visibleTools.length === 1 ? "tool" : "tools"}</p>
        <div className="toolbox-tool-list">
          {visibleTools.map((tool) => <ToolRow key={tool.id} tool={tool} saved={Boolean(savedTools[tool.id])} onSave={() => toggleSave(tool.id)} />)}
          {!visibleTools.length && <div className="toolbox-empty"><h3>No tools match yet.</h3><p>Try a broader search or clear one of the filters.</p><button type="button" onClick={() => { setQuery(""); setType("All types"); setPractice("All practices"); setVerdict("All verdicts"); }}>Clear filters</button></div>}
        </div>
      </section>

    </div>
  );
}
