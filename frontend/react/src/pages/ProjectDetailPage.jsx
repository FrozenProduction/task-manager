import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useDeleteProject,
} from "../context/AuthContext";

const Icon = ({ name }) => {
  const icons = {
    "arrow-left": (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    ),
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
    refresh: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        <path d="M3 21v-5h5" />
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
    logo: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <path d="M14 14h7v7" />
      </svg>
    ),
  };
  return icons[name] || null;
};

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Fetch the single project directly — don't rely on a shared cache from
  // useProjects(), which lives in a separate hook instance and is empty on
  // direct loads or right after creating a project.
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
          if (r.status === 404) {
            throw new Error("Project not found.");
          }
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

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const { tasks, loading, error, refresh } = useTasks(projectId ? Number(projectId) : null);
  const { create, creating, error: createError } = useCreateTask();
  const { update, updating, error: updateError } = useUpdateTask();
  const { remove, deleting, error: deleteError } = useDeleteTask();
  const { remove: removeProject, deleting: deletingProject, error: deleteProjectError } = useDeleteProject();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  if (projectLoading) {
    return (
      <div className="container-full">
        <div className="loading">Loading project...</div>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="container-full">
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

    try {
      await create(
        title.trim(),
        description.trim(),
        status,
        project.id,
        null
      );
      await refresh();
      setTitle("");
      setDescription("");
      setStatus("TODO");
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
      // Error handled by hook (deleteProjectError)
    }
  };

  const handleDeleteConfirm = () => {
    setDeleteConfirm(true);
    setDeleteTarget(project);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(false);
    setDeleteTarget(null);
  };

  // Status → color mapping (intentional inline: each badge has its own color,
  // defined in a single place so future palette tweaks are one-line).
  const statusColors = {
    TODO: "#9ca3af",
    IN_PROGRESS: "#3b82f6",
    DONE: "#10b981",
  };

  const isDeletingProject = deleteTarget?.id === project?.id;

  return (
    <div className="container-full">
      <header className="header">
        <div className="header-content">
          <div className="project-info">
            <button onClick={() => navigate("/projects")} className="back-button">
              <Icon name="arrow-left" /> Back to projects
            </button>
            <h1 className="title">
              <span className="title-icon"><Icon name="logo" /></span>
              {project.name}
            </h1>
            {project.description && (
              <p className="project-info-desc">{project.description}</p>
            )}
          </div>
          <div className="user-info">
            <span className="username">{user?.username}</span>
            <button onClick={logout} className="logout-button">Sign out</button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deletingProject}
              className="delete-project-button"
            >
              {deletingProject ? "Deleting..." : "Delete project"}
            </button>
          </div>
        </div>
      </header>

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
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Tasks</h2>
            <span className="stat-trend">{tasks.length} total</span>
          </div>

          {loading && <div className="loading">Loading tasks...</div>}

          {error && (
            <p className="error">{error}</p>
          )}

          <form onSubmit={handleCreateTask} className="create-form">
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
            {tasks.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon"><Icon name="tasksPlus" /></span>
                <p className="empty-state-text">No tasks yet</p>
                <p className="empty-state-hint">
                  Add your first task using the form above.
                </p>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="task-card"
                  style={{ opacity: deleteTarget?.id === task.id && !deleteConfirm ? 0.6 : 1 }}
                >
                  <div className="task-card-head">
                    <div className="task-title-row">
                      <span
                        className="status-badge"
                        style={{ backgroundColor: statusColors[task.status] || "#9ca3af" }}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                      <span className="task-title">{task.title}</span>
                    </div>
                    <div className="task-actions">
                      {task.status !== "DONE" && (
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className="status-select"
                          title="Change status"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="DONE">Done</option>
                        </select>
                      )}
                      <button
                        onClick={() => {
                          setDeleteTarget(task);
                          setDeleteConfirm(true);
                        }}
                        className="delete-task-button"
                        title="Delete task"
                        disabled={task.status === "DONE"}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}
                  <div className="task-meta">
                    <span className="meta-item">
                      <Icon name="calendar" />
                      Created {new Date(task.createdAt).toLocaleString()}
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

      <footer className="footer">
        <a
          href="https://github.com/FrozenProduction/task-manager"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          View on GitHub
        </a>
      </footer>
    </div>
  );
}