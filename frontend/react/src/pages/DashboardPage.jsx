import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCreateProject } from "../context/AuthContext";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { create, creating, error: createError } = useCreateProject();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const project = await create(name.trim(), description.trim());
      navigate(`/projects/${project.id}`, { replace: true });
      setName("");
      setDescription("");
    } catch {
      // Error is handled by the hook
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Dashboard</h1>
          <div style={styles.userInfo}>
            <span style={styles.username}>{user?.username}</span>
            <button onClick={logout} style={styles.logoutButton}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Create new project</h2>
          <form onSubmit={handleCreate} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Project name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                placeholder="e.g., Website redesign"
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={styles.input}
                placeholder="Brief description"
              />
            </div>
            {createError && <p style={styles.error}>{createError}</p>}
            <button
              type="submit"
              disabled={creating || !name.trim()}
              style={styles.button}
            >
              {creating ? "Creating..." : "Create Project"}
            </button>
          </form>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Quick stats</h2>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <span style={styles.statValue}>0</span>
              <span style={styles.statLabel}>Projects</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statValue}>0</span>
              <span style={styles.statLabel}>Tasks</span>
            </div>
          </div>
          <p style={styles.hint}>
            Create your first project to see stats here.
          </p>
        </section>
      </main>

      <footer style={styles.footer}>
        <a href="https://github.com/FrozenProduction/task-manager" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>
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
  header: {
    backgroundColor: "white",
    borderBottom: "1px solid #e5e7eb",
    padding: "1rem 2rem",
  },
  headerContent: {
    maxWidth: "800px",
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
    maxWidth: "800px",
    width: "100%",
    margin: "0 auto",
    padding: "2rem",
  },
  section: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "1.5rem",
    marginBottom: "1.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: "1rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: "500",
    color: "#333",
  },
  input: {
    padding: "0.5rem 0.75rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "1rem",
  },
  button: {
    padding: "0.6rem",
    backgroundColor: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer",
    alignSelf: "flex-start",
  },
  error: {
    color: "#dc2626",
    fontSize: "0.85rem",
    margin: 0,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1rem",
    marginBottom: "1rem",
  },
  statCard: {
    backgroundColor: "#f9fafb",
    borderRadius: "6px",
    padding: "1rem",
    textAlign: "center",
  },
  statValue: {
    display: "block",
    fontSize: "2rem",
    fontWeight: "700",
    color: "#4f46e5",
    marginBottom: "0.25rem",
  },
  statLabel: {
    color: "#666",
    fontSize: "0.85rem",
  },
  hint: {
    color: "#999",
    fontSize: "0.85rem",
    textAlign: "center",
    margin: 0,
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
