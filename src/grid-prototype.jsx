import { useEffect, useMemo, useRef, useState } from "react";
import { BookmarkSimple, CaretDown, Clock } from "@phosphor-icons/react";
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

function SignalDetails({ question }) {
  return (
    <div className="signal-table-wrap">
      <table className="signal-table">
        <caption>Signals for {question.question}</caption>
        <thead><tr><th>Source</th><th>What happened</th><th>What changes</th><th>Verdict</th></tr></thead>
        <tbody>{question.signals.map((signal, index) => (
          <tr key={`${question.id}-${index}`}>
            <td data-label="Source"><a className="signal-source-title" href={signal.url} target="_blank" rel="noopener noreferrer">{signal.title} <span aria-hidden="true">↗</span></a><span className="signal-publisher">{signal.source}</span><span className="signal-source-meta">{signal.kind} · {signal.timing}</span></td>
            <td data-label="What happened"><div className="signal-copy"><HighlightedText text={signal.happened} /></div></td>
            <td data-label="What changes"><div className="signal-copy"><HighlightedText text={signal.changes} /></div></td>
            <td data-label="Verdict"><span className={signal.verdict === "Must read" ? "must-read" : ""}>{signal.verdict}</span></td>
          </tr>
        ))}</tbody>
      </table>
      <div className="question-trail"><p>Question archive</p><a href={editorialHref(`/archive?category=${encodeURIComponent(question.category)}`)}><span>Explore similar questions</span><small>More from {question.category} in the archive</small><span aria-hidden="true">↗</span></a></div>
    </div>
  );
}

function EditorialSpread({ question, editorialTitle, isOpen, isSaved, onToggle, onSave }) {
  const detailId = `prototype-details-${question.id}`;
  const categories = [question.category, ...(question.tags || []).filter((tag) => tag !== question.category)];
  return (
    <section className={`editorial-spread ${isOpen ? "is-open" : ""} ${question.signals.length > 1 ? "has-multiple-signals" : ""}`} id={`prototype-question-${question.id}`} aria-labelledby={`prototype-title-${question.id}`}>
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
          <button className={`bookmark-button ${isSaved ? "saved" : ""}`} type="button" aria-pressed={isSaved} onClick={onSave}>{isSaved ? "Bookmarked for me" : "Bookmark for me"}<BookmarkSimple size={17} weight={isSaved ? "fill" : "regular"} aria-hidden="true" /></button>
        </div>
        <h3>{question.question}</h3>
        <p className="section-kicker why-label">Why it matters</p>
        <p className="answer-copy"><HighlightedText text={question.answer} as="em" /></p>
      </div>
      <div className="practice-panel content-panel"><p className="section-kicker">Editorial context</p><p>{question.why}</p><small>First seen {String(question.firstSeen || "").replace(/\bcet\b/i, "CET")}</small></div>
      <div className="source-panel content-panel">
        <p className="section-kicker">{question.signals.length === 1 ? "Source" : "Sources"} <span>·</span> {question.signals.length}</p>
        <ol className="prototype-source-list">{question.signals.map((signal, signalIndex) => (
          <li key={`${question.id}-${signalIndex}`}><a href={signal.url} target="_blank" rel="noopener noreferrer"><span className="source-title">{signal.title}</span><span className="source-meta">{sourceDomain(signal)} · {signal.kind} · {signal.timing}</span><span className="source-external" aria-hidden="true">↗</span></a></li>
        ))}</ol>
        <SecondaryButton className="signals-disclosure" aria-expanded={isOpen} aria-controls={detailId} onClick={onToggle}>{isOpen ? "Close sources" : "Open sources"} <span>{question.counts?.total || question.signals.length}</span><CaretDown size={18} weight="bold" aria-hidden="true" /></SecondaryButton>
      </div>
      <div className="signal-details" id={detailId} hidden={!isOpen}><SignalDetails question={question} /></div>
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
      if (window.location.hash && window.location.hash !== "#" && !window.location.hash.startsWith("#/")) return;
      const next = prototypeRoute();
      setRoute((current) => {
        if (current.name !== next.name) window.scrollTo({ top: 0, behavior: "instant" });
        return next;
      });
    };
    window.addEventListener("hashchange", updateRoute);
    return () => window.removeEventListener("hashchange", updateRoute);
  }, []);

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
    <div ref={shellRef} className={`prototype-shell ${route.name === "toolbox" ? "is-toolbox" : ""}`}>
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
            return <EditorialSpread key={question.id} question={question} editorialTitle={editorialTitle} isOpen={Boolean(openQuestions[question.id])} isSaved={Boolean(savedQuestions[savedKey])} onToggle={() => setOpenQuestions((state) => ({ ...state, [question.id]: !state[question.id] }))} onSave={() => setSavedQuestions((state) => ({ ...state, [savedKey]: !state[savedKey] }))} />;
          })}
          {mobile && <section className="today-contribution" aria-label="Contribute an article"><TodayIntake /></section>}
          </>}

          <SiteFooter theme={route.name === "toolbox" ? "light" : "forest"} privacyHref={publishedHref("/privacy")} />
        </div>
      </main>
    </div>
  );
}
