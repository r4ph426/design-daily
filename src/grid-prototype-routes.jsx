import { safeExternalHref } from "../shared/public-url.mjs";
import { useEffect, useMemo, useState } from "react";
import { BookmarkSimple, MagnifyingGlass } from "./icons/index.jsx";
import toolboxData from "../data/toolbox.json";
import { RECENT_POPULARITY, SKILL_LABELS, questionRoute } from "./archive.jsx";
import { AiLensBadge } from "./AiLensBadge.jsx";
import { ArticleIntake } from "./App.jsx";
import { ArchiveEditorialOpening } from "./ArchiveEditorialOpening.jsx";

const categories = ["UI", "UX", "Process", "Culture"];
const toolTypes = ["All types", "MCP", "Skill", "Agent", "Tool"];
const practices = ["All practices", "Taste", "Drafting", "UI sketches", "Flows", "Accessibility", "Review", "Creative exploration", "Pattern research"];
const verdicts = ["All verdicts", "Useful now", "Worth trying", "Best practice", "Watching"];

function ClearFilters({ active, onClear }) {
  return active && <div className="prototype-clear-cell content-panel"><button className="prototype-clear-filters" type="button" onClick={onClear}>Clear filters ↗</button></div>;
}

function sourceCount(record) {
  const count = record.counts?.total || record.signals?.length || 0;
  return `${count} ${count === 1 ? "source" : "sources"}`;
}

function matchesDate(record, value) {
  if (value === "any") return true;
  if (value.startsWith("month:")) return record.dateISO.startsWith(value.slice(6));
  const days = Number(value.slice(5));
  const date = new Date(`${record.dateISO}T12:00:00`);
  return Number.isFinite(days) && (Date.now() - date.valueOf()) / 86_400_000 <= days;
}

function ArchiveResult({ record, saved, onBookmark }) {
  const popularRecently = record.popularity.recent30DaySaves >= RECENT_POPULARITY.minimumSaves;
  return (
    <article className="prototype-archive-row">
      <div className="prototype-archive-number content-panel"><span className="prototype-archive-reference">{record.archiveReference}</span><small>{record.category}</small>{record.aiLens && <AiLensBadge />}</div>
      <div className="prototype-archive-copy content-panel">
        <h3><a href={`${import.meta.env.BASE_URL}${questionRoute(record)}`}>{record.question} <span aria-hidden="true">↗</span></a></h3>
        <p>{record.answerText}</p>
        <div className="prototype-archive-skills">{record.skillLabels.map((label) => <span key={label}>{label}</span>)}</div>
      </div>
      <div className="prototype-archive-meta content-panel">
        <p>{record.editionLabel} · {record.dateLabel}</p>
        <p>{sourceCount(record)} · {record.popularity.allTimeSaves} team saves</p>
        {popularRecently && <p className="prototype-recent">Popular recently · {record.popularity.recent30DaySaves} in 30 days</p>}
        <button type="button" aria-pressed={saved} onClick={() => onBookmark(record.key)}>{saved ? "Bookmarked" : "Bookmark"}<BookmarkSimple size={17} weight={saved ? "fill" : "regular"} aria-hidden="true" /></button>
      </div>
    </article>
  );
}

