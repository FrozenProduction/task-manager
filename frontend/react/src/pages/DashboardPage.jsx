import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useProjects, useCreateProject } from "../context/AuthContext";

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
    <div className="container">
      <header className="header">
        <div className="headerContent">
          <h1 className="title">Dashboard</h1>
          <div className="userInfo">
            <span className="username">{user?.username}</span>
            <button onClick={logout} className="logoutButton">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <section className="section">
          <h2 className="sectionTitle">Create new project</h2>
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
              className="button"
            >
              {creating ? "Creating..." : "Create Project"}
            </button>
          </form>
        </section>

        <section className="section">
          <h2 className="sectionTitle">Quick stats</h2>
          {projectsError ? (
            <p className="error">Could not load stats: {projectsError}</p>
          ) : (
            <div className="statsGrid">
              <div className="statCard">
                <span className="statValue">
                  {projectsLoading ? "…" : projects.length}
                </span>
                <span className="statLabel">Projects</span>
              </div>
              <div className="statCard">
                <span className="statValue">
                  {tasksLoading ? "…" : totalTasks}
                </span>
                <span className="statLabel">Tasks</span>
              </div>
            </div>
          )}
          <p className="hint">
            {projects.length === 0
              ? "Create your first project to see stats here."
              : `${projects.length} project${projects.length === 1 ? "" : "s"}, ${totalTasks} task${totalTasks === 1 ? "" : "s"} across all of them.`}
          </p>

          {projects.length > 0 && (
            <div className="dashboardActions">
              <Link to="/projects" className="viewProjectsLink">
                View my projects ({projects.length}) →
              </Link>
            </div>
          )}
        </section>

        {projects.length > 0 && (
          <section className="section">
            <h2 className="sectionTitle">Your projects</h2>
            <div className="projectList">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className="projectRow"
                >
                  <span className="projectRowName">{p.name}</span>
                  {p.description && (
                    <span className="projectRowDesc">{p.description}</span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <a href="https://github.com/FrozenProduction/task-manager" target="_blank" rel="noopener noreferrer" className="footerLink">
          View on GitHub
        </a>
      </footer>
    </div>
  );
}

