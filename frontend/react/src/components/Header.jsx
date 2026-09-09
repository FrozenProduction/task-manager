import { Link, NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import UserMenu from "./UserMenu";
import ThemeToggle from "./ThemeToggle";
import Modal from "./Modal";
import ProfileForm from "./ProfileForm";

// Single source of truth for SVG icons used in the header / nav.
const Icon = ({ name }) => {
  const icons = {
    logo: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <path d="M14 14h7v7" />
      </svg>
    ),
    dashboard: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
    projects: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      </svg>
    ),
  };
  return icons[name] || null;
};

const navClass = ({ isActive }) =>
  "nav-tab" + (isActive ? " nav-tab--active" : "");

/**
 * Shared page header.
 *
 * Layout: [brand+title] [Dashboard | Projects tabs] [user menu + theme]
 *
 * Brand is a real <Link> on /dashboard (so the logo takes you home),
 * and a non-interactive <div> on /projects and /projects/:id — the
 * logo is just the site mark on sub-pages; nav is via the tabs.
 *
 * User menu: avatar dropdown (Profile + Sign out). Profile opens a modal.
 */
export default function Header({ title }) {
  void title; // Page titles live in page content; the brand is always the product name.
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

  // /dashboard is the "home" route — anywhere else, brand is decorative.
  const brandIsHome = location.pathname === "/dashboard";

  const brand = (
    <>
      <span className="title-icon"><Icon name="logo" /></span>
      <span className="title">Task Manager</span>
    </>
  );

  return (
    <>
      <header className="header">
        <div className="header-content">
          {brandIsHome ? (
            <Link to="/dashboard" className="header-brand" aria-label="Go to dashboard">
              {brand}
            </Link>
          ) : (
            <div className="header-brand header-brand--static" aria-label="Task Manager">
              {brand}
            </div>
          )}

          <nav className="nav-tabs" aria-label="Primary">
            <NavLink to="/dashboard" className={navClass} end>
              <Icon name="dashboard" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/projects" className={navClass}>
              <Icon name="projects" />
              <span>Projects</span>
            </NavLink>
          </nav>

          <div className="header-end">
            <UserMenu onOpenProfile={() => setProfileOpen(true)} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <Modal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        title="Edit profile"
        size="md"
        dismissible={false}
      >
        <ProfileForm onClose={() => setProfileOpen(false)} />
      </Modal>
    </>
  );
}
