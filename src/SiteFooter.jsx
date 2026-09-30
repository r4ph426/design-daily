import "./site-footer.css";

export function SiteFooter({ theme = "forest", privacyHref = "/#/privacy" }) {
  return (
    <footer className="site-footer" data-theme={theme}>
      <div className="site-footer-cell">AI-generated. Human-edited.</div>
      <a className="site-footer-cell site-footer-privacy" href={privacyHref}>
        <span>Privacy <span aria-hidden="true">↗</span></span>
      </a>
      <div className="site-footer-cell">Synthesis, not noise.</div>
    </footer>
  );
}
