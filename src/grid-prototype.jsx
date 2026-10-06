import { safeExternalHref } from "../shared/public-url.mjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookmarkSimple, CaretDown, Clock } from "./icons/index.jsx";
import { ArticleIntake } from "./App.jsx";
import { AiLensBadge } from "./AiLensBadge.jsx";
import { SiteFooter } from "./SiteFooter.jsx";
import { GridHeader } from "./GridHeader.jsx";
import { validateEditionTaxonomy } from "./taxonomy.js";
import { normalizeArchiveDays } from "./archive.jsx";
import { PrototypeArchive, PrototypeToolbox } from "./grid-prototype-routes.jsx";
import { editorialHref, publishedHref } from "./editorial-routes.js";
import { useSquareLayouts } from "./useSquareLayouts.js";
import { HighlightedText } from "./HighlightedText.jsx";
import { SecondaryButton } from "./SecondaryButton.jsx";
import { ArchiveReadingDesk } from "./ArchiveReadingDesk.jsx";

const readingMode = window.location.pathname.endsWith("grid-prototype.html") ? new URLSearchParams(window.location.search).get("reading") : "combined";
const readingDesk = ["desk", "combined"].includes(readingMode);

const editorialTitles = {
  "if-ai-is-doing-the-first-pass-what-evidence-do-designers-now-owe": <>A first pass needs <em>proof.</em></>,
  "as-more-work-is-ai-generated-should-design-teams-optimize-for-co": <>Context becomes <em>the handoff.</em></>,
  "are-designers-finally-admitting-that-visual-sameness-is-an-infra": <>Sameness is built into <em>the system.</em></>,
  "if-junior-tasks-are-disappearing-into-ai-what-practice-survives-": <>Protect the work that <em>teaches judgment.</em></>,
};

function formatDate(date, compact = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return date || "";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: compact ? undefined : "long",
    day: "numeric",
    month: compact ? "short" : "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function crawlDay(date) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return date === today ? "today" : formatDate(date, true);
}

function sourceDomain(signal) {
  try { return new URL(signal.url).hostname.replace(/^www\./, ""); }
  catch { return signal.source || "Source"; }
}

