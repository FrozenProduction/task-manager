import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { avatarColor } from "../utils/format";

/**
 * Edit-profile form, rendered inside <Modal>.
 * Single submit updates username/email/newPassword in one PATCH.
 * `currentPassword` is REQUIRED by the backend (proves ownership).
 *
 * Non-dismissible modal — losing half-typed work to an accidental
 * backdrop click is the worst kind of UX.
 */
export default function ProfileForm({ onClose }) {
  const { user, updateProfile } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Reset success/error when fields change
  useEffect(() => {
    setSuccess(false);
    setError(null);
  }, [username, email, currentPassword, newPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!currentPassword) {
      setError("Enter your current password to save changes.");
      return;
    }
    const changes = { currentPassword };
    if (username.trim() && username.trim() !== user?.username) changes.username = username.trim();
    if (email.trim() && email.trim() !== user?.email) changes.email = email.trim();
    if (newPassword) changes.newPassword = newPassword;
    if (Object.keys(changes).length === 1) {
      // Only currentPassword — nothing to update.
      setError("Nothing to update.");
      return;
    }

    setSaving(true);
    try {
      await updateProfile(changes);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      // Auto-close after success so the header avatar updates immediately
      setTimeout(() => onClose(), 700);
    } catch (err) {
      setError(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const initial = (user?.username || "?").charAt(0).toUpperCase();

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="profile-banner">
        <span
          className="profile-avatar profile-avatar--lg"
          style={{ backgroundColor: avatarColor(user?.username) }}
          aria-hidden="true"
        >
          {initial}
        </span>
        <div>
          <p className="profile-banner-name">{user?.username}</p>
          <p className="profile-banner-email">{user?.email}</p>
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="profile-username">Username</label>
        <input
          id="profile-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input"
          minLength={3}
          maxLength={50}
          autoComplete="username"
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="profile-email">Email</label>
        <input
          id="profile-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          autoComplete="email"
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="profile-current-password">
          Current password <span className="required">*</span>
        </label>
        <input
          id="profile-current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="input"
          placeholder="Required to save any change"
          autoComplete="current-password"
          required
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="profile-new-password">
          New password <span className="hint-inline">(leave blank to keep current)</span>
        </label>
        <input
          id="profile-new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="input"
          placeholder="At least 6 characters"
          autoComplete="new-password"
          minLength={6}
        />
      </div>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">Profile updated.</p>}

      <div className="modal-actions">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-secondary"
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !currentPassword}
          className="btn btn-primary"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
