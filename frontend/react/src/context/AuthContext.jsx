import { createContext, useContext, useState, useCallback, useEffect } from "react";

const API_BASE = import.meta.env?.VITE_API_URL || "http://localhost:8080";

function getAuthHeaders() {
  const stored = localStorage.getItem("taskManagerToken");
  const headers = { "Content-Type": "application/json" };
  if (stored) {
    headers["Authorization"] = `Bearer ${stored}`;
  }
  return headers;
}

async function apiFetch(path, options = {}) {
  const headers = { ...getAuthHeaders(), ...options.headers };
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (response.status === 401) {
    logout();
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(errorBody || `Request failed with status ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return null;
}

function useAuthContext() {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return auth;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("taskManagerToken");
    if (stored) {
      try {
        const decoded = JSON.parse(atob(stored.split(".")[1]));
        return { username: decoded.sub, email: decoded.email || "" };
      } catch {
        return null;
      }
    }
    return null;
  });

  // Fetch the full profile (id, username, email, createdAt) once on mount
  // if a token exists. This guarantees username/email are current after a
  // profile edit even if the user navigated before refresh.
  useEffect(() => {
    const token = localStorage.getItem("taskManagerToken");
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) return;
        const profile = await r.json();
        if (cancelled) return;
        setUser({ id: profile.id, username: profile.username, email: profile.email });
      } catch {
        // offline / server down — keep the JWT-derived identity
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (username, password) => {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => "");
      throw new Error(error || "Login failed");
    }

    const data = await response.json();
    localStorage.setItem("taskManagerToken", data.token);
    setUser({ username: data.username, email: data.email || "" });
    return data;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => "");
      throw new Error(error || "Registration failed");
    }

    const data = await response.json();
    localStorage.setItem("taskManagerToken", data.token);
    setUser({ username: data.username, email: data.email || "" });
    return data;
  }, []);

  /**
   * Update the current user's profile (username/email/password).
   * Backend requires currentPassword. On success, the new JWT replaces
   * the one in localStorage and `user` is updated.
   */
  const updateProfile = useCallback(async (changes) => {
    // Route through apiFetch so 401s auto-logout (consistent with the rest of the app)
    // and so the same error path is used.
    const data = await apiFetch("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify(changes),
    });
    if (data && data.token) {
      localStorage.setItem("taskManagerToken", data.token);
    }
    if (data && data.username) {
      setUser({ username: data.username, email: data.email || "" });
    }
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("taskManagerToken");
    setUser(null);
  }, []);

  const value = { user, login, register, logout, updateProfile, isAuthenticated: !!user };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const AuthContext = createContext(null);

export function useAuth() {
  return useAuthContext();
}

// Helper hooks for API calls
export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/projects");
      setProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem("taskManagerToken")) {
      fetchProjects();
    }
  }, [fetchProjects]);

  return { projects, loading, error, refresh: fetchProjects };
}

export function useTasks(projectId) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/api/tasks/project/${projectId}`);
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { tasks, loading, error, refresh: fetchTasks };
}

// All tasks across the user's projects in one call — used for per-project
// counts without N+1 requests. Returns [] (no throw) when the endpoint
// is unreachable so count badges simply hide.
export function useAllTasks() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch("/api/tasks/mine");
        if (!cancelled && Array.isArray(data)) setTasks(data);
      } catch {
        // Non-fatal: cards render without counts.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return tasks;
}

export function useCreateProject() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (name, description) => {
    setCreating(true);
    setError(null);
    try {
      const data = await apiFetch("/api/projects", {
        method: "POST",
        body: JSON.stringify({ name, description }),
      });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setCreating(false);
    }
  }, []);

  return { creating, error, create };
}

export function useCreateTask() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (title, description, status, projectId, assigneeId, linkLoggerLinkId) => {
    setCreating(true);
    setError(null);
    try {
      const data = await apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          status: status || "TODO",
          projectId,
          assigneeId: assigneeId || null,
          // Link-Logger integration: optional. When present, the backend
          // fetches the link from Link Logger and snapshots its data.
          linkLoggerLinkId: linkLoggerLinkId || null,
        }),
      });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setCreating(false);
    }
  }, []);

  return { creating, error, create };
}

export function useUpdateTask() {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  const update = useCallback(async (taskId, updates) => {
    setUpdating(true);
    setError(null);
    try {
      const data = await apiFetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  return { updating, error, update };
}

export function useDeleteTask() {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const remove = useCallback(async (taskId) => {
    setDeleting(true);
    setError(null);
    try {
      await apiFetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setDeleting(false);
    }
  }, []);

  return { deleting, error, remove };
}

export function useDeleteProject() {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const remove = useCallback(async (projectId) => {
    setDeleting(true);
    setError(null);
    try {
      await apiFetch(`/api/projects/${projectId}`, { method: "DELETE" });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setDeleting(false);
    }
  }, []);

  return { deleting, error, remove };
}
