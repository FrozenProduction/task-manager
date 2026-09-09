import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { avatarColor } from "../utils/format";

/**
 * Avatar button + dropdown menu.
 * Click toggles open. Click outside / ESC closes.
 * - "Profile" opens the profile modal (controlled by parent via onOpenProfile).
 * - "Sign out" calls auth.logout().
 */
export default function UserMenu({ onOpenProfile }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initial = (user?.username || "?").charAt(0).toUpperCase();
  const color = avatarColor(user?.username);

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={user?.username}
      >
        <span
          className="profile-avatar"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        >
          {initial}
        </span>
      </button>

      {open && (
        <div className="user-menu-panel" role="menu">
          <div className="user-menu-head">
            <span
              className="profile-avatar"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            >
              {initial}
            </span>
            <div className="user-menu-head-info">
              <span className="user-menu-name">{user?.username}</span>
              <span className="user-menu-email">{user?.email}</span>
            </div>
          </div>
          <button
            type="button"
            className="user-menu-item"
            role="menuitem"
            onClick={() => { setOpen(false); onOpenProfile(); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5z" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
            <span>Profile</span>
          </button>
          <button
            type="button"
            className="user-menu-item user-menu-item--danger"
            role="menuitem"
            onClick={() => { setOpen(false); logout(); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}
