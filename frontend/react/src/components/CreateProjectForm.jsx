import { useState } from "react";
import { useCreateProject } from "../context/AuthContext";

// Reusable create-project form. Used inside <Modal> on both Dashboard and Projects pages.
// On success: calls onCreated(project) and resets the form.
export default function CreateProjectForm({ onCreated, onCancel }) {
  const { create, creating, error } = useCreateProject();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || creating) return;
    try {
      const project = await create(name.trim(), description.trim());
      setName("");
      setDescription("");
      if (onCreated) onCreated(project);
    } catch {
      // Error is exposed via `error` from useCreateProject
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="field">
        <label className="label" htmlFor="create-project-name">Project name</label>
        <input
          id="create-project-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder="e.g., Website redesign"
          autoFocus
          required
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="create-project-desc">Description (optional)</label>
        <input
          id="create-project-desc"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input"
          placeholder="Brief description"
        />
      </div>
      {error && <p className="error">{error}</p>}
      <div className="modal-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={creating}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={creating || !name.trim()}
          className="btn btn-primary"
        >
          {creating ? "Creating…" : "Create project"}
        </button>
      </div>
    </form>
  );
}