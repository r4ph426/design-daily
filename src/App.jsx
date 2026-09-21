import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookmarkSimple,
  CaretDown,
  Check,
  Clock,
  LinkSimple,
  MagnifyingGlass,
  X,
} from "@phosphor-icons/react";
import { CATEGORIES, validateEditionTaxonomy } from "./taxonomy.js";
import { canonicalArticleUrl, crawlPossessive } from "../shared/article-intake.mjs";
import {
  articleSubmissionEndpointConfigured,
  getSubmissionClientId,
  submitArticle,
} from "./article-submission.js";

const fallbackEditionNumber = "0197";
const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";

const fallbackQuestions = [
  {
    id: "01",
    slug: "who-designs-the-system",
    category: "Process",
    tags: ["UI"],
    aiLens: true,
    question: "Who designs the system that designs with us?",
    answer: <>Teams are moving from prompt craft to <em>explicit review systems</em> that make judgment visible and reusable.</>,
    why: "Designers now shape the rules around generation, review, and escalation. That turns critique, governance, and authorship into parts of the product experience.",
    counts: { total: 24, web: 15, newsletters: 9 },
    firstSeen: "05:58 cet",
    signals: [
      {
        source: "Figma Blog",
        title: "Designing model behavior into product systems",
        kind: "web",
        timing: "8 sep, 16:10 · crawled 06:04",
        happened: "Product teams are documenting model behavior and review thresholds next to interface decisions.",
        changes: "Add decision checkpoints to the design system before automating more production work.",
        verdict: "must read",
      },
      {
        source: "ux Collective",
        title: "Why generated interfaces converge",
        kind: "web",
        timing: "8 sep, 18:40 · crawled 06:09",
        happened: "A cross-team study found that generated output converges when feedback is not captured as a shared artifact.",
        changes: "Turn critique into reusable criteria instead of leaving it inside individual prompts.",
        verdict: "background",
      },
      {
        source: "Sidebar",
        title: "Who owns the final AI-assisted decision?",
        kind: "newsletter",
        timing: "9 sep, 05:31 · crawled 06:18 · seen again",
        happened: "Design leads are pairing model access with explicit ownership of final decisions.",
        changes: "Name a human decision owner for every machine-assisted workflow.",
        verdict: "background",
      },
    ],
    further: [
      ["A field guide to design decisions", "Dense Discovery · newsletter"],
      ["Interfaces for visible uncertainty", "A List Apart · web"],
    ],
  },
  {
    id: "02",
    slug: "what-becomes-valuable",
    category: "Process",
    tags: ["UX"],
    aiLens: true,
    question: "What becomes valuable when making gets cheaper?",
    answer: <>The scarce work shifts to framing, taste, and knowing <em>when to stop</em> generating.</>,
    why: "When teams can produce dozens of plausible options, speed stops being a differentiator. The advantage moves to clear constraints and confident selection.",
    counts: { total: 28, web: 17, newsletters: 11 },
    firstSeen: "06:03 cet",
    signals: [
      {
        source: "Design Better",
        title: "What changes when exploration becomes abundant",
        kind: "newsletter",
        timing: "8 sep, 20:20 · crawled 06:07",
        happened: "Teams report that exploration is faster, while alignment and selection now consume more of the schedule.",
        changes: "Budget critique time before adding another generation tool.",
        verdict: "must read",
      },
      {
        source: "Co.Design",
        title: "Why studios publish fewer directions",
        kind: "web",
        timing: "8 sep, 17:35 · crawled 06:14",
        happened: "Studios are publishing fewer directions despite producing more internal options.",
        changes: "Measure decision quality and reversibility, not the volume of output.",
        verdict: "background",
      },
    ],
    further: [["Taste is turning into team infrastructure", "The Design Review · newsletter"]],
  },
  {
    id: "03",
    slug: "research-at-machine-speed",
    category: "Culture",
    tags: ["UX"],
    aiLens: true,
    question: "Can research stay human at machine speed?",
    answer: <>Synthetic participants can widen exploration, but lived context remains the source of <em>consequence</em>.</>,
    why: "Speed is useful for finding hypotheses, not for replacing the people affected by a decision. Teams need a visible boundary between simulation and evidence.",
    counts: { total: 18, web: 10, newsletters: 8 },
    firstSeen: "06:11 cet",
    signals: [
      {
        source: "hbr.org",
        title: "Synthetic interviews as research rehearsal",
        kind: "web",
        timing: "8 sep, 15:05 · crawled 06:13",
        happened: "Research teams are using synthetic interviews to pressure-test scripts before meeting real participants.",
        changes: "Use simulation to improve the plan, then validate consequences with people.",
        verdict: "must read",
      },
      {
        source: "Deliberate",
        title: "What synthetic participants leave out",
        kind: "newsletter",
        timing: "9 sep, 05:44 · crawled 06:21",
        happened: "Practitioners found that simulated participants flatten organizational and cultural context.",
        changes: "Label synthetic findings as hypotheses in every research readout.",
        verdict: "background",
      },
    ],
    further: [["Research repositories after abundance", "Noahpinion · newsletter"]],
  },
  {
    id: "04",
    slug: "design-culture-change",
    category: "Culture",
    tags: [],
    aiLens: true,
    question: "How should design culture change?",
    answer: <>Teams are rewriting norms around credit, craft, and critique for an <em>AI-augmented era</em>.</>,
    why: "The strongest teams are making authorship and review visible. Shared standards protect individual judgment while letting new tools accelerate the work.",
    counts: { total: 16, web: 9, newsletters: 7 },
    firstSeen: "06:17 cet",
    signals: [
      {
        source: "The Design Review",
        title: "New rules for authorship in AI-assisted studios",
        kind: "newsletter",
        timing: "9 sep, 05:52 · crawled 06:17",
        happened: "Studios are documenting how credit, critique, and accountability work in machine-assisted projects.",
        changes: "Write authorship and review norms before the next AI-supported project begins.",
        verdict: "must read",
      },
      {
        source: "It’s Nice That",
        title: "Why critique needs protected time",
        kind: "web",
        timing: "8 sep, 19:12 · crawled 06:22",
        happened: "Creative teams are protecting time for discussion as production cycles become shorter.",
        changes: "Treat critique as core infrastructure rather than a final approval step.",
        verdict: "background",
      },
    ],
    further: [["Authorship after automation", "Deliberate · newsletter"]],
  },
];

