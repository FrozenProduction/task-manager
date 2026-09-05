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
      <div className="container">
        <div className="loading">Loading project…</div>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="container">
        <div className="errorBox">
          <p>{projectError || "Project not found."}</p>
          <button onClick={() => navigate("/projects")} className="backButton">
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
    <div className="container">
      <header className="header">
        <div className="headerContent">
          <div className="projectHeader">
            <button onClick={() => navigate("/projects")} className="backButton">
              ← Back
            </button>
            <div className="projectInfo">
              <h1 className="title">{project.name}</h1>
              {project.description && (
                <p className="description">{project.description}</p>
              )}
            </div>
          </div>
          <div className="userInfo">
            <span className="username">{user?.username}</span>
            <button onClick={logout} className="logoutButton">Sign out</button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deletingProject}
              className="deleteProjectButton"
            >
              {deletingProject ? "Deleting…" : "Delete project"}
            </button>
          </div>
        </div>
      </header>

      {deleteConfirm && deleteTarget && (
        <div className="overlay">
          <div className="dialog">
            <p>Delete project "{deleteTarget.name}"? This action cannot be undone.</p>
            <div className="dialogActions">
              <button onClick={handleDeleteCancel} className="cancelButton">
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={deleting}
                className="confirmDeleteButton"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="main">
        <section className="section">
          <h2 className="sectionTitle">Tasks</h2>

          {loading && <div className="loading">Loading tasks...</div>}

          {error && (
            <p className="error">{error}</p>
          )}

          <form onSubmit={handleCreateTask} className="createForm">
            <div className="formRow">
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
                className="createButton"
              >
                {creating ? "Adding..." : "Add Task"}
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

          {createError && <p className="error">{createError}</p>}
          {updateError && <p className="error">{updateError}</p>}
          {deleteError && <p className="error">{deleteError}</p>}

          <div className="taskList">
            {tasks.length === 0 ? (
              <p className="emptyState">No tasks yet. Add your first task above.</p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="task-card"
                  style={{ opacity: deleteTarget?.id === task.id ? 0.6 : 1 }}
                >
                  <div className="taskHeader">
                    <div className="taskTitleContainer">
                      <span
                        className="status-badge"
                        style={{ backgroundColor: statusColors[task.status] || "#9ca3af" }}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                      <span className="taskTitle">{task.title}</span>
                    </div>
                    <div className="taskActions">
                      {task.status !== "DONE" && (
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className="statusSelect"
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
                        className="deleteTaskButton"
                        title="Delete task"
                        disabled={task.status === "DONE"}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {task.description && (
                    <p className="taskDescription">{task.description}</p>
                  )}
                  <div className="taskMeta">
                    <span className="metaItem">
                      Created: {new Date(task.createdAt).toLocaleString()}
                    </span>
                    {task.assigneeUsername && (
                      <span className="metaItem">
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

      <footer className="footer">
        <a
          href="https://github.com/FrozenProduction/task-manager"
          target="_blank"
          rel="noopener noreferrer"
          className="footerLink"
        >
          View on GitHub
        </a>
      </footer>
    </div>
  );
}