export function PrototypeArchive({ records, ready, bookmarks, onBookmark, initialCategory }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [skill, setSkill] = useState("All skills");
  const [date, setDate] = useState("any");
  useEffect(() => {
    setCategory(initialCategory);
    if (initialCategory !== "All") document.getElementById("prototype-archive-index")?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [initialCategory]);

  const months = useMemo(() => [...new Set(records.map((record) => record.dateISO.slice(0, 7)))].sort().reverse(), [records]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((record) => {
      const content = `${record.question} ${record.answerText} ${record.why || ""} ${record.skillLabels.join(" ")} ${(record.signals || []).map((signal) => `${signal.title || ""} ${signal.source || ""}`).join(" ")}`.toLowerCase();
      return (!needle || content.includes(needle))
        && (category === "All" || (category === "Must read" ? record.signals?.some((signal) => signal.verdict?.toLowerCase() === "must read") : record.category === category))
        && (skill === "All skills" || record.skillLabels.includes(skill))
        && matchesDate(record, date);
    }).sort((a, b) => b.dateISO.localeCompare(a.dateISO) || Number(a.archiveNumber) - Number(b.archiveNumber));
  }, [records, query, category, skill, date]);

  const clearFilters = () => { setQuery(""); setCategory("All"); setSkill("All skills"); setDate("any"); };
  return (
    <div className="prototype-route prototype-archive">
      <ArchiveEditorialOpening records={records} />

      <section className="prototype-archive-index" id="prototype-archive-index" aria-labelledby="prototype-index-title">
        <div className="prototype-index-heading module-layout"><div className="content-panel"><p className="eyebrow">Dense index</p><h2 id="prototype-index-title">Question index</h2></div><p className="content-panel">Search by question, answer, skill label, or source title.</p></div>
        <div className="prototype-archive-controls module-layout">
          <label className="prototype-search content-panel"><MagnifyingGlass size={19} aria-hidden="true" /><span className="visually-hidden">Search questions</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions, answers, or sources" /></label>
          <div className="prototype-category-filters content-panel" role="group" aria-label="Category filter">{["All", ...categories, "Must read"].map((item) => <button type="button" key={item} aria-pressed={category === item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
          <label className="prototype-select content-panel"><span>Skill label</span><select value={skill} onChange={(event) => setSkill(event.target.value)}><option>All skills</option>{SKILL_LABELS.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
          <label className="prototype-select content-panel"><span>Date</span><select value={date} onChange={(event) => setDate(event.target.value)}><option value="any">Any date</option><option value="days:30">Past 30 days</option><option value="days:90">Past 90 days</option>{months.map((month) => <option key={month} value={`month:${month}`}>{new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00`))}</option>)}</select></label>
          <ClearFilters active={query || category !== "All" || skill !== "All skills" || date !== "any"} onClear={clearFilters} />
        </div>
        {!ready && <p className="visually-hidden" role="status">Loading previous editions…</p>}
        {filtered.map((record) => <ArchiveResult key={record.key} record={record} saved={Boolean(bookmarks[record.key])} onBookmark={onBookmark} />)}
        {ready && !filtered.length && <div className="prototype-empty content-panel"><h3>No questions match these filters.</h3><p>Try a broader search or clear one of the filters.</p><button type="button" onClick={clearFilters}>Show all questions</button></div>}
      </section>
    </div>
  );
}

function WeeklyDiscovery({ signal }) {
  return <article className="prototype-weekly-card content-panel"><span className="prototype-weekly-number">{signal.id}</span><div><h3>{signal.title}</h3><p className="prototype-weekly-verdict">{signal.verdict}</p><p>{signal.summary}</p><a href={safeExternalHref(signal.url)} target="_blank" rel="noopener noreferrer">{signal.source} <span aria-hidden="true">↗</span></a></div></article>;
}

function PrototypeToolRow({ tool, saved, onBookmark }) {
  return <article className="prototype-tool-row module-layout">
    <div className="prototype-tool-number content-panel"><span>{tool.id}</span><small>{tool.type}</small></div>
    <div className="prototype-tool-description content-panel"><h3><a href={safeExternalHref(tool.url)} target="_blank" rel="noopener noreferrer">{tool.title} <span aria-hidden="true">↗</span></a></h3><p>{tool.recommendation}</p><small>{tool.practices.join(" · ")}</small></div>
    <div className="prototype-tool-evidence content-panel"><p className="eyebrow">Our verdict</p><strong className={tool.verdict === "Best practice" ? "is-best" : ""}>{tool.verdict}</strong><small>{tool.confidence} confidence · Reviewed {tool.reviewed}</small><a href={safeExternalHref(tool.url)} target="_blank" rel="noopener noreferrer">{tool.source} <span aria-hidden="true">↗</span></a></div>
    <div className="prototype-tool-meta content-panel"><span>{tool.categories.join(" · ")}</span><span>{tool.access} · {tool.setup}</span><button type="button" aria-pressed={saved} onClick={onBookmark}>{saved ? "Bookmarked" : "Bookmark tool"}<BookmarkSimple size={17} weight={saved ? "fill" : "regular"} aria-hidden="true" /></button></div>
  </article>;
}

export function PrototypeToolbox() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All types");
  const [practice, setPractice] = useState("All practices");
  const [verdict, setVerdict] = useState("All verdicts");
  const [saved, setSaved] = useState(() => { try { return JSON.parse(localStorage.getItem("design-daily-tool-bookmarks-v1") || "{}"); } catch { return {}; } });
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return toolboxData.tools.filter((tool) => (!needle || `${tool.title} ${tool.type} ${tool.description} ${tool.verdict} ${tool.categories.join(" ")} ${tool.practices.join(" ")}`.toLowerCase().includes(needle))
      && (type === "All types" || tool.type === type)
      && (practice === "All practices" || tool.practices.includes(practice))
      && (verdict === "All verdicts" || tool.verdict === verdict));
  }, [query, type, practice, verdict]);
  const toggleSave = (id) => setSaved((current) => { const next = { ...current, [id]: !current[id] }; localStorage.setItem("design-daily-tool-bookmarks-v1", JSON.stringify(next)); return next; });
  const clearFilters = () => { setQuery(""); setType("All types"); setPractice("All practices"); setVerdict("All verdicts"); };

  return <div className="prototype-route prototype-toolbox">
    <section className="prototype-toolbox-opening module-layout" aria-labelledby="prototype-toolbox-title">
      <div className="prototype-toolbox-title content-panel"><p className="eyebrow">Toolbox</p><h1 id="prototype-toolbox-title">Tools worth bringing <em>into the work.</em></h1></div>
      <div className="prototype-toolbox-orientation content-panel"><p>A weekly editorial guide to tools we can actually use. Source-reviewed leads stay distinct from tools tested by the team.</p></div>
      <div className="prototype-toolbox-intake content-panel"><ArticleIntake context="tool" /></div>
    </section>

    <section className="prototype-weekly module-layout" aria-labelledby="prototype-weekly-title">
      <div className="prototype-weekly-heading content-panel"><p className="eyebrow">New this week · {toolboxData.weekLabel}</p><h2 id="prototype-weekly-title">What’s sparking our interest</h2></div>
      {toolboxData.weeklySignals.map((signal, index) => <div className={`prototype-weekly-slot prototype-weekly-slot-${index + 1}`} key={signal.id}><WeeklyDiscovery signal={signal} /></div>)}
    </section>

    <section className="prototype-toolbox-index" aria-labelledby="prototype-our-toolbox-title">
      <div className="prototype-toolbox-index-heading module-layout"><div className="content-panel"><p className="eyebrow">Persistent collection</p><h2 id="prototype-our-toolbox-title">Our toolbox</h2></div><div className="prototype-toolbox-count content-panel" role="status" aria-live="polite"><span>{visible.length}</span><p>{visible.length === 1 ? "tool" : "tools"}</p></div><p className="content-panel">A maintained collection of tools we use, recommend, or are actively testing.</p></div>
      <div className="prototype-toolbox-controls module-layout">
        <label className="prototype-search content-panel"><MagnifyingGlass size={19} aria-hidden="true" /><span className="visually-hidden">Search tools</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tools, use cases, or keywords" /></label>
        <div className="prototype-tool-type content-panel" role="group" aria-label="Tool type">{toolTypes.map((item) => <button key={item} type="button" className={type === item ? "selected" : ""} aria-pressed={type === item} onClick={() => setType(item)}>{item}</button>)}</div>
        <label className="prototype-select prototype-tool-practice content-panel"><span>Practice</span><select value={practice} onChange={(event) => setPractice(event.target.value)}>{practices.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="prototype-select prototype-tool-verdict content-panel"><span>Verdict</span><select value={verdict} onChange={(event) => setVerdict(event.target.value)}>{verdicts.map((item) => <option key={item}>{item}</option>)}</select></label>
        <ClearFilters active={query || type !== "All types" || practice !== "All practices" || verdict !== "All verdicts"} onClear={clearFilters} />
      </div>
      <div className={`prototype-tool-list ${visible.length % 2 ? "has-odd-row" : ""}`}>{visible.map((tool) => <PrototypeToolRow key={tool.id} tool={tool} saved={Boolean(saved[tool.id])} onBookmark={() => toggleSave(tool.id)} />)}</div>
      {!visible.length && <div className="prototype-empty content-panel"><h3>No tools match yet.</h3><p>Try a broader search or clear one of the filters.</p><button type="button" onClick={clearFilters}>Show all tools</button></div>}
    </section>
  </div>;
}