const fallbackEdition = {
  editionNumber: fallbackEditionNumber,
  date: "2026-09-10",
  displayDate: "Thursday, 10 September 2026",
  filedAt: "08:32 cet",
  crawlCompletedAt: "06:30",
  sourceCount: 128,
  webSourceCount: 4,
  teamContributionCount: 2,
  inboxConnected: false,
  summary: "AI can accelerate production, but design quality still depends on clear judgment. Today’s edition examines where automation supports designers and where it hides weak decisions. The useful question is not how much a team can generate, but what deserves to survive review.",
  questions: fallbackQuestions,
};

validateEditionTaxonomy(fallbackEdition);

function countWord(count) {
  return ["Zero", "One", "Two", "Three", "Four"][count] || String(count);
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function sourceKindLabel(kind) {
  return String(kind || "Web").toLowerCase() === "newsletter" ? "Newsletter" : "Web";
}

function formatMetadata(value) {
  return String(value || "").replace(/\bcet\b/gi, "CET").replace(/\bsep\b/gi, "Sep").replace(/\bcrawled\b/gi, "Crawled").replace(/\bseen again\b/gi, "Seen again");
}

function formatCrawlDay(value, now = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return value;
  const [, year, month, day] = match;
  const editionDay = Date.UTC(Number(year), Number(month) - 1, Number(day));
  const currentDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const daysAgo = Math.round((currentDay - editionDay) / 86_400_000);
  if (daysAgo === 0) return "today";
  if (daysAgo === 1) return "yesterday";
  return `${day},${month},${year}`;
}

function HighlightedText({ text }) {
  return String(text || "").split(/(\*\*[^*]+\*\*)/g).map((part, index) => part.startsWith("**") && part.endsWith("**")
    ? <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>
    : part);
}

function Brand() {
  return (
    <a className="brand" href="#top" aria-label="design / daily home">
      <span>design / daily</span>
      <small>by ra.re design</small>
    </a>
  );
}

function SignalsTable({ question }) {
  return (
    <div className="signals-table-wrap">
      <table className="signals-table">
        <caption>Signals for {question.question}</caption>
        <thead><tr><th>Source</th><th>What happened</th><th>What changes</th><th>Verdict</th></tr></thead>
        <tbody>
          {question.signals.map((signal) => (
            <tr key={`${question.id}-${signal.source}`}>
              <td data-label="Source">
                {signal.url ? <a className="source-article-title" href={signal.url} target="_blank" rel="noopener noreferrer">{signal.title || signal.happened}</a> : <span className="source-article-title">{signal.title || signal.happened}</span>}
                <span className="source-publisher">{signal.source}</span>
                <span className="provenance">{sourceKindLabel(signal.kind)} · {formatMetadata(signal.timing)}</span>
              </td>
              <td data-label="What happened"><HighlightedText text={signal.happened} /></td>
              <td data-label="What changes"><HighlightedText text={signal.changes} /></td>
              <td data-label="Verdict"><span className={`verdict ${signal.verdict.toLowerCase().replaceAll(" ", "-")}`}>{signal.verdict}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="further-reads">
        <p className="meta-label">Further reads</p>
        {question.further.map(([title, source, url]) => (
          <a href={url || "#top"} target={url ? "_blank" : undefined} rel={url ? "noopener noreferrer" : undefined} key={title}><span>{title}</span><small>{formatMetadata(source).replace(/\bnewsletter\b/gi, "Newsletter").replace(/\bweb\b/gi, "Web")}</small><ArrowRight size={16} /></a>
        ))}
      </div>
    </div>
  );
}

function sourceDomain(signal) {
  try { return new URL(signal.url).hostname.replace(/^www\./, ""); }
  catch { return signal.source; }
}

function SourceList({ question }) {
  return (
    <ol className="source-list" aria-label={`Sources for ${question.question}`}>
      {question.signals.map((signal, index) => (
        <li key={`${question.id}-${signal.url || signal.source}-${index}`}>
          <a href={signal.url || "#top"} target={signal.url ? "_blank" : undefined} rel={signal.url ? "noopener noreferrer" : undefined}>
            <span className="source-list-title">{signal.title || signal.happened}</span>
            <span className="source-list-meta">{sourceDomain(signal)} · {sourceKindLabel(signal.kind)} · {formatMetadata(signal.timing)}</span>
            {signal.url && <span className="source-list-external" aria-hidden="true">↗</span>}
          </a>
        </li>
      ))}
    </ol>
  );
}

function QuestionBlock({ question, isOpen, isSaved, onToggle, onSave }) {
  return (
    <article className={`question-block ${isOpen ? "open" : ""}`} id={question.slug}>
      <div className="question-number">
        <span>{question.id}</span>
        <small className="category-list">{[question.category, ...question.tags.filter((tag) => tag !== question.category)].join(" · ")}</small>
        {question.aiLens && <small className="ai-lens"><i aria-hidden="true" />AI lens</small>}
      </div>
      <div className="question-copy" onClick={(event) => {
        if (event.target.closest("button, a, input")) return;
        onToggle();
      }}>
        <h2><button type="button" onClick={onToggle}>{question.question}</button></h2>
        <p className="answer-label">Why it matters</p>
        <p className="answer-line">{question.answer}</p>
        <div className="question-actions">
          <button className="disclosure-button" type="button" aria-expanded={isOpen} aria-controls={`${question.slug}-details`} onClick={onToggle}><CaretDown size={16} /> Signals &amp; Sources <span>{question.counts.total}</span></button>
        </div>
      </div>
      <aside className="question-provenance">
        <div className="provenance-head"><span>{pluralize(question.counts.total, "Source")}</span><span>{pluralize(question.counts.web, "Web source")} · {pluralize(question.counts.newsletters, "Newsletter")}</span><span>First seen {formatMetadata(question.firstSeen || "Today")}</span></div>
        <SourceList question={question} />
        <button className={`save-button ${isSaved ? "saved" : ""}`} type="button" aria-pressed={isSaved} onClick={onSave}><span>{isSaved ? "Bookmarked for me" : "Bookmark question for me"}</span><BookmarkSimple size={17} weight={isSaved ? "fill" : "regular"} /></button>
      </aside>
      <div className="question-details" id={`${question.slug}-details`} hidden={!isOpen}>
        <SignalsTable question={question} />
      </div>
    </article>
  );
}

function TurnstileChallenge({ onToken, onError, resetSignal }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    if (!turnstileSiteKey) return undefined;
    let active = true;

    const render = () => {
      if (!active || !containerRef.current || widgetIdRef.current !== null || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: turnstileSiteKey,
        appearance: "interaction-only",
        theme: "dark",
        callback: onToken,
        "expired-callback": () => onToken(""),
        "error-callback": onError,
      });
    };

    const existing = document.querySelector('script[data-design-daily-turnstile="true"]');
    if (existing) {
      if (window.turnstile) render();
      else existing.addEventListener("load", render, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.designDailyTurnstile = "true";
      script.addEventListener("load", render, { once: true });
      script.addEventListener("error", onError, { once: true });
      document.head.appendChild(script);
    }

    return () => {
      active = false;
      if (widgetIdRef.current !== null && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, [onError, onToken]);

  useEffect(() => {
    if (resetSignal && widgetIdRef.current !== null && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [resetSignal]);

  if (!turnstileSiteKey) return null;
  return <div className="turnstile-slot" ref={containerRef} aria-label="Spam protection" />;
}

function submissionDisplayUrl(value = "") {
  try {
    const parsed = new URL(value);
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    return `${parsed.hostname.replace(/^www\./, "")}${path}`;
  } catch {
    return value;
  }
}

function ArticleConfirmation({ request, onReset }) {
  const isAccepted = request.status === "accepted";
  const isQueued = request.status === "duplicate_queued";
  let eyebrow = "article received";
  let title = `Added to ${crawlPossessive(request.crawl)} crawl`;
  let description = "We’ll consider this link with the next source set. Not every shared link appears in the edition.";

  if (isQueued) {
    eyebrow = "already in the queue";
    title = `Already added to ${crawlPossessive(request.crawl)} crawl`;
    description = "This link is already waiting with the next source set. You don’t need to submit it again.";
  }
  if (request.status === "duplicate_history") {
    eyebrow = "already crawled";
    title = `Already crawled on ${request.previousCrawlDate || "an earlier date"}`;
    description = "We’ve seen this article before. A future archive update will point back to the earlier edition.";
  }

  return (
    <div className={`article-confirmation ${request.status}`}>
      <div className="confirmation-mark" aria-hidden="true"><Check size={19} weight="bold" /></div>
      <div className="confirmation-copy" role="status" aria-live="polite">
        <p className="confirmation-eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
        {request.crawl?.displayDate && <p className="confirmation-date">{request.crawl.displayDate} · {request.crawl.scheduledTime} Berlin</p>}
        <p className="confirmation-url" title={request.url}>{submissionDisplayUrl(request.url)}</p>
        <p className="confirmation-note">{description}</p>
      </div>
      <button type="button" onClick={onReset}>{isAccepted ? "share another article" : "try another article"}<ArrowRight size={14} /></button>
    </div>
  );
}

function ArticleIntake() {
  const [url, setUrl] = useState("");
  const [request, setRequest] = useState({ status: "default" });
  const [website, setWebsite] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const inputRef = useRef(null);
  const configured = articleSubmissionEndpointConfigured();
  const isWorking = request.status === "checking";
  const isConfirmation = ["accepted", "duplicate_queued", "duplicate_history"].includes(request.status);
  const handleTurnstileError = useCallback(() => {
    setRequest({ status: "error", message: "Spam protection couldn’t load. Refresh and try again." });
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    const requestedUrl = canonicalArticleUrl(url);
    if (!requestedUrl) {
      setRequest({ status: "error", message: "Paste a valid public article URL." });
      return;
    }
    if (!configured) {
      setRequest({ status: "error", message: "Article submission is temporarily unavailable." });
      return;
    }
    if (turnstileSiteKey && !turnstileToken) {
      setRequest({ status: "error", message: "Spam protection is still checking this browser. Try again in a moment." });
      return;
    }

    setRequest({ status: "checking" });
    try {
      const result = await submitArticle({
        url: requestedUrl,
        clientId: getSubmissionClientId(),
        turnstileToken,
        website,
      });
      if (["accepted", "duplicate_queued", "duplicate_history"].includes(result.status)) {
        setRequest(result);
      } else if (result.status === "rate_limited") {
        const hours = Math.ceil((result.retryAfterMinutes || 60) / 60);
        setRequest({ status: "limited", message: `You’ve reached the sharing limit. Try again in about ${hours} ${hours === 1 ? "hour" : "hours"}.` });
      } else {
        setRequest({ status: "error", message: result.message || "We couldn’t add this link. Nothing was submitted." });
      }
    } catch (error) {
      setRequest({ status: "error", message: error.message || "We couldn’t add this link. Nothing was submitted." });
    } finally {
      setTurnstileToken("");
      setTurnstileReset((value) => value + 1);
    }
  };

  const addAnother = () => {
    setUrl("");
    setWebsite("");
    setRequest({ status: "default" });
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <aside className="article-panel" id="article-intake">
      <div className="article-heading"><LinkSimple size={22} /><div><p className="meta-label">article intake</p><h2>Share an article</h2></div></div>
      <p>Paste a useful article. We’ll add it anonymously to the next weekday crawl.</p>
      {isConfirmation ? (
        <ArticleConfirmation request={request} onReset={addAnother} />
      ) : (
        <form className={`article-form ${request.status}`} onSubmit={submit}>
          <label htmlFor="article-url">Article URL</label>
          <div className="article-control">
            <input ref={inputRef} id="article-url" type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck="false" placeholder="www.example.com/article" value={url} aria-describedby="article-help article-message" onChange={(event) => { setUrl(event.target.value); if (["error", "limited"].includes(request.status)) setRequest({ status: "default" }); }} disabled={isWorking} required />
            <button type="submit" disabled={!url.trim() || isWorking || !configured || (turnstileSiteKey && !turnstileToken)}>{isWorking ? "Checking" : turnstileSiteKey && !turnstileToken ? "Verifying" : "Add to crawl"}</button>
          </div>
          {isWorking && <span className="loading-bar" aria-hidden="true" />}
          <span id="article-help" className="article-help">https:// optional · no account needed · up to 5 links per hour</span>
          {["error", "limited"].includes(request.status) && <span id="article-message" className="article-error" role="alert">{request.message}</span>}
          <label className="submission-honeypot" aria-hidden="true">Leave this field empty<input type="text" name="website" tabIndex="-1" autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
          <TurnstileChallenge onToken={setTurnstileToken} onError={handleTurnstileError} resetSignal={turnstileReset} />
        </form>
      )}
    </aside>
  );
}

function Archive({ initialFilter, onClose, archiveDays }) {
  const [filter, setFilter] = useState(initialFilter || "All questions");
  const [oldestFirst, setOldestFirst] = useState(false);
  const days = oldestFirst ? [...archiveDays].reverse() : archiveDays;
  const questionCount = archiveDays.reduce((total, day) => total + day.questions.length, 0);

  useEffect(() => {
    const previous = document.body.style.overflow;
    const onKeyDown = (event) => event.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKeyDown); };
  }, [onClose]);

  return (
    <div className="archive-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="archive" role="dialog" aria-modal="true" aria-labelledby="archive-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="archive-head">
          <div><p className="meta-label">UI · UX · Process · Culture</p><h2 id="archive-title">The question index</h2><p>{pluralize(questionCount, "Question")} · {pluralize(archiveDays.length, "Edition")}</p></div>
          <button className="close-button" type="button" aria-label="Close the question index" onClick={onClose} autoFocus><X size={24} /></button>
        </header>
        <div className="archive-controls">
          <div className="archive-filters" role="group" aria-label="Filter the question index">{["All questions", ...CATEGORIES].map((item) => <button type="button" className={filter === item ? "selected" : ""} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div>
          <button className="sort-button" type="button" onClick={() => setOldestFirst((value) => !value)}>{oldestFirst ? "Oldest first" : "Newest first"}</button>
        </div>
        <div className="archive-scroll">
          {days.map((day) => {
            const entries = day.questions.filter((question) => filter === "All questions" || question.category === filter);
            if (!entries.length) return null;
            return (
              <section className="archive-day" key={day.edition}>
                <header><h3>{day.date}</h3><span>{day.edition}</span></header>
                {entries.map((question) => (
                  <a className="archive-entry" href={`#${question.slug || "signals"}`} onClick={onClose} key={`${day.edition}-${question.question}`}>
                    <span className="entry-category">{question.category}</span>
                    <div><h4>{question.question}</h4><p>{question.answer}</p>{question.returned && <span className="returned">{question.returned}</span>}</div>
                    <span className="entry-source-count">{pluralize(question.counts.total, "Source")}</span><ArrowRight size={20} />
                  </a>
                ))}
              </section>
            );
          })}
          <button className="earlier-button" type="button">Earlier editions <ArrowRight size={18} /></button>
        </div>
      </section>
    </div>
  );
}

export function App() {
  const [edition, setEdition] = useState(fallbackEdition);
  const [archiveHistory, setArchiveHistory] = useState([]);
  const [openQuestions, setOpenQuestions] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`design-daily-${fallbackEditionNumber}`)) || {}; }
    catch { return {}; }
  });
  const [savedQuestions, setSavedQuestions] = useState({});
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveFilter, setArchiveFilter] = useState("All questions");
  const [searchOpen, setSearchOpen] = useState(false);
  const questions = edition.questions?.length ? edition.questions : fallbackQuestions;
  const editionNumber = edition.editionNumber || fallbackEditionNumber;
  const archiveDays = useMemo(() => [
    { date: edition.displayDate?.replace(/ \d{4}$/, "") || "Today", edition: `Edition ${editionNumber} · Today`, questions },
    ...archiveHistory.map((archived) => ({
      date: archived.displayDate?.replace(/ \d{4}$/, "") || archived.date,
      edition: `Edition ${archived.editionNumber}`,
      questions: archived.questions,
    })),
  ], [archiveHistory, edition.displayDate, editionNumber, questions]);
  const issueTitle = useMemo(() => `${countWord(questions.length)} questions shaping design today`, [questions.length]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}data/latest.json`, { cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error(`edition ${response.status}`)))
      .then((payload) => {
        if (payload?.questions?.length) {
          setEdition(validateEditionTaxonomy(payload));
          try { setOpenQuestions(JSON.parse(localStorage.getItem(`design-daily-${payload.editionNumber}`)) || {}); }
          catch { setOpenQuestions({}); }
        }
      })
      .catch((error) => { if (error.name !== "AbortError") console.warn("Using the bundled fallback edition.", error); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}data/archive/index.json`, { cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : [])
      .then((entries) => Promise.all(entries
        .filter((entry) => entry.date && entry.date !== edition.date)
        .slice(0, 30)
        .map((entry) => fetch(`${import.meta.env.BASE_URL}data/archive/${entry.date}.json`, { cache: "no-store", signal: controller.signal })
          .then((response) => response.ok ? response.json() : null))))
      .then((editions) => editions.map((item) => item ? validateEditionTaxonomy(item) : item))
      .then((editions) => setArchiveHistory(editions.filter((item) => item?.questions?.length)))
      .catch((error) => { if (error.name !== "AbortError") console.warn("Archive index unavailable.", error); });
    return () => controller.abort();
  }, [edition.date]);
  useEffect(() => { localStorage.setItem(`design-daily-${editionNumber}`, JSON.stringify(openQuestions)); }, [editionNumber, openQuestions]);
  useEffect(() => {
    const slug = window.location.hash.replace("#", "");
    const question = questions.find((item) => item.slug === slug);
    if (question) setOpenQuestions((state) => ({ ...state, [question.id]: true }));
  }, [questions]);

  const openArchive = (filter = "All questions") => { setArchiveFilter(filter); setArchiveOpen(true); };

  return (
    <main className="site-shell" id="top">
      <a className="skip-link" href={`#${questions[0].slug}`}>Skip to the first question</a>
      <header className={`topbar ${searchOpen ? "search-open" : ""}`}>
        <Brand />
        <div className="edition-meta"><span>{edition.displayDate}</span><span>Edition {editionNumber}</span><span>Filed {formatMetadata(edition.filedAt)}</span></div>
        <nav className="nav-links" aria-label="Primary">
          {CATEGORIES.map((item) => <button type="button" onClick={() => openArchive(item)} key={item}>{item}</button>)}
          <button type="button" className="question-index-nav" onClick={() => openArchive()}>Question index</button>
        </nav>
        <div className="top-actions">
          <button type="button" className="icon-button" aria-label={searchOpen ? "Close search" : "Search"} onClick={() => setSearchOpen((value) => !value)}>{searchOpen ? <X size={20} /> : <MagnifyingGlass size={20} />}</button>
        </div>
        {searchOpen && <div className="search-field"><input autoFocus aria-label="Search the question index" placeholder="Search questions" onKeyDown={(event) => event.key === "Escape" && setSearchOpen(false)} /></div>}
      </header>
      <section className="edition-hero" aria-labelledby="edition-title">
        <div className="edition-intro">
          <h1 id="edition-title">{issueTitle}</h1>
          <p className="editor-note">{edition.summary}</p>
          <div className="crawl-line">
            <span><Clock size={16} /> Last crawl {formatCrawlDay(edition.date)} · {edition.crawlCompletedAt}</span>
            <div className="crawl-breakdown">
              <span>Total sources: {edition.sourceCount}</span>
              <span>Web sources: {edition.webSourceCount ?? 0}</span>
              <span>Contributed links through team: {edition.teamContributionCount ?? 0}</span>
            </div>
          </div>
        </div>
        <ArticleIntake />
      </section>
      <section className="questions" aria-label="Today’s questions">
        {questions.map((question) => <QuestionBlock key={question.id} question={question} isOpen={Boolean(openQuestions[question.id])} isSaved={Boolean(savedQuestions[question.id])} onToggle={() => setOpenQuestions((state) => ({ ...state, [question.id]: !state[question.id] }))} onSave={() => setSavedQuestions((state) => ({ ...state, [question.id]: !state[question.id] }))} />)}
      </section>
      <footer className="footer-grid"><Brand /><p>AI-generated. Human-edited.</p><span className="footer-edition">Edition {editionNumber}</span><a href={`${import.meta.env.BASE_URL}privacy.html`}>Privacy <ArrowRight size={14} /></a><p>Synthesis, not noise.</p></footer>
      {archiveOpen && <Archive initialFilter={archiveFilter} archiveDays={archiveDays} onClose={() => setArchiveOpen(false)} />}
    </main>
  );
}
