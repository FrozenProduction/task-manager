import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProjects, useDeleteProject } from "../context/AuthContext";

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
      <div className="container">
        <div className="loading">Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="errorBox">
          <p>{error}</p>
          <button onClick={refresh} className="retryButton">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <div className="headerContent">
          <h1 className="title">My Projects</h1>
          <div className="userInfo">
            <span className="username">{user?.username}</span>
            <button onClick={logout} className="logoutButton">Sign out</button>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="toolbar">
          <button onClick={handleCreateProject} className="createButton">
            + New Project
          </button>
          {deleteConfirm && deleteTarget && (
            <div className="deleteDialog">
              <p>Delete project "{deleteTarget.name}"?</p>
              <div className="deleteActions">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="cancelButton"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="confirmDeleteButton"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="emptyState">
            <p className="emptyText">No projects yet.</p>
            <p className="emptyHint">Create your first project to get started.</p>
          </div>
        ) : (
          <div className="projectList">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="projectCard"
              >
                <div className="projectHeader">
                  <span className="projectName">
                    {project.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteTarget(project);
                      setDeleteConfirm(true);
                    }}
                    className="deleteProjectButton"
                    title="Delete project"
                  >
                    Delete
                  </button>
                </div>
                {project.description && (
                  <p className="projectDescription">{project.description}</p>
                )}
                <div className="projectMeta">
                  <span className="metaItem">Owner: {project.ownerUsername}</span>
                  <span className="metaItem">
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {deleteError && (
          <p className="error">{deleteError}</p>
        )}
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

