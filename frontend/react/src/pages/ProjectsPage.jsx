import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProjects, useDeleteProject } from "../context/AuthContext";

const Icon = ({ name }) => {
  const icons = {
    plus: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
    folder: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
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
    folderPlus: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
        <path d="M12 11v4M10 13h4" />
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

export default function ProjectsPage() {
  const { user, logout } = useAuth();
  const { projects, loading, error, refresh } = useProjects();
  const navigate = useNavigate();
  const { remove: deleteProject, deleting, error: deleteError } = useDeleteProject();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProject(deleteTarget.id);
      await refresh();
    } catch {
      // Error handled by hook
    } finally {
      setDeleteTarget(null);
      setDeleteConfirm(false);
    }
  };

  const handleCreateProject = () => {
    // Redirect to dashboard to create
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="container-full">
        <div className="loading">Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-full">
        <div className="error-box">
          <p>{error}</p>
          <button onClick={refresh} className="retry-button">
            <Icon name="refresh" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-full">
      <header className="header">
        <div className="header-content">
          <h1 className="title">
            <span className="title-icon"><Icon name="logo" /></span>
            My Projects
          </h1>
          <div className="user-info">
            <span className="username">{user?.username}</span>
            <button onClick={logout} className="logout-button">Sign out</button>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="section-header">
          <h2 className="section-title">All projects</h2>
          <button onClick={handleCreateProject} className="create-button">
            <Icon name="plus" /> New Project
          </button>
        </div>

        {deleteConfirm && deleteTarget && (
          <div className="overlay">
            <div className="dialog">
              <p className="dialog-title">Delete project?</p>
              <p className="dialog-body">
                "{deleteTarget.name}" will be permanently removed. This action cannot be undone.
              </p>
              <div className="dialog-actions">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="confirm-delete-button"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteError && (
          <p className="error">{deleteError}</p>
        )}

        {projects.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon"><Icon name="folderPlus" /></span>
            <p className="empty-state-text">No projects yet</p>
            <p className="empty-state-hint">
              Head to the dashboard to create your first project.
            </p>
          </div>
        ) : (
          <div className="project-list-block">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="project-card-block"
              >
                <div className="project-card-block-head">
                  <span className="project-card-block-name">
                    <span className="project-card-icon"><Icon name="folder" /></span>
                    {project.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteTarget(project);
                      setDeleteConfirm(true);
                    }}
                    className="delete-project-button"
                    title="Delete project"
                  >
                    Delete
                  </button>
                </div>
                {project.description && (
                  <p className="project-card-block-desc">{project.description}</p>
                )}
                <div className="project-card-block-meta">
                  <span className="meta-item">
                    <Icon name="user" /> {project.ownerUsername}
                  </span>
                  <span className="meta-item">
                    <Icon name="calendar" />
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
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