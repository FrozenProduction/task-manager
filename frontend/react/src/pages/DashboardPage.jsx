import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useProjects, useCreateProject } from "../context/AuthContext";

// Inline SVG icons (no extra deps, theme-colored via currentColor)
const Icon = ({ name }) => {
  const icons = {
    folder: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      </svg>
    ),
    tasks: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 11l3 3 8-8" />
        <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
      </svg>
    ),
    plus: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
    "arrow-right": (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14M13 5l7 7-7 7" />
      </svg>
    ),
    "arrow-up-right": (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 17L17 7M8 7h9v9" />
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

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { projects, loading: projectsLoading, error: projectsError, refresh: refreshProjects } = useProjects();
  const { create, creating, error: createError } = useCreateProject();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [totalTasks, setTotalTasks] = useState(0);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Total task count: single endpoint /api/tasks/mine (all tasks in all my projects)
  useEffect(() => {
    if (!projects || projects.length === 0) {
      setTotalTasks(0);
      return;
    }
    let cancelled = false;
    const token = localStorage.getItem("taskManagerToken");
    const API_BASE = import.meta.env?.VITE_API_URL || "http://localhost:8080";
    (async () => {
      setTasksLoading(true);
      try {
        const r = await fetch(`${API_BASE}/api/tasks/mine`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (r.ok) {
          const arr = await r.json();
          if (!cancelled) setTotalTasks(Array.isArray(arr) ? arr.length : 0);
        } else {
          if (!cancelled) setTotalTasks(0);
        }
      } catch {
        if (!cancelled) setTotalTasks(0);
      } finally {
        if (!cancelled) setTasksLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [projects]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const project = await create(name.trim(), description.trim());
      setName("");
      setDescription("");
      // Stay on dashboard so the user sees the updated counters.
      // The project list effect above will re-run on the new projects array.
      await refreshProjects();
      navigate(`/projects/${project.id}`, { replace: true });
    } catch {
      // Error is handled by the hook
    }
  };

  return (
    <div className="container-full">
      <header className="header">
        <div className="header-content">
          <h1 className="title">
            <span className="title-icon"><Icon name="logo" /></span>
            Dashboard
          </h1>
          <div className="userInfo">
            <span className="username">{user?.username}</span>
            <button onClick={logout} className="logout-button">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <section className="section section--hero">
          <div className="section-header">
            <h2 className="section-title">Quick stats</h2>
          </div>
          {projectsError ? (
            <p className="error">Could not load stats: {projectsError}</p>
          ) : (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-card-head">
                  <span className="stat-icon"><Icon name="folder" /></span>
                  <span className="stat-trend">all time</span>
                </div>
                <span className="stat-value">
                  {projectsLoading ? "…" : projects.length}
                </span>
                <span className="stat-label">Projects</span>
              </div>
              <div className="stat-card stat-card--accent">
                <div className="stat-card-head">
                  <span className="stat-icon"><Icon name="tasks" /></span>
                  <span className="stat-trend">across projects</span>
                </div>
                <span className="stat-value">
                  {tasksLoading ? "…" : totalTasks}
                </span>
                <span className="stat-label">Tasks</span>
              </div>
            </div>
          )}
          <p className="hint">
            {projects.length === 0
              ? "Create your first project to see stats here."
              : `${projects.length} project${projects.length === 1 ? "" : "s"}, ${totalTasks} task${totalTasks === 1 ? "" : "s"} across all of them.`}
          </p>

          {projects.length > 0 && (
            <div className="dashboard-actions">
              <Link to="/projects" className="view-projects-link">
                View my projects ({projects.length}) <Icon name="arrow-right" />
              </Link>
            </div>
          )}
        </section>

        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Create new project</h2>
          </div>
          <form onSubmit={handleCreate} className="form">
            <div className="field">
              <label className="label">Project name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="e.g., Website redesign"
              />
            </div>
            <div className="field">
              <label className="label">Description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
                placeholder="Brief description"
              />
            </div>
            {createError && <p className="error">{createError}</p>}
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="btn btn-primary"
            >
              {creating ? "Creating..." : "Create Project"}
            </button>
          </form>
        </section>

        {projects.length > 0 && (
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Your projects</h2>
              <Link to="/projects" className="view-projects-link">
                All projects <Icon name="arrow-right" />
              </Link>
            </div>
            <div className="project-list">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className="project-card"
                >
                  <span className="project-card-icon"><Icon name="folder" /></span>
                  <span className="project-card-body">
                    <span className="project-card-name">{p.name}</span>
                    {p.description && (
                      <span className="project-card-desc">{p.description}</span>
                    )}
                  </span>
                  <span className="project-card-arrow"><Icon name="arrow-up-right" /></span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <a href="https://github.com/FrozenProduction/task-manager" target="_blank" rel="noopener noreferrer" className="footer-link">
          View on GitHub
        </a>
      </footer>
    </div>
  );
}