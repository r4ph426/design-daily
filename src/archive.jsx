import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookmarkSimple,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { AiLensBadge } from "./AiLensBadge.jsx";
import { CATEGORIES } from "./taxonomy.js";

export const RECENT_POPULARITY = Object.freeze({ minimumSaves: 3, trailingDays: 30 });

export const SKILL_LABELS = Object.freeze([
  { name: "Accessibility", meaning: "Designing so people with different abilities can use the experience." },
  { name: "Collaboration", meaning: "Working through critique, ownership, and decisions with a team." },
  { name: "Content design", meaning: "Using language and information to guide understanding and action." },
  { name: "Design systems", meaning: "Creating reusable rules, components, and governance." },
  { name: "Ethics", meaning: "Examining power, harm, consent, and responsibility." },
  { name: "Information architecture", meaning: "Structuring content, navigation, and relationships." },
  { name: "Product strategy", meaning: "Connecting design choices to product direction and outcomes." },
  { name: "Prototyping", meaning: "Making ideas testable before committing to production." },
  { name: "Research", meaning: "Learning from evidence, behavior, and lived experience." },
  { name: "Visual craft", meaning: "Shaping hierarchy, typography, color, and composition." },
]);

const skillNames = new Set(SKILL_LABELS.map((label) => label.name));
const skillRules = [
  ["Accessibility", /accessib|inclusive|disabil|contrast|keyboard|assistive/i],
  ["Collaboration", /team|critique|ownership|culture|collabor|stakeholder|authorship/i],
  ["Content design", /content|writing|language|copy|label|newsletter/i],
  ["Design systems", /design system|component|token|governance|reus|system/i],
  ["Ethics", /ethic|harm|consent|responsib|bias|trust|unsafe|human/i],
  ["Information architecture", /information architecture|navigation|structure|find|search|folder|taxonomy/i],
  ["Product strategy", /strategy|value|business|product|priorit|roadmap|market/i],
  ["Prototyping", /prototyp|wireframe|mockup|iteration|generate|canvas/i],
  ["Research", /research|evidence|participant|interview|test|behavior|assumption/i],
  ["Visual craft", /visual|typograph|color|taste|layout|interface|craft|brand|style/i],
];

const categoryFallback = {
  UI: ["Visual craft", "Design systems"],
  UX: ["Research", "Information architecture"],
  Process: ["Prototyping", "Collaboration"],
  Culture: ["Ethics", "Product strategy"],
};

const startHerePaths = [
  { category: "UI", title: "Learn to see hierarchy", copy: "Read interfaces as systems of emphasis, rhythm, and reusable decisions." },
  { category: "UX", title: "Begin with people and evidence", copy: "Understand behavior before turning an assumption into a screen." },
  { category: "Process", title: "Make the work testable", copy: "Use framing, prototypes, and critique to improve the decision, not only the output." },
  { category: "Culture", title: "Design inside a wider context", copy: "Notice how incentives, authorship, power, and taste shape what teams make." },
];

function textFromNode(node) {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join("");
  return textFromNode(node?.props?.children);
}

function sourceCountLabel(record) {
  const count = record.counts?.total || record.signals?.length || 0;
  return `${count} ${count === 1 ? "source" : "sources"}`;
}

function stableNumber(value, minimum, maximum) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return minimum + (Math.abs(hash) % (maximum - minimum + 1));
}

function inferSkillLabels(question) {
  const declared = Array.isArray(question.skillLabels)
    ? question.skillLabels.filter((label) => skillNames.has(label))
    : [];
  if (declared.length) return declared.slice(0, 3);

  const sourceText = (question.signals || []).map((signal) => `${signal.title || ""} ${signal.happened || ""} ${signal.changes || ""}`).join(" ");
  const haystack = `${question.question || ""} ${textFromNode(question.answer)} ${question.why || ""} ${sourceText}`;
  const matches = skillRules.filter(([, rule]) => rule.test(haystack)).map(([name]) => name);
  return [...new Set([...matches, ...(categoryFallback[question.category] || [])])].slice(0, 3);
}

