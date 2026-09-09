import { useState, useEffect, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useDeleteProject,
} from "../context/AuthContext";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { formatStatus, statusColor, formatDate } from "../utils/format";

const Icon = ({ name }) => {
  const icons = {
    plus: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
    tasks: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 11l3 3 8-8" />
        <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
      </svg>
    ),
    user: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    ),
    calendar: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 3v4M16 3v4" />
      </svg>
    ),
    trash: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      </svg>
    ),
    folder: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      </svg>
    ),
    tasksPlus: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 11l3 3 8-8" />
        <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
        <path d="M12 18v-3M10.5 16.5h3" />
      </svg>
    ),
    "arrow-left": (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    ),
    link: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  };
  return icons[name] || null;
};

const STATUS_FILTERS = [
  { value: "ALL", label: "All" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState(null);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    const token = localStorage.getItem("taskManagerToken");
    const API_BASE = import.meta.env?.VITE_API_URL || "http://localhost:8080";

    (async () => {
      setProjectLoading(true);
      setProjectError(null);
      try {
        const r = await fetch(`${API_BASE}/api/projects/${projectId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!r.ok) {
          if (r.status === 404) throw new Error("Project not found.");
          throw new Error(`Request failed with status ${r.status}`);
        }
        const data = await r.json();
        if (!cancelled) setProject(data);
      } catch (err) {
        if (!cancelled) setProjectError(err.message || "Failed to load project");
      } finally {
        if (!cancelled) setProjectLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [projectId]);

  const { tasks, loading, error, refresh } = useTasks(projectId ? Number(projectId) : null);
  const { create, creating, error: createError } = useCreateTask();
  const { update, error: updateError } = useUpdateTask();
  const { remove, deleting, error: deleteError } = useDeleteTask();
  const { remove: removeProject, deleting: deletingProject, error: deleteProjectError } = useDeleteProject();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Filter + search state
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Link-Logger attach state.
  // When `linkLoggerLinkId` is set, the next task creation will fetch the
  // link from Link Logger (server-to-server, no CORS issues) and snapshot
  // its data onto the new task. We do NOT pre-lookup from the browser
  // because Link Logger's CORS only permits its own Vercel origin, not
  // the Task Manager Vercel origin. The result of the attach shows up
  // on the new task card after creation.
  const [linkLoggerLinkId, setLinkLoggerLinkId] = useState("");

  const resetCreateForm = () => {
    setTitle("");
    setDescription("");
    setStatus("TODO");
    setLinkLoggerLinkId("");
  };

  // Counts per status — shown on each filter chip
  const counts = useMemo(() => {
    const c = { ALL: tasks.length, TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    for (const t of tasks) {
      if (c[t.status] !== undefined) c[t.status] += 1;
    }
    return c;
  }, [tasks]);

  // Client-side filter (instant; no backend roundtrip needed)
  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (statusFilter !== "ALL") list = list.filter((t) => t.status === statusFilter);
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((t) =>
        (t.title || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [tasks, statusFilter, searchQuery]);

  if (projectLoading) {
    return (
      <div className="container-full">
        <Header title="Loading project..." />
        <div className="loading">Loading project...</div>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="container-full">
        <Header title="Project" />
        <div className="error-box">
          <p>{projectError || "Project not found."}</p>
          <button onClick={() => navigate("/projects")} className="back-button">
            <Icon name="arrow-left" /> Back to projects
          </button>
        </div>
      </div>
    );
  }

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    // Send the linkLoggerLinkId (or null) to the backend. The backend
    // fetches the link from Link Logger server-to-server and snapshots
    // its data onto the new task. No browser pre-lookup needed (and
    // impossible anyway: Link Logger's CORS doesn't permit our origin).
    const linkId = linkLoggerLinkId.trim()
      ? parseInt(linkLoggerLinkId, 10)
      : null;
    try {
      await create(
        title.trim(),
        description.trim(),
        status,
        project.id,
        null,
        Number.isFinite(linkId) && linkId > 0 ? linkId : null
      );
      await refresh();
      resetCreateForm();
    } catch {
      // Error handled by hook
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await update(taskId, { status: newStatus });
      await refresh();
    } catch {
      // Error handled by hook
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
      await refresh();
    } catch {
      // Error handled by hook
    } finally {
      setDeleteTarget(null);
      setDeleteConfirm(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    try {
      await removeProject(project.id);
      navigate("/projects", { replace: true });
    } catch {
      // Error handled by hook
    }
  };

  const openProjectDelete = () => {
    setDeleteConfirm(true);
    setDeleteTarget(project);
  };

  const openTaskDelete = (task) => {
    setDeleteConfirm(true);
    setDeleteTarget(task);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const isDeletingProject = deleteTarget?.id === project?.id;
  void user;

  return (
    <div className="container-full">
      <Header title={project.name} />

      {deleteConfirm && deleteTarget && (
        <div className="overlay">
          <div className="dialog">
            <p className="dialog-title">
              {isDeletingProject ? "Delete project?" : "Delete task?"}
            </p>
            <p className="dialog-body">
              "{deleteTarget.name || deleteTarget.title}" will be permanently removed. This action cannot be undone.
            </p>
            <div className="dialog-actions">
              <button onClick={handleDeleteCancel} className="cancel-button">
                Cancel
              </button>
              <button
                onClick={isDeletingProject ? handleDeleteProject : handleDeleteTask}
                disabled={deleting || deletingProject}
                className="confirm-delete-button"
              >
                {(deleting || deletingProject) ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="main">
        {/* Breadcrumb — proper "where am I" navigation. Clickable segments. */}
        <div className="breadcrumb-row">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/projects">
              <Icon name="folder" /> Projects
            </Link>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{project.name}</span>
          </nav>
          <button
            onClick={openProjectDelete}
            disabled={deletingProject}
            className="breadcrumb-delete"
            title="Delete project"
            aria-label="Delete project"
          >
            <Icon name="trash" /> Delete
          </button>
        </div>

        {project.description && (
          <p className="project-info-desc">{project.description}</p>
        )}

        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Tasks</h2>
            <span className="stat-trend">{tasks.length} total</span>
          </div>

          {/* Filter chips + search — client-side, instant */}
          <div className="task-filter">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={
                  "task-filter-chip" +
                  (statusFilter === f.value ? " task-filter-chip--active" : "") +
                  (f.value !== "ALL" && counts[f.value] === 0 ? " task-filter-chip--empty" : "")
                }
                onClick={() => setStatusFilter(f.value)}
              >
                <span>{f.label}</span>
                <span className="task-filter-count">{counts[f.value]}</span>
              </button>
            ))}
            <input
              type="text"
              className="task-search"
              placeholder="Search tasks…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search tasks"
            />
          </div>

          {loading && <div className="loading">Loading tasks...</div>}

          {error && <p className="error">{error}</p>}

          <form onSubmit={handleCreateTask} className="create-form">
            {/* Link-Logger attach row — backend fetches the link server-to-server
                on submit, so no preview here. Result shows up on the new task. */}
            <div className="link-attach-row">
              <Icon name="link" />
              <input
                type="number"
                min="1"
                value={linkLoggerLinkId}
                onChange={(e) => setLinkLoggerLinkId(e.target.value)}
                placeholder="Link Logger ID (optional)"
                className="input input--narrow"
                aria-label="Link Logger ID"
              />
              <span className="link-attach-hint">
                Paste a Link Logger link ID — find it in your links list
              </span>
            </div>

            <div className="form-row">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                className="input"
                required
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="select"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
              <button
                type="submit"
                disabled={creating || !title.trim()}
                className="create-button"
              >
                <Icon name="plus" /> {creating ? "Adding..." : "Add Task"}
              </button>
            </div>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="input"
            />
          </form>

          {(createError || updateError || deleteError || deleteProjectError) && (
            <p className="error">
              {createError || updateError || deleteError || deleteProjectError}
            </p>
          )}

          <div className="task-list">
            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon"><Icon name="tasksPlus" /></span>
                <p className="empty-state-text">
                  {tasks.length === 0
                    ? "No tasks yet"
                    : "No tasks match your filter"}
                </p>
                <p className="empty-state-hint">
                  {tasks.length === 0
                    ? "Add your first task using the form above."
                    : "Try a different status or clear the search."}
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="task-card"
                  style={{ opacity: deleteTarget?.id === task.id && !deleteConfirm ? 0.6 : 1 }}
                >
                  <div className="task-card-head">
                    <div className="task-title-row">
                      <span
                        className="status-badge"
                        style={{ backgroundColor: statusColor(task.status) }}
                      >
                        {formatStatus(task.status)}
                      </span>
                      <span className="task-title">{task.title}</span>
                    </div>
                    <div className="task-actions">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        className="status-select"
                        title="Change status"
                        aria-label="Change status"
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Done</option>
                      </select>
                      <button
                        onClick={() => openTaskDelete(task)}
                        className="icon-button"
                        title="Delete task"
                        aria-label="Delete task"
                      >
                        <Icon name="trash" />
                      </button>
                    </div>
                  </div>
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}
                  {task.sourceLinkShortCode && (
                    <a
                      className="link-source-badge"
                      href={task.sourceLinkShortUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Open the source link (${task.sourceLinkClicksAtImport ?? 0} clicks at import)`}
                    >
                      <Icon name="link" />
                      <span className="link-source-short">{task.sourceLinkShortCode}</span>
                      <span className="link-source-clicks">
                        {task.sourceLinkClicksAtImport ?? 0} click{(task.sourceLinkClicksAtImport ?? 0) === 1 ? "" : "s"}
                      </span>
                    </a>
                  )}
                  <div className="task-meta">
                    <span className="meta-item">
                      <Icon name="calendar" />
                      Created {formatDate(task.createdAt)}
                    </span>
                    {task.assigneeUsername && (
                      <span className="meta-item">
                        <Icon name="user" /> Assigned to {task.assigneeUsername}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
