import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProjects, useDeleteProject, useAllTasks } from "../context/AuthContext";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Modal from "../components/Modal";
import CreateProjectForm from "../components/CreateProjectForm";
import { formatDate } from "../utils/format";

// Page-specific icons (header ones live in <Header>)
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
    trash: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6" />
      </svg>
    ),
  };
  return icons[name] || null;
};

export default function ProjectsPage() {
  const { user, logout } = useAuth();
  const { projects, loading, error, refresh } = useProjects();
  const navigate = useNavigate();
  const allTasks = useAllTasks();
  const taskCounts = useMemo(() => {
    const map = {};
    for (const t of allTasks) {
      const pid = t.projectId;
      if (pid == null) continue;
      if (!map[pid]) map[pid] = { total: 0, done: 0 };
      map[pid].total += 1;
      if (t.status === "DONE") map[pid].done += 1;
    }
    return map;
  }, [allTasks]);
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

  const [createOpen, setCreateOpen] = useState(false);

  const handleCreated = async (project) => {
    setCreateOpen(false);
    await refresh();
    navigate(`/projects/${project.id}`, { replace: true });
  };

  if (loading) {
    return (
      <div className="container-full">
        <Header title="My Projects" />
        <div className="loading">Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-full">
        <Header title="My Projects" />
        <div className="error-box">
          <p>{error}</p>
          <button onClick={refresh} className="retry-button">
            <Icon name="refresh" /> Retry
          </button>
        </div>
      </div>
    );
  }

  // `user`/`logout` are read by <Header>; reference keeps destructuring future-proof.
  void user; void logout;

  return (
    <div className="container-full">
      <Header title="My Projects" />

      <main className="main">
        <div className="section-header">
          <h2 className="section-title">All projects</h2>
          <button onClick={() => setCreateOpen(true)} className="create-button">
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
                    className="icon-button"
                    title="Delete project"
                    aria-label={`Delete project ${project.name}`}
                  >
                    <Icon name="trash" />
                  </button>
                </div>
                {project.description && (
                  <p className="project-card-block-desc">{project.description}</p>
                )}
                <div className="project-card-block-meta">
                  {taskCounts[project.id] && (
                    <span className="meta-item meta-tasks">
                      {taskCounts[project.id].total} task{taskCounts[project.id].total === 1 ? "" : "s"} · {taskCounts[project.id].done} done
                    </span>
                  )}
                  <span className="meta-item">
                    <Icon name="calendar" />
                    Created {formatDate(project.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
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
