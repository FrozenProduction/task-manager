import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useProjects } from "../context/AuthContext";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Modal from "../components/Modal";
import CreateProjectForm from "../components/CreateProjectForm";

// Page-specific icons (header ones live in <Header>)
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
    folderPlus: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
        <path d="M12 11v4M10 13h4" />
      </svg>
    ),
  };
  return icons[name] || null;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { projects, loading: projectsLoading, error: projectsError, refresh: refreshProjects } = useProjects();
  const [stats, setStats] = useState({ total: 0, todo: 0, inProgress: 0, done: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // Fetch dashboard task counts from the cheap /stats endpoint. Single
  // round-trip, one DB query — replaces walking every project's tasks.
  const fetchStats = useCallback(async () => {
    const token = localStorage.getItem("taskManagerToken");
    const API_BASE = import.meta.env?.VITE_API_URL || "http://localhost:8080";
    setStatsLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/tasks/stats`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (r.ok) {
        const data = await r.json();
        setStats({
          total: data.total ?? 0,
          todo: data.todo ?? 0,
          inProgress: data.inProgress ?? 0,
          done: data.done ?? 0,
        });
      } else {
        setStats({ total: 0, todo: 0, inProgress: 0, done: 0 });
      }
    } catch {
      setStats({ total: 0, todo: 0, inProgress: 0, done: 0 });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, projects]);

  // Refresh stats when the page becomes visible again — covers the
  // "I changed a task in /projects/:id then came back here" case.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") fetchStats();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [fetchStats]);

  const handleCreated = async (project) => {
    setCreateOpen(false);
    await refreshProjects();
    navigate(`/projects/${project.id}`, { replace: true });
  };

  void user;

  return (
    <div className="container-full">
      <Header title="Dashboard" />

      <main className="main">
        <section className="section section--hero">
          <div className="section-header">
            <h2 className="section-title">Quick stats</h2>
          </div>
          {projectsError ? (
            <p className="error">Could not load stats: {projectsError}</p>
          ) : (projects.length === 0 ? (
            <div className="empty-state empty-state--hero">
              <span className="empty-state-icon"><Icon name="folderPlus" /></span>
              <h3 className="empty-state-title">No projects yet</h3>
              <p className="empty-state-text">Create your first project to start tracking tasks and progress.</p>
            </div>
          ) : (
            <>
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
                  <span className="stat-trend">
                    {stats.done} done · {stats.todo} to do
                  </span>
                </div>
                <span className="stat-value">
                  {statsLoading ? "…" : stats.total}
                </span>
                <span className="stat-label">Tasks</span>
              </div>
            </div>
            {projects.length > 0 && (
              <div className="dashboard-actions">
                <Link to="/projects" className="view-projects-link">
                  View my projects ({projects.length}) <Icon name="arrow-right" />
                </Link>
              </div>
            )}
            </>

          ))}
        </section>

        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Create new project</h2>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="create-button"
            >
              <Icon name="plus" /> New project
            </button>
          </div>
          <p className="hint">
            Group related tasks, track their status, and attach reference links.
          </p>
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

      <Footer />

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create new project"
        dismissible={false}
      >
        <CreateProjectForm
          onCancel={() => setCreateOpen(false)}
          onCreated={handleCreated}
        />
      </Modal>
    </div>
  );
}
