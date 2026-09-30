import React from "react";
import { createRoot } from "react-dom/client";
import "./grid-prototype.css";

const questions = [
  {
    title: "How do we choose beyond the first prototype?",
    editorialTitle: <>A prototype is a beginning, <em>not a decision.</em></>,
    why: "Figma argues that AI makes a clickable first version fast. Teams still need to compare directions, test edge cases, sustain momentum through launch and shape a product with a point of view.",
    checklist: ["Compare directions", "Test edge cases", "Keep your point of view"],
    sourceTitle: "What it takes to build great products now",
    source: "Figma",
    date: "24 Sep",
    fullDate: "24 September 2026",
    category: "Process",
    aiLens: true,
    url: "https://www.figma.com/blog/what-it-takes-to-build-great-products-now/",
  },
  {
    title: "What does vertical wrap change for UI?",
    editorialTitle: <>A column becomes <em>a flow.</em></>,
    why: "Figma's vertical auto layout now wraps content into new columns as it changes. The useful question is whether those columns still read in the right order when copy grows, items disappear or the available width narrows.",
    checklist: ["Vary content length", "Inspect reading order", "Check narrow states"],
    sourceTitle: "Vertical wrap available in auto layout",
    source: "Figma",
    date: "25 Sep",
    fullDate: "25 September 2026",
    category: "UI",
    url: "https://forum.figma.com/product-updates-3/vertical-wrap-available-in-auto-layout-58389",
  },
  {
    title: "Who shapes the next creative generation?",
    editorialTitle: <>The next generation is <em>already here.</em></>,
    why: "It's Nice That selected 72 emerging creatives from 16 countries for its 2026 Ones to Watch. The range offers a useful place to discover new practices, while the selection itself remains one publication's editorial view.",
    checklist: ["Explore new voices", "Notice the selection", "Share the spotlight"],
    sourceTitle: "The next generation of creative talent",
    source: "It's Nice That",
    date: "29 Sep",
    fullDate: "29 September 2026",
    category: "Culture",
    url: "https://www.itsnicethat.com/features/ones-to-watch-talent-showcase-launch-2026-290926",
  },
  {
    title: "What conditions make creative work possible?",
    editorialTitle: <>Creative freedom needs <em>structure.</em></>,
    why: "Graphic designer Andrew Bell describes how clearer briefs, variety and autonomy helped him work well, while overcommitting eventually led to burnout. His account asks teams to consider the conditions around creative work, not only the output.",
    checklist: ["Clarify the brief", "Protect boundaries", "Offer mentorship"],
    sourceTitle: "What freelance life taught me about my ADHD, burnout and what I need to make great work",
    source: "It's Nice That",
    date: "28 Sep",
    fullDate: "28 September 2026",
    category: "Process",
    url: "https://www.itsnicethat.com/articles/pov-freelance-life-adhd-burnout-and-learning-to-work-with-my-brain-creative-industry-280926",
  },
];

function GridPrototype() {
  return (
    <main
      className="grid-prototype"
      aria-label="Design / Daily inset grid prototype"
    >
      <div className="grid-content">
        <header className="prototype-masthead">
          <a className="wordmark" href="#today" aria-label="Design / Daily home">
            <span>design <i>/</i> daily</span>
            <small>by ra.re design</small>
          </a>
          <span className="edition-meta">Editorial preview <i>·</i> Wed, 30 Sep 2026</span>
        </header>

        <section className="opening" id="today" aria-label="Today's editorial preview">
          <div className="opening-copy content-panel">
            <p className="eyebrow">Today <span>·</span> 4 questions worth asking</p>
            <h1>The hard part is <em>choosing.</em></h1>
          </div>
          <p className="opening-summary content-panel">
            Prototypes appear in hours. Good products still need tested directions, responsive details, distinct voices and room for different ways of working.
          </p>
          <aside className="question-index content-panel" aria-label="Questions from today's public-source preview">
            <p className="section-kicker">The questions</p>
            <ol>
              {questions.map((question, index) => (
                <li key={question.title}>
                  <span className="question-number">Q{index + 1}</span>
                  <span className="question-entry">
                    <a href={question.url} target="_blank" rel="noreferrer">{question.title}<span aria-hidden="true">&nbsp;↗</span></a>
                    <small>{question.source} <i>·</i> {question.date} <i>·</i> {question.category}</small>
                  </span>
                </li>
              ))}
            </ol>
            <p className="index-note">A public-source preview for today's grid study</p>
          </aside>
        </section>

        {questions.map((question, index) => (
          <section className={`editorial-spread spread-${index + 1}`} aria-labelledby={`signal-title-${index + 1}`} key={question.title}>
            <div className="editorial-heading content-panel">
              <p className="eyebrow">Question {String(index + 1).padStart(2, "0")} <span>·</span> {question.category}{question.aiLens && <span className="ai-lens" aria-label="AI lens"><svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><rect x="3" y="5" width="10" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4"/><path d="M8 2v3M6 9h.01M10 9h.01M5 13v1M11 13v1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>AI</span>}</p>
              <h2 id={`signal-title-${index + 1}`}>{question.editorialTitle}</h2>
            </div>
            <div className="editorial-note content-panel">
              <p className="section-kicker">Why it matters</p>
              <p>{question.why}</p>
            </div>
            <div className="practice-panel content-panel" aria-label={`Considerations for question ${index + 1}`}>
              <p className="section-kicker">What to consider</p>
              <ul>
                {question.checklist.map((item, itemIndex) => <li key={item}><span>{String(itemIndex + 1).padStart(2, "0")}</span> {item}</li>)}
              </ul>
            </div>
            <div className="source-panel content-panel">
              <p className="section-kicker">Source</p>
              <p className="source-title">{question.sourceTitle}</p>
              <p className="source-meta">{question.source} <i>·</i> {question.category} <i>·</i> {question.fullDate}</p>
              <a href={question.url} target="_blank" rel="noreferrer">Read the source <span>↗</span></a>
            </div>
          </section>
        ))}

        <footer className="prototype-footer">
          <span>AI-generated. Human-edited.</span>
          <span>Synthesis, not noise.</span>
        </footer>
      </div>
    </main>
  );
}

createRoot(document.getElementById("grid-prototype-root")).render(<GridPrototype />);