function prototypeRoute() {
  const hash = window.location.hash;
  const [path, query = ""] = hash.replace(/^#\/?/, "").split("?");
  if (readingDesk && path.startsWith("questions/")) return { name: "archive", category: "All" };
  if (path === "archive") {
    const category = new URLSearchParams(query).get("category");
    return { name: "archive", category: ["UI", "UX", "Process", "Culture"].includes(category) ? category : "All" };
  }
  return { name: path === "toolbox" ? "toolbox" : "today", category: "All" };
}

const trailStopWords = new Set("design designers designer teams team work first their than that what when should would there does with from more have into just still being before after they them which these those about while really most exactly where doing make been will also only same using used strongest signal signals question questions now".split(" "));
function trailWords(record) {
  const text = `${record.question} ${record.answerText || record.answer || ""} ${record.editorialTitle || ""}`;
  return new Set((text.toLowerCase().match(/[a-z]{4,}/g) || []).filter((word) => !trailStopWords.has(word)));
}

function ReadingTrail({ question, records, date }) {
  const current = records.find((record) => record.dateISO === date && record.slug === question.slug);
  const skills = current?.skillLabels || [];
  const words = trailWords(current || question);
  const candidates = records.map((record) => ({ record, words: trailWords(record) }));
  const wordFrequency = new Map();
  for (const entry of candidates) for (const word of entry.words) wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
  const seen = new Set([question.question.trim().toLowerCase()]);
  const related = candidates
    .filter(({ record }) => record.dateISO < date && record.slug !== question.slug)
    .map((entry) => ({ ...entry, sharedSkills: entry.record.skillLabels.filter((skill) => skills.includes(skill)), overlap: [...entry.words].filter((word) => words.has(word)) }))
    .filter((entry) => entry.record.category === question.category || entry.overlap.length >= 3)
    .map((entry) => ({ ...entry, score: entry.overlap.reduce((score, word) => score + Math.log2(1 + records.length / wordFrequency.get(word)), 0) + entry.sharedSkills.length + Number(entry.record.category === question.category) * 2 }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.record.dateISO.localeCompare(a.record.dateISO))
    .filter(({ record }) => {
      const text = record.question.trim().toLowerCase();
      if (seen.has(text)) return false;
      seen.add(text);
      return true;
    }).slice(0, 2);
  return <section className="reading-trail" aria-labelledby={`reading-trail-${question.id}`}>
    <p className="reading-trail-eyebrow">Reading trail</p>
    <h3 id={`reading-trail-${question.id}`}>Follow this thread</h3>
    <p className="reading-trail-intro">Another perspective can change the question. Find more context in the archive.</p>
    {related.length > 0 && <ol>{related.map(({ record }) => <li key={record.key}>
      <a href={editorialHref(`/questions/${encodeURIComponent(record.dateISO)}/${encodeURIComponent(record.slug)}`)}>
        <span className="reading-trail-meta">{record.category} · {record.archiveReference}</span>
        <span className="reading-trail-question">{record.question}</span>
        <span className="reading-trail-arrow" aria-hidden="true">↗</span>
      </a>
    </li>)}</ol>}
    <a className="reading-trail-browse" href={editorialHref(`/archive?category=${encodeURIComponent(question.category)}`)}>Continue in the {question.category} archive<span aria-hidden="true">↗</span></a>
  </section>;
}

function SignalDetails({ question, records, date, onClose }) {
  return (
    <div className="signal-table-wrap">
      <table className="signal-table">
        <caption>Signals for {question.question}</caption>
        <thead><tr><th>Source</th><th>What happened</th><th>What changes</th><th>Verdict</th></tr></thead>
        <tbody>{question.signals.map((signal, index) => (
          <tr key={`${question.id}-${index}`}>
            <td data-label="Source"><a className="signal-source-title" href={safeExternalHref(signal.url)} target="_blank" rel="noopener noreferrer">{signal.title} <span aria-hidden="true">↗</span></a><span className="signal-publisher">{signal.source}</span><span className="signal-source-meta">{signal.kind} · {signal.timing}</span></td>
            <td data-label="What happened"><div className="signal-copy"><HighlightedText text={signal.happened} /></div></td>
            <td data-label="What changes"><div className="signal-copy"><HighlightedText text={signal.changes} /></div></td>
            <td data-label="Verdict"><span className={signal.verdict === "Must read" ? "must-read" : ""}>{signal.verdict}</span></td>
          </tr>
        ))}</tbody>
      </table>
      <ReadingTrail question={question} records={records} date={date} />
      <SecondaryButton className="signals-close" aria-expanded={true} aria-controls={`prototype-details-${question.id}`} onClick={onClose}>Close source notes<CaretDown size={18} aria-hidden="true" /></SecondaryButton>
    </div>
  );
}

function EditorialSpread({ question, records, date, editorialTitle, isOpen, isSaved, onToggle, onSave }) {
  const detailId = `prototype-details-${question.id}`;
  const disclosureRef = useRef(null);
  const closeNotes = () => {
    if (!isOpen) return;
    onToggle();
    // Return readers to the control after collapsing content they were reading.
    requestAnimationFrame(() => disclosureRef.current?.focus());
  };
  const categories = [question.category, ...(question.tags || []).filter((tag) => tag !== question.category)];
  return (
    <section className={`editorial-spread ${isOpen ? "is-open" : ""} ${question.signals.length > 1 ? "has-multiple-signals" : ""}`} id={`prototype-question-${question.id}`} aria-labelledby={`prototype-title-${question.id}`} onKeyDown={(event) => {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        event.stopPropagation();
        closeNotes();
      }
    }}>
      <div className="editorial-heading content-panel">
        <span className="editorial-sequence" aria-hidden="true">{question.id}</span>
        <div className="editorial-heading-copy">
          <h2 id={`prototype-title-${question.id}`}><button type="button" aria-expanded={isOpen} aria-controls={detailId} onClick={onToggle}>{editorialTitle}</button></h2>
          <div className="editorial-tags" aria-label="Question categories">{categories.map((category) => <a key={category} href={editorialHref(`/archive?category=${encodeURIComponent(category)}`)}>{category} <span aria-hidden="true">↗</span></a>)}{question.aiLens && <AiLensBadge />}</div>
        </div>
      </div>
      <div className="editorial-note content-panel">
        <div className="question-overline">
          <p className="section-kicker">The question</p>
          <button className={`bookmark-button ${isSaved ? "saved" : ""}`} type="button" aria-pressed={isSaved} onClick={onSave}>{isSaved ? "Bookmarked" : "Bookmark"}<BookmarkSimple size={17} weight={isSaved ? "fill" : "regular"} aria-hidden="true" /></button>
        </div>
        <h3>{question.question}</h3>
        <p className="section-kicker why-label">Why it matters</p>
        <p className="answer-copy"><HighlightedText text={question.answer} as="em" /></p>
        <section className="editorial-context" aria-labelledby={`editorial-context-${question.id}`}>
          <p className="section-kicker" id={`editorial-context-${question.id}`}>Editorial context</p>
          <p>{question.why}</p>
          <small>First seen {String(question.firstSeen || "").replace(/\bcet\b/i, "CET")}</small>
        </section>
      </div>
      <div className="source-panel content-panel">
        <p className="section-kicker">{question.signals.length === 1 ? "Source" : "Sources"} <span>·</span> {question.signals.length}</p>
        <ol className="prototype-source-list">{question.signals.map((signal, signalIndex) => (
          <li key={`${question.id}-${signalIndex}`}><a href={safeExternalHref(signal.url)} target="_blank" rel="noopener noreferrer"><span className="source-title">{signal.title}</span><span className="source-meta">{sourceDomain(signal)} · {signal.kind} · {signal.timing}</span><span className="source-external" aria-hidden="true">↗</span></a></li>
        ))}</ol>
        <SecondaryButton ref={disclosureRef} id={`prototype-disclosure-${question.id}`} className="signals-disclosure" aria-expanded={isOpen} aria-controls={detailId} onClick={onToggle}>{isOpen ? "Close source notes" : "Read source notes"}<CaretDown size={18} aria-hidden="true" /></SecondaryButton>
      </div>
      <div className="signal-details" id={detailId} role="region" aria-labelledby={`prototype-disclosure-${question.id}`} hidden={!isOpen}><SignalDetails question={question} records={records} date={date} onClose={closeNotes} /></div>
    </section>
  );
}

function readSavedQuestions() {
  try { return JSON.parse(localStorage.getItem("design-daily-question-bookmarks-v1") || "{}"); }
  catch { return {}; }
}

function TodayIntake() {
  return <div className="intake-cell content-panel"><ArticleIntake /></div>;
}

function TodayOpening({ edition, questions, headline, summary, mobile }) {
  return <section className="opening" id="today" aria-label="Today’s edition overview">
    <div className="opening-copy content-panel"><p className="eyebrow">Today <span>·</span> {questions.length} questions worth asking</p><h1>{headline}</h1></div>
    <div className="opening-summary content-panel"><p>{summary}</p><div className="crawl-line"><span><Clock size={15} aria-hidden="true" /> Last crawl {crawlDay(edition.date)} · {edition.crawlCompletedAt}</span><small>{edition.sourceCount} total sources · {edition.webSourceCount} web sources · {edition.teamContributionCount} team links</small></div></div>
    {!mobile && <TodayIntake />}
    <aside className="question-index content-panel" aria-label="Today’s four questions"><div className="question-index-content"><p className="section-kicker">The questions</p><ol>{questions.map((question, index) => (
      <li key={question.id}><span className="question-number">Q{index + 1}</span><span className="question-entry"><a href={`#prototype-question-${question.id}`}>{question.question}<span aria-hidden="true">&nbsp;↘</span></a><small>{[question.category, ...(question.tags || []).filter((tag) => tag !== question.category)].join(" · ")}</small></span></li>
    ))}</ol><p className="index-note">Edition {edition.editionNumber} · {formatDate(edition.date)}</p></div></aside>
  </section>;
}

export function GridPrototype() {
  const shellRef = useRef(null);
  useSquareLayouts(shellRef);
  const [edition, setEdition] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [openQuestions, setOpenQuestions] = useState({});
  const [savedQuestions, setSavedQuestions] = useState(readSavedQuestions);
  const [route, setRoute] = useState(prototypeRoute);
  const [archiveEditions, setArchiveEditions] = useState([]);
  const [archiveReady, setArchiveReady] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 720px)").matches);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 720px)");
    const update = () => setMobile(query.matches);
    query.addEventListener("change", update);
    update();
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const light = route.name === "toolbox";
    document.documentElement.classList.toggle("toolbox-route", light);
    document.body.classList.toggle("toolbox-route", light);
    return () => {
      document.documentElement.classList.remove("toolbox-route");
      document.body.classList.remove("toolbox-route");
    };
  }, [route.name]);

  useEffect(() => {
    const updateRoute = () => {
      const questionAnchor = /^#prototype-question-\d+$/.test(window.location.hash);
      if (window.location.hash && window.location.hash !== "#" && !window.location.hash.startsWith("#/") && !questionAnchor) return;
      const next = prototypeRoute();
      setRoute((current) => {
        if (current.name !== next.name && !questionAnchor) window.scrollTo({ top: 0, behavior: "instant" });
        return next;
      });
    };
    window.addEventListener("hashchange", updateRoute);
    return () => window.removeEventListener("hashchange", updateRoute);
  }, []);

  useEffect(() => {
    if (route.name !== "today" || !/^#prototype-question-\d+$/.test(window.location.hash)) return;
    const frame = requestAnimationFrame(() => document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "start", behavior: "instant" }));
    return () => cancelAnimationFrame(frame);
  }, [route.name]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}data/latest.json`, { cache: "no-store", signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("Edition unavailable"); return response.json(); })
      .then((data) => setEdition(validateEditionTaxonomy(data)))
      .catch((error) => { if (error.name !== "AbortError") setLoadError(true); });
    return () => controller.abort();
  }, []);

  useEffect(() => { localStorage.setItem("design-daily-question-bookmarks-v1", JSON.stringify(savedQuestions)); }, [savedQuestions]);

  useEffect(() => {
    if (!edition) return;
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}data/archive/index.json`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("Archive unavailable"); return response.json(); })
      .then((entries) => Promise.all(entries.filter((entry) => entry.date && entry.date !== edition.date).map((entry) => fetch(`${import.meta.env.BASE_URL}data/archive/${entry.date}.json`, { signal: controller.signal }).then((response) => response.ok ? response.json() : null).catch(() => null))))
      .then((days) => { setArchiveEditions(days.filter(Boolean).map(validateEditionTaxonomy)); setArchiveReady(true); })
      .catch((error) => { if (error.name !== "AbortError") setArchiveReady(true); });
    return () => controller.abort();
  }, [edition]);

  const archiveRecords = useMemo(() => edition ? normalizeArchiveDays([edition, ...archiveEditions].map((day) => ({ ...day, dateISO: day.date }))) : [], [edition, archiveEditions]);

  if (!edition) return <main className="grid-prototype prototype-loading"><p>{loadError ? "Today’s edition is unavailable. Refresh to try again." : "Loading today’s edition…"}</p></main>;

  const questions = edition.questions || [];
  const summary = edition.summary?.match(/[^.!?]+[.!?]+(?=\s|$)/g)?.[0]?.trim() || edition.summary;
  const headline = edition.headline || (edition.summary?.startsWith("AI is no longer just speeding design")
    ? <>Design must <em>prove its work.</em></>
    : <>Today’s design questions, <em>in focus.</em></>);

  return (
    <div ref={shellRef} className={`prototype-shell ${route.name === "toolbox" ? "is-toolbox" : route.name === "today" ? "is-today" : ""}`}>
      <a className="prototype-skip" href={route.name === "today" ? "#prototype-question-01" : route.name === "archive" ? "#prototype-archive-index" : "#prototype-our-toolbox-title"} onClick={readingDesk && route.name === "archive" ? (event) => {
        event.preventDefault();
        const target = document.querySelector("#desk-question-title") || document.querySelector("#prototype-archive-index");
        target?.focus({ preventScroll: true });
        if (readingMode === "combined") {
          const desk = document.querySelector("#prototype-archive-index");
          const headerHeight = document.querySelector(".prototype-header")?.getBoundingClientRect().height || 0;
          window.scrollTo({ top: Math.max(0, desk.getBoundingClientRect().top + window.scrollY - headerHeight), behavior: "instant" });
        }
      } : undefined}>Skip to main content</a>
      <GridHeader date={edition.date} route={route.name} />
      <main className="grid-prototype" aria-label={`design / daily ${route.name}`}>
        <div className="grid-content">
          {route.name === "archive" && (readingDesk
            ? <ArchiveReadingDesk records={archiveRecords} ready={archiveReady} bookmarks={savedQuestions} onBookmark={(key) => setSavedQuestions((state) => ({ ...state, [key]: !state[key] }))} withEditorialOpening={readingMode === "combined"} />
            : <PrototypeArchive records={archiveRecords} ready={archiveReady} bookmarks={savedQuestions} onBookmark={(key) => setSavedQuestions((state) => ({ ...state, [key]: !state[key] }))} initialCategory={route.category} />)}
          {route.name === "toolbox" && <PrototypeToolbox />}
          {route.name === "today" && <>
          <TodayOpening edition={edition} questions={questions} headline={headline} summary={summary} mobile={mobile} />

          {questions.map((question) => {
            const savedKey = `${edition.date}:${question.slug}`;
            const editorialTitle = question.editorialTitle || editorialTitles[question.slug] || question.question;
            return <EditorialSpread key={question.id} question={question} records={archiveRecords} date={edition.date} editorialTitle={editorialTitle} isOpen={Boolean(openQuestions[question.id])} isSaved={Boolean(savedQuestions[savedKey])} onToggle={() => setOpenQuestions((state) => ({ ...state, [question.id]: !state[question.id] }))} onSave={() => setSavedQuestions((state) => ({ ...state, [savedKey]: !state[savedKey] }))} />;
          })}
          {mobile && <section className="today-contribution" aria-label="Contribute an article"><TodayIntake /></section>}
          </>}

          <SiteFooter theme={route.name === "toolbox" ? "light" : "forest"} privacyHref={publishedHref("/privacy")} />
        </div>
      </main>
    </div>
  );
}
