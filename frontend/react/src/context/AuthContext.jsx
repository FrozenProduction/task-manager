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

  const logout = useCallback(() => {
    localStorage.removeItem("taskManagerToken");
    setUser(null);
  }, []);

  const value = { user, login, register, logout, isAuthenticated: !!user };
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

  const create = useCallback(async (title, description, status, projectId, assigneeId) => {
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
