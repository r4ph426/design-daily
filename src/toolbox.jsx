import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookmarkSimple,
  Check,
  MagnifyingGlass,
} from "@phosphor-icons/react";

const weeklySignals = [
  {
    id: "01",
    title: "MCP Apps SDK",
    verdict: "Useful now",
    summary: "A new SDK for building and distributing MCP apps across popular tools.",
    source: "github.com/modelcontextprotocol",
    url: "https://github.com/modelcontextprotocol",
  },
  {
    id: "02",
    title: "Interface audit skill",
    verdict: "Worth trying",
    summary: "An AI skill that reviews interfaces for usability issues and suggests practical fixes.",
    source: "github.com/openai",
    url: "https://github.com/openai",
  },
  {
    id: "03",
    title: "Design system agent",
    verdict: "Watching",
    summary: "An agent that suggests design-system components and flags inconsistencies.",
    source: "github.com/topics/design-system",
    url: "https://github.com/topics/design-system",
  },
];

const tools = [
  {
    id: "01",
    title: "Figma MCP",
    type: "MCP",
    categories: ["UI", "Process"],
    description: "Connects Figma to AI tools with a clean, permissioned interface for reading designs, extracting context, and making changes in your files. It meaningfully reduces friction for design handoffs and iteration.",
    verdict: "Useful now",
    confidence: "High",
    reviewed: "25 Sep 2026",
    source: "github.com/figma/mcp",
    url: "https://github.com/figma/mcp-server-guide",
    access: "Open source",
    setup: "10–15 minutes",
    recommendation: "Stable, well-documented, and already useful in real projects. A strong example of an MCP server designed for designers.",
  },
  {
    id: "02",
    title: "Accessibility review skill",
    type: "Skill",
    categories: ["UX", "Process"],
    description: "Analyzes designs for accessibility issues, suggests fixes, and explains the reasoning. Helps teams catch problems earlier and build more inclusive products.",
    verdict: "Worth trying",
    confidence: "Medium",
    reviewed: "25 Sep 2026",
    source: "github.com/openai/accessibility-skill",
    url: "https://github.com/openai/skills",
    access: "Requires ChatGPT Plus",
    setup: "5–10 minutes",
    recommendation: "A practical way to automate first-pass accessibility checks. Good results, but it still misses some nuanced issues.",
  },
  {
    id: "03",
    title: "Design QA agent",
    type: "Agent",
    categories: ["Process", "Culture"],
    description: "Reviews designs against your team’s criteria, flags inconsistencies, and suggests improvements. Useful for maintaining quality across large bodies of work.",
    verdict: "Worth trying",
    confidence: "Medium",
    reviewed: "25 Sep 2026",
    source: "github.com/topics/design-qa",
    url: "https://github.com/topics/design-qa",
    access: "Open source",
    setup: "15–30 minutes",
    recommendation: "Promising for teams with clear design systems. Still early, but already helpful for spotting common issues.",
  },
  {
    id: "04",
    title: "Playwright MCP",
    type: "MCP",
    categories: ["UI", "Process"],
    description: "Lets an AI agent inspect and operate browser interfaces through structured accessibility data. Useful for repeatable product checks and prototype walkthroughs.",
    verdict: "Best practice",
    confidence: "High",
    reviewed: "18 Sep 2026",
    source: "github.com/microsoft/playwright-mcp",
    url: "https://github.com/microsoft/playwright-mcp",
    access: "Open source",
    setup: "10–20 minutes",
    recommendation: "A dependable bridge between product intent and browser evidence. Keep permissions narrow and make automated actions observable.",
  },
  {
    id: "05",
    title: "Design critique skill",
    type: "Skill",
    categories: ["UI", "Culture"],
    description: "Turns a team’s critique principles into a reusable review workflow for hierarchy, clarity, consistency, and accessibility.",
    verdict: "Best practice",
    confidence: "High",
    reviewed: "11 Sep 2026",
    source: "github.com/topics/design-critique",
    url: "https://github.com/topics/design-critique",
    access: "Open source",
    setup: "20–30 minutes",
    recommendation: "Most useful when the criteria are authored by the team. Treat it as structured critique support, not an automatic design decision.",
  },
];

const toolTypes = ["All types", "MCP", "Skill", "Agent"];
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
        <a href={signal.url} target="_blank" rel="noopener noreferrer">Source: {signal.source} <ArrowUpRight size={14} /></a>
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
        <small>{tool.categories.join(" · ")}</small>
      </div>
      <div className="toolbox-tool-copy">
        <h3>{tool.title}</h3>
        <p>{tool.description}</p>
      </div>
      <dl className="toolbox-tool-facts">
        <div><dt>Our verdict</dt><dd className={tool.verdict === "Useful now" ? "toolbox-highlight" : ""}>{tool.verdict}</dd></div>
        <div><dt>Confidence</dt><dd>{tool.confidence}</dd></div>
        <div><dt>Last reviewed</dt><dd>{tool.reviewed}</dd></div>
        <div><dt>Source</dt><dd><a href={tool.url} target="_blank" rel="noopener noreferrer">{tool.source} <ArrowUpRight size={13} /></a></dd></div>
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
  const [verdict, setVerdict] = useState("All verdicts");
  const [savedTools, setSavedTools] = useState(() => {
    try { return JSON.parse(localStorage.getItem("design-daily-tool-bookmarks-v1")) || {}; }
    catch { return {}; }
  });

  const visibleTools = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tools.filter((tool) => {
      const matchesQuery = !normalizedQuery || [tool.title, tool.type, tool.description, tool.verdict, ...tool.categories]
        .join(" ").toLowerCase().includes(normalizedQuery);
      const matchesType = type === "All types" || tool.type === type;
      const matchesVerdict = verdict === "All verdicts" || tool.verdict === verdict;
      return matchesQuery && matchesType && matchesVerdict;
    });
  }, [query, type, verdict]);

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
          <p>Week 39 · 25 Sep 2026</p>
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
        </div>
        <p className="toolbox-results" aria-live="polite">{visibleTools.length} {visibleTools.length === 1 ? "tool" : "tools"}</p>
        <div className="toolbox-tool-list">
          {visibleTools.map((tool) => <ToolRow key={tool.id} tool={tool} saved={Boolean(savedTools[tool.id])} onSave={() => toggleSave(tool.id)} />)}
          {!visibleTools.length && <div className="toolbox-empty"><h3>No tools match yet.</h3><p>Try a broader search or clear one of the filters.</p><button type="button" onClick={() => { setQuery(""); setType("All types"); setVerdict("All verdicts"); }}>Clear filters</button></div>}
        </div>
      </section>

    </div>
  );
}
