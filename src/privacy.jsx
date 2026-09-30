import { useState } from "react";
import { ArrowRight } from "@phosphor-icons/react";

const sections = [
  ["reading", "Reading & saving"],
  ["contributing", "Contributing links"],
  ["sources", "Sources & synthesis"],
  ["services", "Services & retention"],
  ["control", "Your control"],
];

const localDataKeys = [
  "design-daily-question-bookmarks-v1",
  "design-daily-tool-bookmarks-v1",
  "design-daily:submission-client",
  "design-daily:mock-submissions",
];

function clearLocalData() {
  for (const key of localDataKeys) window.localStorage.removeItem(key);
  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (/^design-daily-\d{3,}$/.test(key)) window.localStorage.removeItem(key);
  }
}

function scrollToSection(id) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
}

export function PrivacyPage() {
  const [cleared, setCleared] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="privacy-page">
      <section className="privacy-hero page-opening" aria-labelledby="privacy-title">
        <div className="page-opening-main">
          <h1 id="privacy-title">Privacy</h1>
          <p className="page-opening-summary">A clear account of the data behind a shared daily read, from your own saved items to the sources behind each edition.</p>
        </div>
        <aside className="privacy-hero-aside page-opening-aside" aria-label="Privacy at a glance">
          <p className="meta-label">At a glance</p>
          <p><strong>Read without an account.</strong> Your bookmarks and reading state stay in this browser.</p>
          <p><strong>Shared links are public.</strong> A submitted URL becomes a GitHub issue for the next crawl.</p>
          <p><strong>Newsletters stay server-side.</strong> Published editions contain editorial synthesis and source references, not raw inbox messages.</p>
          <span className="privacy-updated">Updated 30 September 2026</span>
        </aside>
      </section>

      <div className="privacy-body">
        <nav className="privacy-index" aria-label="On this page">
          <p className="meta-label">On this page</p>
          {sections.map(([id, title], index) => (
            <button key={id} type="button" onClick={() => scrollToSection(id)}><span>{String(index + 1).padStart(2, "0")}</span>{title}<ArrowRight size={14} aria-hidden="true" /></button>
          ))}
        </nav>

        <div className="privacy-articles" id="privacy-content">
          <section className="privacy-section" id="reading" aria-labelledby="reading-title">
            <span className="privacy-section-number">01</span>
            <div>
              <p className="meta-label">The public site</p>
              <h2 id="reading-title">Reading & saving</h2>
              <p>You can read Today, Archive, and Toolbox without signing in. This app does not add an analytics service. GitHub Pages hosts the site and logs visitors’ IP addresses for security. The Inter and Neue Reckless typefaces are served from this site.</p>
              <p>Question bookmarks, tool bookmarks, open question panels, and a random article-submission identifier are stored in your browser’s local storage. They stay on this device unless you clear them. Your saved items are not sent to the publication workflow.</p>
            </div>
          </section>

          <section className="privacy-section" id="contributing" aria-labelledby="contributing-title">
            <span className="privacy-section-number">02</span>
            <div>
              <p className="meta-label">The contribution path</p>
              <h2 id="contributing-title">Contributing links</h2>
              <p>When you use <strong>Add to crawl</strong>, the article or tool URL, your browser’s random submission identifier, and a Cloudflare Turnstile verification token go to our intake Worker. You do not need a GitHub account or a design / daily account.</p>
              <p>Accepted URLs become public GitHub issues. Each issue contains the URL and the scheduled crawl date, but not your browser identifier. Please do not submit private or sensitive links. A link enters the next crawl; inclusion in an edition or Toolbox remains an editorial decision.</p>
              <p>To limit automated submissions, the Worker stores shortened hashes of the browser identifier and network address in temporary rate-limit buckets. Browser buckets expire after up to two hours; network buckets after up to two days. The Worker does not put a raw IP address in those buckets. Cloudflare also processes data needed to run Turnstile and the Worker.</p>
            </div>
          </section>

          <section className="privacy-section" id="sources" aria-labelledby="sources-title">
            <span className="privacy-section-number">03</span>
            <div>
              <p className="meta-label">The editorial workflow</p>
              <h2 id="sources-title">Sources & synthesis</h2>
              <p>The weekday crawl reads selected public web sources, accepted team links, and newsletters in a dedicated newsletter-only Gmail inbox. Server-side Google OAuth grants read-only access to messages and mailbox settings in that account. The app cannot send, change, or delete mail.</p>
              <p>Source text and metadata are sent to the OpenAI API to help group and synthesize the crawl. A human decides what is published and which tools receive a verdict.</p>
              <p>Published editions and archive files contain summaries, questions, source titles, links, and provenance. Raw Gmail messages and OAuth credentials are not included in the public site bundle. The private Toolbox candidate queue is not published with the site.</p>
            </div>
          </section>

          <section className="privacy-section" id="services" aria-labelledby="services-title">
            <span className="privacy-section-number">04</span>
            <div>
              <p className="meta-label">Where information goes</p>
              <h2 id="services-title">Services & retention</h2>
              <div className="privacy-service-list">
                <p><strong>GitHub</strong><span>Hosts the public site, versioned editions, public contribution issues, and scheduled crawl. OAuth and API credentials are held in GitHub Actions secrets.</span><a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noreferrer">GitHub privacy ↗</a></p>
                <p><strong>Google</strong><span>Holds the dedicated newsletter inbox for the server-side crawl.</span><a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google privacy ↗</a></p>
                <p><strong>Cloudflare</strong><span>Runs article intake and Turnstile verification, with temporary rate-limit data in Workers KV.</span><a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noreferrer">Cloudflare privacy ↗</a></p>
                <p><strong>OpenAI</strong><span>Processes source material submitted by the server-side crawl for editorial synthesis.</span><a href="https://openai.com/policies/privacy-policy/" target="_blank" rel="noreferrer">OpenAI privacy ↗</a></p>
              </div>
              <p>Public GitHub issues and published editions remain available in the repository and its history unless the team removes them. The crawler reads newsletter messages during a run and does not commit raw message bodies to the repository. Each provider also applies its own retention practices.</p>
            </div>
          </section>

          <section className="privacy-section" id="control" aria-labelledby="control-title">
            <span className="privacy-section-number">05</span>
            <div>
              <p className="meta-label">Choices and requests</p>
              <h2 id="control-title">Your control</h2>
              <p>You can remove this app’s saved bookmarks, reading state, and submission identifier from this browser. This does not remove links already submitted as public GitHub issues or content already published in an edition.</p>
              {!confirmClear && !cleared && <button className="privacy-clear" type="button" onClick={() => setConfirmClear(true)}>Clear this browser’s saved data <ArrowRight size={16} aria-hidden="true" /></button>}
              {confirmClear && <div className="privacy-clear-confirm" role="group" aria-label="Confirm clearing browser data">
                <p>This removes your design / daily bookmarks and reading state from this browser. It cannot be undone.</p>
                <div>
                  <button type="button" onClick={() => setConfirmClear(false)}>Keep my data</button>
                  <button type="button" onClick={() => { clearLocalData(); setConfirmClear(false); setCleared(true); }}>Clear saved data</button>
                </div>
              </div>}
              {cleared && <p className="privacy-clear-status" role="status">Saved design / daily data was cleared from this browser. Reload the page to reset the current view.</p>}
              <p>The owner of the dedicated Gmail account can revoke the app’s read-only access through Google Account connections. You may ask for access, correction, or removal of personal data and may complain to a data protection authority where applicable. For a request about a shared link or published content, email <a href="mailto:raphael.regli@nttdata.com">raphael.regli@nttdata.com</a> and include the URL so it can be located.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
