import { buildInfo } from "../buildInfo";

// Small inline icons so the footer doesn't pull in a heavy icon dependency.
const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.73.5.7 5.53.7 11.8c0 4.97 3.22 9.18 7.69 10.67.56.1.77-.24.77-.54 0-.27-.01-1.16-.02-2.11-3.13.68-3.79-1.34-3.79-1.34-.51-1.3-1.25-1.64-1.25-1.64-1.02-.7.08-.69.08-.69 1.13.08 1.73 1.16 1.73 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.39-1.23.72-1.51-2.5-.29-5.13-1.25-5.13-5.55 0-1.23.44-2.23 1.16-3.02-.12-.29-.5-1.43.11-2.98 0 0 .95-.3 3.11 1.15.9-.25 1.87-.38 2.83-.38.96 0 1.93.13 2.83.38 2.16-1.46 3.11-1.15 3.11-1.15.62 1.55.23 2.69.11 2.98.72.79 1.16 1.79 1.16 3.02 0 4.31-2.63 5.26-5.14 5.54.4.35.76 1.03.76 2.08 0 1.5-.01 2.71-.01 3.08 0 .3.2.65.78.54 4.46-1.49 7.68-5.7 7.68-10.67C23.3 5.53 18.27.5 12 .5z" />
  </svg>
);
const ExternalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

/**
 * Footer is a credits bar, not navigation. The header owns Dashboard/Projects.
 * Left: brand + tagline. Center: Source + Live external links. Right: version badge.
 */
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section footer-brand">
          <span className="footer-brand-name">Task Manager</span>
          <span className="footer-brand-tagline">
            Full-stack portfolio project — Spring Boot + React
          </span>
        </div>

        <nav className="footer-section footer-links" aria-label="External">
          <a
            href={buildInfo.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link footer-link-external"
          >
            <GitHubIcon /> Source
          </a>
          <a
            href={buildInfo.live}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link footer-link-external"
          >
            <ExternalIcon /> Live
          </a>
        </nav>

        <div className="footer-section footer-meta">
          <a
            href={`${buildInfo.repo}/commits/main`}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-meta-item footer-meta-link"
            title="View commit history on GitHub"
          >
            <span className="footer-meta-label">v{buildInfo.version}</span>
            <span className="footer-meta-sep">·</span>
            <span className="footer-meta-deployed">
              Deployed {buildInfo.deployedAt}
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
