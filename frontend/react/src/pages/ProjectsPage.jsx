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
      <div style={styles.container}>
        <div style={styles.loading}>Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>
          <p>{error}</p>
          <button onClick={refresh} style={styles.retryButton}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>My Projects</h1>
          <div style={styles.userInfo}>
            <span style={styles.username}>{user?.username}</span>
            <button onClick={logout} style={styles.logoutButton}>Sign out</button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.toolbar}>
          <button onClick={handleCreateProject} style={styles.createButton}>
            + New Project
          </button>
          {deleteConfirm && deleteTarget && (
            <div style={styles.deleteDialog}>
              <p>Delete project "{deleteTarget.name}"?</p>
              <div style={styles.deleteActions}>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={styles.confirmDeleteButton}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          )}
        </div>

        {projects.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No projects yet.</p>
            <p style={styles.emptyHint}>Create your first project to get started.</p>
          </div>
        ) : (
          <div style={styles.projectList}>
            {projects.map((project) => (
              <div
                key={project.id}
                style={styles.projectCard}
                onDoubleClick={() => navigate(`/projects/${project.id}`)}
              >
                <div style={styles.projectHeader}>
                  <Link to={`/projects/${project.id}`} style={styles.projectName}>
                    {project.name}
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(project);
                      setDeleteConfirm(true);
                    }}
                    style={styles.deleteProjectButton}
                    title="Delete project"
                  >
                    Delete
                  </button>
                </div>
                {project.description && (
                  <p style={styles.projectDescription}>{project.description}</p>
                )}
                <div style={styles.projectMeta}>
                  <span style={styles.metaItem}>Owner: {project.ownerUsername}</span>
                  <span style={styles.metaItem}>
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {deleteError && (
          <p style={styles.error}>{deleteError}</p>
        )}
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
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "60vh",
    color: "#666",
  },
  errorBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "60vh",
    backgroundColor: "white",
    padding: "2rem",
    textAlign: "center",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  retryButton: {
    marginTop: "1rem",
    padding: "0.5rem 1rem",
    backgroundColor: "#4f46e5",
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
  },
  title: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#1a1a1a",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
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
  main: {
    flex: 1,
    maxWidth: "900px",
    width: "100%",
    margin: "0 auto",
    padding: "2rem",
  },
  toolbar: {
    marginBottom: "1.5rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  createButton: {
    padding: "0.6rem 1rem",
    backgroundColor: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.95rem",
    fontWeight: "500",
    cursor: "pointer",
  },
  deleteDialog: {
    marginTop: "1rem",
    padding: "1rem",
    backgroundColor: "#fef2f2",
    border: "1px solid #fca5a5",
    borderRadius: "6px",
    maxWidth: "400px",
  },
  deleteActions: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "0.75rem",
    justifyContent: "flex-end",
  },
  cancelButton: {
    padding: "0.4rem 0.75rem",
    backgroundColor: "white",
    border: "1px solid #ddd",
    borderRadius: "4px",
    cursor: "pointer",
  },
  confirmDeleteButton: {
    padding: "0.4rem 0.75rem",
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  emptyState: {
    textAlign: "center",
    padding: "3rem",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  emptyText: {
    fontSize: "1.1rem",
    color: "#333",
    marginBottom: "0.5rem",
  },
  emptyHint: {
    color: "#999",
    fontSize: "0.9rem",
  },
  projectList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  projectCard: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "1rem",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    border: "1px solid #e5e7eb",
    transition: "border-color 0.1s",
  },
  projectHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
  },
  projectName: {
    fontSize: "1.05rem",
    fontWeight: "600",
    color: "#1a1a1a",
    textDecoration: "none",
  },
  deleteProjectButton: {
    background: "none",
    border: "1px solid #fca5a5",
    borderRadius: "4px",
    padding: "0.25rem 0.5rem",
    fontSize: "0.75rem",
    color: "#dc2626",
    cursor: "pointer",
  },
  projectDescription: {
    color: "#666",
    fontSize: "0.9rem",
    margin: "0 0 0.5rem 0",
  },
  projectMeta: {
    display: "flex",
    gap: "1rem",
    fontSize: "0.8rem",
    color: "#999",
  },
  metaItem: {
    fontSize: "0.8rem",
  },
  error: {
    color: "#dc2626",
    fontSize: "0.85rem",
    marginTop: "0.5rem",
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
