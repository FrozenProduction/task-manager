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
      <div style={styles.container}>
        <div style={styles.loading}>Loading project…</div>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>
          <p>{projectError || "Project not found."}</p>
          <button onClick={() => navigate("/projects")} style={styles.backButton}>
            Back to projects
          </button>
        </div>
      </div>
    );
  }

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const newTask = await create(
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

  const statusColors = {
    TODO: "#9ca3af",
    IN_PROGRESS: "#3b82f6",
    DONE: "#10b981",
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.projectHeader}>
            <button onClick={() => navigate("/projects")} style={styles.backButton}>
              ← Back
            </button>
            <div style={styles.projectInfo}>
              <h1 style={styles.title}>{project.name}</h1>
              {project.description && (
                <p style={styles.description}>{project.description}</p>
              )}
            </div>
          </div>
          <div style={styles.userInfo}>
            <span style={styles.username}>{user?.username}</span>
            <button onClick={logout} style={styles.logoutButton}>Sign out</button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deletingProject}
              style={styles.deleteProjectButton}
            >
              {deletingProject ? "Deleting…" : "Delete project"}
            </button>
          </div>
        </div>
      </header>

      {deleteConfirm && deleteTarget && (
        <div style={styles.overlay}>
          <div style={styles.dialog}>
            <p>Delete project "{deleteTarget.name}"? This action cannot be undone.</p>
            <div style={styles.dialogActions}>
              <button onClick={handleDeleteCancel} style={styles.cancelButton}>
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={deleting}
                style={styles.confirmDeleteButton}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main style={styles.main}>
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Tasks</h2>

          {loading && <div style={styles.loading}>Loading tasks...</div>}

          {error && (
            <p style={styles.error}>{error}</p>
          )}

          <form onSubmit={handleCreateTask} style={styles.createForm}>
            <div style={styles.formRow}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                style={styles.input}
                required
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={styles.select}
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
              <button
                type="submit"
                disabled={creating || !title.trim()}
                style={styles.createButton}
              >
                {creating ? "Adding..." : "Add Task"}
              </button>
            </div>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              style={styles.input}
            />
          </form>

          {createError && <p style={styles.error}>{createError}</p>}
          {updateError && <p style={styles.error}>{updateError}</p>}
          {deleteError && <p style={styles.error}>{deleteError}</p>}

          <div style={styles.taskList}>
            {tasks.length === 0 ? (
              <p style={styles.emptyState}>No tasks yet. Add your first task above.</p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    ...styles.taskCard,
                    opacity: deleteTarget?.id === task.id ? 0.6 : 1,
                  }}
                >
                  <div style={styles.taskHeader}>
                    <div style={styles.taskTitleContainer}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: statusColors[task.status] || "#9ca3af",
                        }}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                      <span style={styles.taskTitle}>{task.title}</span>
                    </div>
                    <div style={styles.taskActions}>
                      {task.status !== "DONE" && (
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          style={styles.statusSelect}
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
                        style={styles.deleteTaskButton}
                        title="Delete task"
                        disabled={task.status === "DONE"}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {task.description && (
                    <p style={styles.taskDescription}>{task.description}</p>
                  )}
                  <div style={styles.taskMeta}>
                    <span style={styles.metaItem}>
                      Created: {new Date(task.createdAt).toLocaleString()}
                    </span>
                    {task.assigneeUsername && (
                      <span style={styles.metaItem}>
                        Assigned to: {task.assigneeUsername}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <footer style={styles.footer}>
        <a
          href="https://github.com/FrozenProduction/task-manager"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.footerLink}
        >
          View on GitHub
        </a>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f5f5f5",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  dialog: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "1.5rem",
    maxWidth: "400px",
    width: "90%",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  dialogActions: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "1rem",
    justifyContent: "flex-end",
  },
  cancelButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "white",
    border: "1px solid #ddd",
    borderRadius: "4px",
    cursor: "pointer",
  },
  confirmDeleteButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  header: {
    backgroundColor: "white",
    borderBottom: "1px solid #e5e7eb",
    padding: "1rem 2rem",
  },
  headerContent: {
    maxWidth: "900px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
  },
  projectHeader: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    flex: 1,
  },
  backButton: {
    background: "none",
    border: "none",
    color: "#666",
    fontSize: "1rem",
    cursor: "pointer",
    padding: "0.25rem 0",
    textDecoration: "none",
  },
  projectInfo: {
    flex: 1,
  },
  title: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: "0.25rem",
  },
  description: {
    color: "#666",
    fontSize: "0.9rem",
    margin: 0,
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flexShrink: 0,
  },
  username: {
    color: "#666",
    fontSize: "0.9rem",
  },
  logoutButton: {
    background: "none",
    border: "1px solid #ddd",
    borderRadius: "4px",
    padding: "0.4rem 0.75rem",
    fontSize: "0.85rem",
    color: "#666",
    cursor: "pointer",
  },
  deleteProjectButton: {
    background: "none",
    border: "1px solid #fca5a5",
    borderRadius: "4px",
    padding: "0.4rem 0.75rem",
    fontSize: "0.8rem",
    color: "#dc2626",
    cursor: "pointer",
  },
  main: {
    flex: 1,
    maxWidth: "900px",
    width: "100%",
    margin: "0 auto",
    padding: "2rem",
  },
  section: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "1.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: "1rem",
  },
  loading: {
    textAlign: "center",
    color: "#666",
    padding: "1rem",
  },
  error: {
    color: "#dc2626",
    fontSize: "0.85rem",
    marginBottom: "0.5rem",
  },
  createForm: {
    marginBottom: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  formRow: {
    display: "flex",
    gap: "0.5rem",
  },
  input: {
    flex: 1,
    padding: "0.5rem 0.75rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "1rem",
  },
  select: {
    padding: "0.5rem 0.75rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "0.95rem",
    backgroundColor: "white",
  },
  createButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "0.95rem",
    fontWeight: "500",
    cursor: "pointer",
    alignSelf: "flex-end",
  },
  taskList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  emptyState: {
    textAlign: "center",
    color: "#999",
    padding: "1.5rem",
    fontSize: "0.9rem",
  },
  taskCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    padding: "0.75rem",
    backgroundColor: "white",
  },
  taskHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
    gap: "0.5rem",
  },
  taskTitleContainer: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    flex: 1,
    minWidth: 0,
  },
  statusBadge: {
    padding: "0.15rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: "500",
    color: "white",
    whiteSpace: "nowrap",
  },
  taskTitle: {
    fontSize: "0.95rem",
    color: "#1a1a1a",
    fontWeight: "500",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  taskActions: {
    display: "flex",
    gap: "0.25rem",
    flexShrink: 0,
  },
  statusSelect: {
    padding: "0.25rem 0.5rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "0.75rem",
    backgroundColor: "white",
  },
  deleteTaskButton: {
    background: "none",
    border: "1px solid #fca5a5",
    borderRadius: "4px",
    padding: "0.25rem 0.5rem",
    fontSize: "0.7rem",
    color: "#dc2626",
    cursor: "pointer",
  },
  taskDescription: {
    color: "#666",
    fontSize: "0.85rem",
    margin: "0 0 0.5rem 0",
  },
  taskMeta: {
    display: "flex",
    gap: "0.75rem",
    fontSize: "0.75rem",
    color: "#999",
  },
  metaItem: {
    fontSize: "0.75rem",
  },
  footer: {
    textAlign: "center",
    padding: "1rem",
    color: "#999",
    fontSize: "0.85rem",
    borderTop: "1px solid #e5e7eb",
  },
  footerLink: {
    color: "#4f46e5",
    textDecoration: "none",
  },
};
