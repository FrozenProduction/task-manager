import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await register(username, email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>Join Task Manager</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              placeholder="Choose a username"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="your@email.com"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="At least 6 characters"
              required
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            disabled={loading || !username || !email || !password}
            style={styles.button}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p style={styles.link}>
          Already have an account?{" "}
          <Link to="/login" style={styles.linkText}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  card: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "400px",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: "600",
    marginBottom: "0.25rem",
    color: "#1a1a1a",
  },
  subtitle: {
    color: "#666",
    marginBottom: "1.5rem",
    fontSize: "0.9rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
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
    marginTop: "0.5rem",
  },
  error: {
    color: "#dc2626",
    fontSize: "0.85rem",
    margin: 0,
  },
  link: {
    marginTop: "1rem",
    textAlign: "center",
    color: "#666",
    fontSize: "0.85rem",
  },
  linkText: {
    color: "#4f46e5",
    textDecoration: "none",
    fontWeight: "500",
  },
};
