import { useEffect } from "react";

/**
 * Generic Modal — overlay + dialog + close button.
 *
 * Dismiss behavior controlled by `dismissible`:
 *   - true  (default): backdrop click + ESC + X button + Cancel all close.
 *   - false: only the X button or an explicit Cancel action closes the modal.
 *            Use this for create/edit forms where an accidental click
 *            outside shouldn't discard the user's input.
 *
 * Always locks body scroll while open. Always provides a visible close button.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  dismissible = true,
}) {
  // ESC handling — skipped when non-dismissible
  useEffect(() => {
    if (!isOpen) return;
    if (!dismissible) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, dismissible]);

  // Body scroll lock — always, regardless of dismissible
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Backdrop click closes only when dismissible
  const overlayClick = dismissible ? onClose : undefined;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={overlayClick}
    >
      <div
        className={`modal-dialog modal-dialog--${size}`}
        // Always stop propagation so clicks INSIDE the dialog never reach the overlay,
        // even when dismissible=true.
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="modal-close"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
