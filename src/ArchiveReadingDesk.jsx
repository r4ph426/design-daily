import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookmarkSimple, Check, LinkSimple, MagnifyingGlass, X } from "@phosphor-icons/react";
import { AiLensBadge } from "./AiLensBadge.jsx";
import { HighlightedText } from "./HighlightedText.jsx";
import { RECENT_POPULARITY, SKILL_LABELS } from "./archive.jsx";
import { archiveReadingWindow, mobileArchivePage, OLDER_QUESTION_BATCH } from "./archive-reading-window.js";
import { ArchiveEditorialOpening } from "./ArchiveEditorialOpening.jsx";
import "./archive-reading-desk.css";

const categories = ["UI", "UX", "Process", "Culture"];

function readLocation() {
  const [path, query = ""] = window.location.hash.replace(/^#\/?/, "").split("?");
  const parts = path.split("/").map(decodeURIComponent);
  const params = new URLSearchParams(query);
  return {
    dateISO: parts[0] === "questions" ? parts[1] : null,
    slug: parts[0] === "questions" ? parts[2] : null,
    query: params.get("q") || "",
    category: categories.includes(params.get("category")) ? params.get("category") : "All",
    mustRead: params.get("mustRead") === "1",
    skill: SKILL_LABELS.some((label) => label.name === params.get("skill")) ? params.get("skill") : "All skills",
    date: params.get("date") || "any",
    page: Math.max(1, Number(params.get("page")) || 1),
  };
}

function hashFor(state, record) {
  const params = new URLSearchParams();
  if (state.query) params.set("q", state.query);
  if (state.category !== "All") params.set("category", state.category);
  if (state.mustRead) params.set("mustRead", "1");
  if (state.skill !== "All skills") params.set("skill", state.skill);
  if (state.date !== "any") params.set("date", state.date);
  if (state.page > 1) params.set("page", state.page);
  const path = record ? `questions/${encodeURIComponent(record.dateISO)}/${encodeURIComponent(record.slug)}` : "archive";
  return `#/${path}${params.size ? `?${params}` : ""}`;
}

function matchesDate(record, value) {
  if (value === "any") return true;
  if (value.startsWith("month:")) return record.dateISO.startsWith(value.slice(6));
  const days = Number(value.slice(5));
  const age = (Date.now() - new Date(`${record.dateISO}T12:00:00`).valueOf()) / 86400000;
  return Number.isFinite(days) && age >= 0 && age <= days;
}

function sourceDomain(signal) {
  try { return new URL(signal.url).hostname.replace(/^www\./, ""); }
  catch { return signal.source; }
}

export function ArchiveReadingDesk({ records, ready, bookmarks, onBookmark, withEditorialOpening = false }) {
  const [route, setRoute] = useState(readLocation);
  const [copied, setCopied] = useState("");
  const [copyError, setCopyError] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(115);
  const deskRef = useRef(null);
  const listRef = useRef(null);
  const readerRef = useRef(null);
  const titleRef = useRef(null);
  const origin = useRef(null);
  const previousSelection = useRef(null);
  const copyTimer = useRef(null);
  const loadMoreRef = useRef(null);
  const pendingIndexJump = useRef(withEditorialOpening && Boolean(route.dateISO || route.query || route.category !== "All" || route.mustRead || route.skill !== "All skills" || route.date !== "any"));
  const pendingRestore = useRef(false);
  const pendingMobileJump = useRef(Boolean(route.dateISO));
  const [olderCount, setOlderCount] = useState(0);
  const [narrow, setNarrow] = useState(() => window.matchMedia("(max-width: 1200px)").matches);
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 720px)").matches);
  const previousNarrow = useRef(narrow);
  const previousMobile = useRef(mobile);
  const selectedKey = route.dateISO && route.slug ? `${route.dateISO}:${route.slug}` : null;
  const selected = records.find((record) => record.key === selectedKey);
  const reading = Boolean(selectedKey);
  const QuestionHeading = mobile ? "h3" : narrow ? "h1" : "h2";
  const IndexHeading = withEditorialOpening ? "h2" : "h1";

  function indexPageTop() {
    if (!deskRef.current) return 0;
    const inset = parseFloat(getComputedStyle(deskRef.current).getPropertyValue("--grid-inset")) || 0;
    return Math.max(0, deskRef.current.getBoundingClientRect().top + window.scrollY - headerHeight - inset);
  }

  function keepReaderVisible() {
    if (!deskRef.current) return;
    const end = deskRef.current.getBoundingClientRect().bottom + window.scrollY;
    const minTop = withEditorialOpening ? indexPageTop() : 0;
    const maxTop = Math.max(minTop, end - window.innerHeight);
    if (window.scrollY < minTop || window.scrollY > maxTop) window.scrollTo({ top: Math.min(maxTop, Math.max(minTop, window.scrollY)), behavior: "instant" });
  }

  useEffect(() => {
    const update = () => setRoute(readLocation());
    window.addEventListener("hashchange", update);
    const media = window.matchMedia("(max-width: 1200px)");
    const phone = window.matchMedia("(max-width: 720px)");
    const resize = () => { setNarrow(media.matches); setMobile(phone.matches); };
    phone.addEventListener("change", resize);
    media.addEventListener("change", resize);
    resize();
    const header = document.querySelector(".prototype-header");
    const observer = new ResizeObserver(() => setHeaderHeight(header?.getBoundingClientRect().height || 115));
    if (header) observer.observe(header);
    return () => {
      window.removeEventListener("hashchange", update);
      media.removeEventListener("change", resize);
      phone.removeEventListener("change", resize);
      observer.disconnect();
      clearTimeout(copyTimer.current);
    };
  }, []);

  useEffect(() => {
    document.title = selected ? `${selected.question} · design / daily` : "Question archive · design / daily";
    return () => { document.title = "design / daily"; };
  }, [selected]);

  useLayoutEffect(() => {
    const previous = previousSelection.current;
    if (mobile) {
      if (reading && selected && (previous !== selectedKey || previousMobile.current !== mobile)) {
        const row = deskRef.current?.querySelector(".desk-result.is-selected");
        if (row && (previousMobile.current !== mobile || !origin.current || origin.current.link?.closest(".desk-result") !== row)) {
          pendingMobileJump.current = true;
        }
      }
      previousSelection.current = selectedKey;
      previousNarrow.current = narrow;
      previousMobile.current = mobile;
      return;
    }
    if (reading && selected) {
      if (previous !== selectedKey || previousNarrow.current !== narrow || previousMobile.current !== mobile) {
        readerRef.current?.scrollTo({ top: 0, behavior: "instant" });
        if (narrow || previousNarrow.current !== narrow) window.scrollTo({ top: 0, behavior: "instant" });
        else keepReaderVisible();
        titleRef.current?.focus({ preventScroll: true });
      }
    } else if (previous && !reading) {
      if (withEditorialOpening) {
        if (origin.current) pendingRestore.current = true;
        else pendingIndexJump.current = true;
      }
      if (listRef.current && origin.current) listRef.current.scrollTop = origin.current.listTop;
      if (origin.current || narrow) window.scrollTo({ top: origin.current?.pageTop || 0, behavior: "instant" });
      const link = origin.current?.link;
      if (link?.isConnected) link.focus({ preventScroll: true });
      else {
        if (withEditorialOpening) window.scrollTo({ top: indexPageTop(), behavior: "instant" });
        deskRef.current?.querySelector("input")?.focus({ preventScroll: true });
      }
    }
    if (selected || !reading) previousSelection.current = selectedKey;
    previousNarrow.current = narrow;
    previousMobile.current = mobile;
  }, [reading, selected, selectedKey, narrow, mobile, withEditorialOpening]);

  useEffect(() => {
    if (!mobile || !selected || !pendingMobileJump.current) return;
    let cancelled = false;
    let first, second;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      first = requestAnimationFrame(() => { second = requestAnimationFrame(() => {
        if (cancelled) return;
        const row = deskRef.current?.querySelector(".desk-result.is-selected");
        row?.scrollIntoView({ block: "start", behavior: "instant" });
        row?.querySelector(".desk-question-toggle")?.focus({ preventScroll: true });
        pendingMobileJump.current = false;
      }); });
    });
    return () => { cancelled = true; cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [selectedKey, selected, mobile, headerHeight]);

  // Wait for shared square-row sizing and fonts before jumping from an editorial path
  // or loading a directly shared question below the preserved opening.
  useEffect(() => {
    if ((mobile && reading) || !withEditorialOpening || (!pendingRestore.current && !pendingIndexJump.current && !(reading && selected && !narrow))) return;
    let cancelled = false;
    let frame;
    let finalFrame;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      frame = requestAnimationFrame(() => {
        finalFrame = requestAnimationFrame(() => {
          if (cancelled) return;
          if (pendingRestore.current && origin.current) {
            pendingRestore.current = false;
            window.scrollTo({ top: origin.current.pageTop, behavior: "instant" });
            origin.current.link?.focus({ preventScroll: true });
          } else if (pendingIndexJump.current) {
            pendingIndexJump.current = false;
            window.scrollTo({ top: indexPageTop(), behavior: "instant" });
            if (reading) titleRef.current?.focus({ preventScroll: true });
            else deskRef.current?.querySelector("input")?.focus({ preventScroll: true });
          } else keepReaderVisible();
        });
      });
    });
    return () => { cancelled = true; cancelAnimationFrame(frame); cancelAnimationFrame(finalFrame); };
  }, [route, selected, narrow, mobile, withEditorialOpening, headerHeight]);

  const filtered = useMemo(() => {
    const needle = route.query.trim().toLowerCase();
    return records.filter((record) => {
      const text = [record.question, record.answerText, record.why, ...record.skillLabels,
        ...(record.signals || []).flatMap((signal) => [signal.title, signal.source])].join(" ").toLowerCase();
      return (!needle || text.includes(needle))
        && (route.category === "All" || record.category === route.category)
        && (!route.mustRead || record.signals?.some((signal) => signal.verdict === "Must read"))
        && (route.skill === "All skills" || record.skillLabels.includes(route.skill))
        && matchesDate(record, route.date);
    }).sort((a, b) => b.dateISO.localeCompare(a.dateISO) || Number(a.archiveNumber) - Number(b.archiveNumber));
  }, [records, route]);
  const months = [...new Set(records.map((record) => record.dateISO.slice(0, 7)))].sort().reverse();
  const activeFilters = route.query || route.category !== "All" || route.mustRead || route.skill !== "All skills" || route.date !== "any";
  const related = useMemo(() => selected ? records.filter((record) => record.key !== selected.key)
    .map((record) => ({ ...record, relevance: Number(record.category === selected.category) * 3 + record.skillLabels.filter((label) => selected.skillLabels.includes(label)).length }))
    .filter((record) => record.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance || b.dateISO.localeCompare(a.dateISO)).slice(0, 3) : [], [selected, records]);
  const selectedIndex = filtered.findIndex((record) => record.key === selectedKey);
  const filterKey = [route.query, route.category, route.mustRead, route.skill, route.date].join("\u0000");
  const initialVisibleCount = archiveReadingWindow(filtered, { query: route.query, date: route.date });
  const visibleCount = archiveReadingWindow(filtered, { query: route.query, date: route.date, olderCount, selectedIndex });
  const mobilePage = mobileArchivePage(filtered, { page: route.page, selectedIndex });
  const visibleRecords = mobile ? mobilePage.records : filtered.slice(0, visibleCount);
  const hasOlder = visibleCount < filtered.length;

  useEffect(() => { setOlderCount(0); }, [filterKey]);
  useEffect(() => {
    if (mobile && selectedIndex >= 0 && route.page !== mobilePage.page) {
      const next = { ...route, page: mobilePage.page };
      window.history.replaceState(window.history.state, "", hashFor(next, selected));
      setRoute(next);
    }
  }, [mobile, selectedIndex, mobilePage.page, route.page]);

  useEffect(() => {
    if (selectedIndex >= initialVisibleCount + olderCount) setOlderCount(selectedIndex + 1 - initialVisibleCount);
  }, [selectedIndex, initialVisibleCount, olderCount]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (mobile || !target || !hasOlder || (narrow && reading)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setOlderCount((count) => Math.max(count, visibleCount - initialVisibleCount) + OLDER_QUESTION_BATCH);
    }, { rootMargin: "300px 0px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasOlder, visibleCount, initialVisibleCount, filterKey, narrow, mobile, reading]);

  function changeFilters(patch) {
    const next = { ...route, ...patch, page: 1, ...(mobile ? { dateISO: null, slug: null } : {}) };
    window.history.replaceState(window.history.state, "", hashFor(next, !mobile && selectedKey ? { dateISO: route.dateISO, slug: route.slug } : null));
    setRoute(next);
  }

  function explorePath(event, category) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const next = { ...route, category, page: 1, dateISO: null, slug: null, query: "", mustRead: false, skill: "All skills", date: "any" };
    origin.current = null;
    pendingRestore.current = false;
    pendingIndexJump.current = true;
    window.location.hash = hashFor(next, null);
    setRoute(next);
  }

  function openQuestion(event, record, fromList = false) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (fromList) origin.current = { link: event.currentTarget, listTop: listRef.current?.scrollTop || 0, pageTop: window.scrollY };
    if (record.key === selectedKey) {
      if (mobile) { closeReader(); return; }
      if (narrow) titleRef.current?.focus({ preventScroll: true });
      return;
    }
    let next = route;
    if (mobile && !filtered.some((item) => item.key === record.key)) {
      const ordered = [...records].sort((a, b) => b.dateISO.localeCompare(a.dateISO) || Number(a.archiveNumber) - Number(b.archiveNumber));
      next = { ...route, query: "", category: "All", mustRead: false, skill: "All skills", date: "any", page: mobileArchivePage(ordered, { selectedIndex: ordered.findIndex((item) => item.key === record.key) }).page };
    }
    if (reading) {
      window.history.replaceState(window.history.state, "", hashFor(next, record));
      setRoute(readLocation());
    } else window.location.hash = hashFor(next, record);
  }

  function closeReader() {
    const mobileTrigger = deskRef.current?.querySelector(".desk-result.is-selected .desk-question-toggle");
    window.history.replaceState(window.history.state, "", hashFor({ ...route, page: mobile ? mobilePage.page : route.page }, null));
    setRoute(readLocation());
    if (mobile) requestAnimationFrame(() => mobileTrigger?.focus({ preventScroll: true }));
  }

  function changePage(page) {
    const next = { ...route, page, dateISO: null, slug: null };
    window.history.replaceState(window.history.state, "", hashFor(next, null));
    setRoute(next);
    requestAnimationFrame(() => {
      listRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
      listRef.current?.querySelector(".desk-question-toggle")?.focus({ preventScroll: true });
    });
  }

  useEffect(() => {
    const escape = (event) => {
      if (event.key === "Escape" && reading && !event.defaultPrevented && !event.target.matches("input, select, textarea")) {
        event.preventDefault();
        closeReader();
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [reading, route]);

  async function copyLink() {
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(selectedKey);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(""), 2400);
    } catch { setCopyError(true); }
  }

  const reader = (<section ref={readerRef} className="desk-reader" hidden={!mobile && narrow && !reading} aria-labelledby={selected ? "desk-question-title" : "desk-reader-message"}>
        {reading && <div className="desk-reader-toolbar">
          <span className="desk-reader-reference">{selected?.archiveReference || "Question"}</span>
          {selected && <button className="desk-text-control" type="button" onClick={copyLink}>{copied === selectedKey ? <Check size={16} aria-hidden="true" /> : <LinkSimple size={16} aria-hidden="true" />}{copied === selectedKey ? "Link copied" : "Copy link"}</button>}
          <button className="desk-text-control desk-close" type="button" onClick={closeReader}>{narrow ? <ArrowLeft size={16} aria-hidden="true" /> : <X size={16} aria-hidden="true" />}{mobile ? "Close question" : narrow ? "Back to results" : "Close reading view"}</button>
        </div>}
        <p className="visually-hidden" role="status">{copied === selectedKey && copied ? "Question link copied." : ""}</p>
        {copyError && <p className="desk-copy-error" role="alert">Copy the question link from your browser’s address bar.</p>}
        {selected ? <div className="desk-reading-content">
          <header className="desk-question-heading">
            <p className="desk-date">{selected.editionLabel} · {selected.dateLabel}</p>
            <div className="desk-question-tags"><span>{selected.category}</span>{selected.aiLens && <AiLensBadge />}</div>
            <QuestionHeading id="desk-question-title" tabIndex={-1} ref={titleRef}>{selected.question}</QuestionHeading>
            <div className="desk-skills">{selected.skillLabels.map((label) => <span key={label}>{label}</span>)}</div>
          </header>
          <section className="desk-answer" aria-labelledby="desk-answer-title">
            <h3 id="desk-answer-title">Why it matters</h3>
            <p><HighlightedText text={selected.answer ?? selected.answerText} as="em" /></p>
            <div className="desk-answer-actions"><button className="desk-text-control" type="button" aria-pressed={Boolean(bookmarks[selected.key])} onClick={() => onBookmark(selected.key)}><BookmarkSimple size={18} weight={bookmarks[selected.key] ? "fill" : "regular"} aria-hidden="true" />{bookmarks[selected.key] ? "Bookmarked for me" : "Bookmark for me"}</button><span>{selected.popularity.allTimeSaves} team saves</span></div>
          </section>
          <section className="desk-signals" aria-labelledby="desk-signals-title">
            <h3 id="desk-signals-title">Signals &amp; Sources</h3>
            {(selected.signals || []).map((signal, index) => <article className="desk-signal" key={`${selected.key}:${index}`}>
              <div className="desk-source-topline"><a className="desk-source-link" href={signal.url} target="_blank" rel="noopener noreferrer"><span>{signal.title}</span><ArrowUpRight size={16} aria-hidden="true" /></a>{signal.verdict === "Must read" && <span className="desk-source-verdict">Must read</span>}</div>
              <p className="desk-source-meta">{signal.source} · {sourceDomain(signal)} · {signal.kind} · {signal.timing}</p>
              {mobile ? <details className="desk-signal-disclosure"><summary>Read signal notes</summary><div className="desk-signal-notes"><div><h4>What happened</h4><p><HighlightedText text={signal.happened} /></p></div><div><h4>What changes</h4><p><HighlightedText text={signal.changes} /></p></div></div></details> : <div className="desk-signal-notes"><div><h4>What happened</h4><p><HighlightedText text={signal.happened} /></p></div><div><h4>What changes</h4><p><HighlightedText text={signal.changes} /></p></div></div>}
            </article>)}
          </section>
          <section className="desk-trail" aria-labelledby="desk-trail-title"><h3 id="desk-trail-title">Question trail</h3>{related.map((record) => <a key={record.key} href={hashFor(route, record)} onClick={(event) => openQuestion(event, record)}><span>{record.archiveReference}</span><span>{record.question}</span><ArrowRight size={16} aria-hidden="true" /></a>)}</section>
          {selectedIndex >= 0 && filtered.length > 1 && <nav className="desk-question-navigation" aria-label="Questions in current results">
            {filtered[selectedIndex - 1] ? <a href={hashFor(route, filtered[selectedIndex - 1])} onClick={(event) => openQuestion(event, filtered[selectedIndex - 1])}><ArrowLeft size={16} aria-hidden="true" />Previous question</a> : <span />}
            {filtered[selectedIndex + 1] && <a href={hashFor(route, filtered[selectedIndex + 1])} onClick={(event) => openQuestion(event, filtered[selectedIndex + 1])}>Next question<ArrowRight size={16} aria-hidden="true" /></a>}
          </nav>}
        </div> : <div className="desk-reader-empty"><p className="eyebrow">Question archive</p><h2 id="desk-reader-message">{reading ? ready ? "This question could not be found." : "Loading this question…" : "Choose a question to read."}</h2><p>{reading ? ready ? "Return to the results to explore another question." : "Fetching its edition and sources." : "Your results stay here while you read the answer and inspect its sources."}</p></div>}
      </section>);

  return (<>
    {withEditorialOpening && <div className="prototype-route prototype-archive desk-editorial-opening" hidden={narrow && reading && !mobile}><ArchiveEditorialOpening records={records} onExplore={explorePath} /></div>}
    <section ref={deskRef} id="prototype-archive-index" tabIndex={-1} className={`reading-desk ${reading ? "is-reading" : ""} ${withEditorialOpening ? "is-integrated" : ""}`} style={{ "--reading-header-height": `${headerHeight}px` }} aria-label="Question archive reading desk">
      <div className="desk-list" hidden={narrow && reading && !mobile}>
        <header className="desk-index-heading">
          <p className="eyebrow">Dense index</p><IndexHeading>Question index</IndexHeading>
          <p className="desk-index-intro">Find a question. Read the evidence.</p>
        </header>
        <div className="desk-filters">
          <label className="desk-search"><MagnifyingGlass size={19} aria-hidden="true" /><span className="visually-hidden">Search questions</span><input type="search" placeholder="Search questions, answers, or sources" value={route.query} onChange={(event) => changeFilters({ query: event.target.value })} /></label>
          <div className="desk-category-filters" role="group" aria-label="Category filter">
            {["All", ...categories].map((category) => <button type="button" key={category} aria-pressed={route.category === category} onClick={() => changeFilters({ category })}>{category}</button>)}
            <button type="button" aria-pressed={route.mustRead} onClick={() => changeFilters({ mustRead: !route.mustRead })}>Must read</button>
          </div>
          <div className="desk-selects">
            <label><span>Skill label</span><select value={route.skill} onChange={(event) => changeFilters({ skill: event.target.value })}><option>All skills</option>{SKILL_LABELS.map((label) => <option key={label.name}>{label.name}</option>)}</select></label>
            <label><span>Date</span><select value={route.date} onChange={(event) => changeFilters({ date: event.target.value })}><option value="any">Any date</option><option value="days:30">Past 30 days</option><option value="days:90">Past 90 days</option>{months.map((month) => <option key={month} value={`month:${month}`}>{new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00`))}</option>)}</select></label>
          </div>
          {activeFilters && <button className="desk-clear desk-text-control" type="button" onClick={() => changeFilters({ query: "", category: "All", mustRead: false, skill: "All skills", date: "any" })}>Clear filters <ArrowUpRight size={14} aria-hidden="true" /></button>}
        </div>
        <p className="visually-hidden" role="status">{ready ? `${filtered.length} matching questions` : "Loading previous editions…"}</p>
        <div ref={listRef} className="desk-results">
          {mobile && ready && reading && !selected && <div className="desk-empty" role="status"><h2>This question could not be found.</h2><p>Choose another question from the results.</p><button className="desk-text-control" type="button" onClick={closeReader}>Back to results</button></div>}
          {visibleRecords.map((record) => <article className={`desk-result ${record.key === selectedKey ? "is-selected" : ""}`} key={record.key}>
            <div className="desk-result-id"><span>{record.archiveReference}</span><small>{record.category}</small>{record.aiLens && <AiLensBadge />}</div>
            <div className="desk-result-copy">
              <h2>{mobile ? <button className="desk-question-toggle" type="button" aria-expanded={record.key === selectedKey} aria-controls={`inline-${record.key}`} onClick={(event) => openQuestion(event, record, true)}><span>{record.question}</span><span aria-hidden="true">{record.key === selectedKey ? "−" : "+"}</span></button> : <a href={hashFor(route, record)} aria-current={record.key === selectedKey ? "true" : undefined} onClick={(event) => openQuestion(event, record, true)}><span>{record.question}</span><ArrowRight size={16} aria-hidden="true" /></a>}</h2>
              <p>{record.editionLabel} · {record.dateLabel}</p>
              <div className="desk-result-meta"><span>{record.signals?.length || 0} {record.signals?.length === 1 ? "source" : "sources"} · {record.popularity.allTimeSaves} team saves</span><button type="button" aria-label={`${bookmarks[record.key] ? "Remove bookmark for" : "Bookmark"} ${record.archiveReference}`} aria-pressed={Boolean(bookmarks[record.key])} onClick={() => onBookmark(record.key)}><BookmarkSimple size={18} weight={bookmarks[record.key] ? "fill" : "regular"} aria-hidden="true" /></button></div>
              {record.popularity.recent30DaySaves >= RECENT_POPULARITY.minimumSaves && <small className="desk-recent">Popular recently · {record.popularity.recent30DaySaves} in 30 days</small>}
            </div>
            {mobile && <div className="desk-inline-reader" id={`inline-${record.key}`} hidden={record.key !== selectedKey}>{record.key === selectedKey && reader}</div>}
          </article>)}
          {!mobile && hasOlder && <div ref={loadMoreRef} className="desk-load-more"><button type="button" className="desk-text-control" onClick={() => setOlderCount((count) => Math.max(count, visibleCount - initialVisibleCount) + OLDER_QUESTION_BATCH)}>Load older questions <ArrowRight size={16} aria-hidden="true" /></button></div>}
          {mobile && filtered.length > 0 && <nav className="desk-pagination" aria-label="Question pages"><p role="status">{mobilePage.start + 1} to {mobilePage.end} of {filtered.length} questions</p><div><button className="desk-text-control" type="button" disabled={mobilePage.page === 1} onClick={() => changePage(mobilePage.page - 1)}><ArrowLeft size={16} aria-hidden="true" />Previous</button><span>Page {mobilePage.page} of {mobilePage.pages}</span><button className="desk-text-control" type="button" disabled={mobilePage.page === mobilePage.pages} onClick={() => changePage(mobilePage.page + 1)}>Next<ArrowRight size={16} aria-hidden="true" /></button></div></nav>}
          {ready && !filtered.length && <div className="desk-empty"><h2>No questions match these filters.</h2><p>Try a broader search or clear the filters.</p><button className="desk-text-control" type="button" onClick={() => changeFilters({ query: "", category: "All", mustRead: false, skill: "All skills", date: "any" })}>Show all questions <ArrowRight size={16} aria-hidden="true" /></button></div>}
        </div>
      </div>
      {!mobile && reader}
    </section>
  </>);
}