function normalizeDate(date) {
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

function displayArchiveDate(date, fallback) {
  const parsed = normalizeDate(date);
  if (!parsed) return fallback || date;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(parsed);
}

export function questionRoute(record) {
  return `#/questions/${encodeURIComponent(record.dateISO)}/${encodeURIComponent(record.slug)}`;
}

export function normalizeArchiveDays(archiveDays) {
  return archiveDays.flatMap((day) => day.questions.map((question, index) => {
    const slug = question.slug || `question-${index + 1}`;
    const key = `${day.dateISO}:${slug}`;
    const allTimeSaves = question.popularity?.allTimeSaves ?? stableNumber(key, 4, 38);
    const recent30DaySaves = question.popularity?.recent30DaySaves ?? stableNumber(`${key}:recent`, 0, 5);
    return {
      ...question,
      answerText: textFromNode(question.answer).replaceAll("**", ""),
      dateISO: day.dateISO,
      dateLabel: displayArchiveDate(day.dateISO, day.date),
      editionNumber: day.editionNumber,
      editionLabel: `Edition ${day.editionNumber}`,
      key,
      slug,
      archiveNumber: String(index + 1).padStart(2, "0"),
      archiveReference: `${day.editionNumber}/${String(index + 1).padStart(2, "0")}`,
      skillLabels: inferSkillLabels(question),
      popularity: { allTimeSaves, recent30DaySaves },
    };
  }));
}

export function readHashRoute() {
  const raw = window.location.hash || "";
  if (!raw.startsWith("#/")) return { name: "home", anchor: raw.replace(/^#/, "") };
  const [path, query = ""] = raw.slice(1).split("?");
  const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  const params = new URLSearchParams(query);
  if (parts[0] === "archive") {
    return {
      name: "archive",
      category: CATEGORIES.includes(params.get("category")) ? params.get("category") : "All",
      focusSearch: params.get("focus") === "search",
      key: raw,
    };
  }
  if (parts[0] === "questions" && parts[1] && parts[2]) {
    return { name: "question", dateISO: parts[1], slug: parts[2], key: raw };
  }
  return { name: "not-found", key: raw };
}

function Popularity({ record, detailed = false }) {
  const recent = record.popularity.recent30DaySaves >= RECENT_POPULARITY.minimumSaves;
  return (
    <div className="archive-popularity">
      <span>{record.popularity.allTimeSaves} team saves · all time</span>
      {recent && (
        <span className="recently-popular" title={`${record.popularity.recent30DaySaves} saves in the last ${RECENT_POPULARITY.trailingDays} days`}>
          Popular recently{detailed ? ` · ${record.popularity.recent30DaySaves} in ${RECENT_POPULARITY.trailingDays} days` : ""}
        </span>
      )}
    </div>
  );
}

function BookmarkButton({ record, saved, onBookmark, longLabel = false }) {
  return (
    <button
      type="button"
      className={`archive-bookmark ${saved ? "saved" : ""}`}
      aria-pressed={saved}
      onClick={() => onBookmark(record.key)}
    >
      <span>{longLabel ? (saved ? "Bookmarked for me" : "Bookmark question for me") : (saved ? "Saved" : "Save")}</span>
      <BookmarkSimple size={18} weight={saved ? "fill" : "regular"} />
    </button>
  );
}

function StartHere({ records }) {
  return (
    <section className="start-here" aria-labelledby="start-here-title">
      <header className="section-heading">
        <div>
          <p className="meta-label">Editorial starting points</p>
          <h2 id="start-here-title">Start here</h2>
        </div>
        <p>Four foundations for designers finding their footing. Selected by the editors, never by save count.</p>
      </header>
      <div className="start-here-grid">
        {startHerePaths.map((path) => {
          const record = records.find((item) => item.category === path.category);
          return (
            <article className="start-path" key={path.category}>
              <span>{path.category}</span>
              <h3>{path.title}</h3>
              <p>{path.copy}</p>
              {record && <a href={questionRoute(record)}>Read a foundational question <ArrowRight size={16} /></a>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function dateMatches(record, value) {
  if (value === "any") return true;
  if (value.startsWith("month:")) return record.dateISO.startsWith(value.slice(6));
  const days = Number(value.replace("days:", ""));
  if (!Number.isFinite(days)) return true;
  const latest = new Date();
  const date = normalizeDate(record.dateISO);
  return date && (latest - date) / 86_400_000 <= days;
}

function ArchiveRow({ record, saved, onBookmark }) {
  return (
    <article className="archive-question-row">
      <div className="archive-question-id">
        <span className="archive-reference">{record.archiveReference}</span>
        <small>{record.category}</small>
        {record.aiLens && <AiLensBadge />}
      </div>
      <div className="archive-question-copy">
        <h3><a href={questionRoute(record)}>{record.question}</a></h3>
        <p>{record.answerText}</p>
        <div className="skill-labels" aria-label="Skill labels">
          {record.skillLabels.map((label) => <span key={label}>{label}</span>)}
        </div>
      </div>
      <aside className="archive-question-meta">
        <span>{record.editionLabel} · {record.dateLabel}</span>
        <span>{sourceCountLabel(record)}</span>
        <Popularity record={record} />
        <a className="open-question-link" href={questionRoute(record)}>Open question <ArrowRight size={15} /></a>
        <BookmarkButton record={record} saved={saved} onBookmark={onBookmark} />
      </aside>
    </article>
  );
}

export function ArchivePage({ records, bookmarks, onBookmark, initialCategory = "All", focusSearch = false }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [skill, setSkill] = useState("All skills");
  const [date, setDate] = useState("any");
  const searchRef = useRef(null);

  useEffect(() => setCategory(initialCategory), [initialCategory]);
  useEffect(() => {
    document.title = "Question archive · design / daily";
    window.scrollTo(0, 0);
    if (focusSearch) window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => { document.title = "design / daily"; };
  }, [focusSearch]);

  const months = useMemo(() => [...new Set(records.map((record) => record.dateISO.slice(0, 7)))].sort().reverse(), [records]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const result = records.filter((record) => {
      const searchable = `${record.question} ${record.answerText} ${record.why || ""} ${record.skillLabels.join(" ")} ${(record.signals || []).map((signal) => `${signal.title || ""} ${signal.source || ""}`).join(" ")}`.toLowerCase();
      return (!needle || searchable.includes(needle))
        && (category === "All"
          || (category === "Must read" && record.signals?.some((signal) => signal.verdict?.toLowerCase() === "must read"))
          || record.category === category)
        && (skill === "All skills" || record.skillLabels.includes(skill))
        && dateMatches(record, date);
    });
    return [...result].sort((a, b) => b.dateISO.localeCompare(a.dateISO) || Number(a.archiveNumber) - Number(b.archiveNumber));
  }, [category, date, query, records, skill]);

  const resetFilters = () => {
    setQuery("");
    setCategory("All");
    setSkill("All skills");
    setDate("any");
  };

  return (
    <>
      <section className="archive-hero" aria-labelledby="archive-page-title">
        <div>
          <p className="meta-label">Question archive</p>
          <h1 id="archive-page-title">Questions worth returning to.</h1>
          <p>Find a question you remember, or follow an editorial path into the ideas shaping design practice.</p>
        </div>
        <aside>
          <p className="archive-total">{records.length}<small>Questions across {new Set(records.map((record) => record.editionNumber)).size} weekday editions</small></p>
          <p>Popular ranks all-time team saves. Popular recently means at least {RECENT_POPULARITY.minimumSaves} distinct saves in the trailing {RECENT_POPULARITY.trailingDays} days.</p>
        </aside>
      </section>

      <StartHere records={records} />

      <section className="archive-index" id="question-index" aria-labelledby="question-index-title">
        <header className="section-heading index-heading">
          <div>
            <p className="meta-label">Dense index</p>
            <h2 id="question-index-title">Question index</h2>
          </div>
        </header>

        <div className="archive-search-row">
          <label className="archive-search">
            <MagnifyingGlass size={19} />
            <span className="visually-hidden">Search questions</span>
            <span className="archive-search-copy">
              <input ref={searchRef} type="search" placeholder="Search questions, answers, or sources" value={query} onChange={(event) => setQuery(event.target.value)} />
              <small>Search by question, answer, skill label, or source title.</small>
            </span>
          </label>
        </div>

        <div className="archive-filter-panel">
          <div className="category-filters" role="group" aria-label="Category filter">
            {["All", ...CATEGORIES, "Must read"].map((item) => <button type="button" className={category === item ? "selected" : ""} aria-pressed={category === item} onClick={() => setCategory(item)} key={item}>{item}</button>)}
          </div>
          <label><span>Skill label</span><select value={skill} onChange={(event) => setSkill(event.target.value)}><option>All skills</option>{SKILL_LABELS.map((label) => <option key={label.name}>{label.name}</option>)}</select></label>
          <label><span>Date</span><select value={date} onChange={(event) => setDate(event.target.value)}><option value="any">Any date</option><option value="days:30">Past 30 days</option><option value="days:90">Past 90 days</option>{months.map((month) => <option value={`month:${month}`} key={month}>{new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00`))}</option>)}</select></label>
        </div>

        <div className="archive-results-summary">
          <p>{filtered.length} {filtered.length === 1 ? "question" : "questions"}</p>
          <p>Skill labels describe the practice needed to engage with a question.</p>
          {(query || category !== "All" || skill !== "All skills" || date !== "any") && <button type="button" onClick={resetFilters}>Clear filters</button>}
        </div>

        <div className="archive-question-list">
          {filtered.map((record) => <ArchiveRow record={record} saved={Boolean(bookmarks[record.key])} onBookmark={onBookmark} key={record.key} />)}
          {!filtered.length && (
            <div className="archive-empty">
              <h3>No questions match these filters.</h3>
              <p>Try a broader search or clear one of the filters.</p>
              <button type="button" onClick={resetFilters}>Show all questions</button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export function QuestionDetailPage({ record, records, saved, onBookmark, renderSignals, archiveReady }) {
  useEffect(() => {
    document.title = record ? `${record.question} · design / daily` : "Question · design / daily";
    window.scrollTo(0, 0);
    return () => { document.title = "design / daily"; };
  }, [record]);

  if (!record) {
    return (
      <section className="route-message">
        <p className="meta-label">Question archive</p>
        <h1>{archiveReady ? "This question could not be found." : "Loading the question archive."}</h1>
        {archiveReady && <a href="#/archive">Return to the archive <ArrowRight size={17} /></a>}
      </section>
    );
  }

  const related = records
    .filter((candidate) => candidate.key !== record.key)
    .map((candidate) => ({
      ...candidate,
      relevance: Number(candidate.category === record.category) * 3 + candidate.skillLabels.filter((label) => record.skillLabels.includes(label)).length,
    }))
    .filter((candidate) => candidate.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance || b.dateISO.localeCompare(a.dateISO))
    .slice(0, 3);

  return (
    <>
      <nav className="detail-breadcrumb" aria-label="Breadcrumb"><a href="#/archive"><ArrowLeft size={16} /> Question archive</a></nav>
      <section className="question-detail-hero">
        <div className="detail-number"><span className="archive-reference">{record.archiveReference}</span><small>{record.category}</small>{record.aiLens && <AiLensBadge />}</div>
        <div className="detail-title">
          <p className="meta-label">{record.editionLabel} · {record.dateLabel}</p>
          <h1>{record.question}</h1>
          <div className="skill-labels">{record.skillLabels.map((label) => <span key={label}>{label}</span>)}</div>
        </div>
        <aside className="detail-meta">
          <span>{sourceCountLabel(record)}</span>
          <Popularity record={record} detailed />
          <BookmarkButton record={record} saved={saved} onBookmark={onBookmark} longLabel />
        </aside>
      </section>

      <section className="question-answer" aria-labelledby="why-it-matters-title">
        <div><h2 id="why-it-matters-title">Why it matters</h2></div>
        <div>
          <p className="detail-answer-copy">{record.answerText}</p>
          {record.why && <p className="detail-why-copy">{record.why}</p>}
        </div>
        <aside><p>The answer is editorial synthesis. Open the source record below to inspect the evidence and tradeoffs.</p></aside>
      </section>

      <section className="detail-signals" aria-labelledby="signals-title">
        <header className="section-heading">
          <div><p className="meta-label">Evidence record</p><h2 id="signals-title">Signals &amp; Sources</h2></div>
          <p>{sourceCountLabel(record)} shaped this question.</p>
        </header>
        {renderSignals(record)}
      </section>

      <section className="related-questions" aria-labelledby="related-title">
        <header className="section-heading">
          <div><p className="meta-label">Continue reading</p><h2 id="related-title">Related questions</h2></div>
          <p>Connected through shared skill labels or editorial context, not popularity.</p>
        </header>
        <div className="related-list">
          {related.map((question) => (
            <article key={question.key}>
              <span>{question.category} · {question.editionLabel}</span>
              <h3><a href={questionRoute(question)}>{question.question}</a></h3>
              <div className="skill-labels">{question.skillLabels.map((label) => <span key={label}>{label}</span>)}</div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
