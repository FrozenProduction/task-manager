import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "taskManagerTheme";
const VALID = new Set(["light", "dark"]);

// Read the effective theme:
// 1. localStorage override (if set)
// 2. otherwise, system preference via prefers-color-scheme
function readInitial() {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

function applyToDocument(theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  // Helps any UA-level form controls (e.g., scrollbars, native inputs) match
  document.documentElement.style.colorScheme = theme;
}

// Reads + applies the theme. Returns [theme, setTheme, toggle].
// theme is "light" | "dark". setTheme persists the choice.
export function useTheme() {
  const [theme, setThemeState] = useState(readInitial);

  // Apply on mount + on every change. Run on first render so the page never flashes light.
  useEffect(() => {
    applyToDocument(theme);
  }, [theme]);

  // Re-sync if the user hasn't picked a manual override and the OS theme changes.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return; // user override — don't auto-switch
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = mq.matches ? "dark" : "light";
      setThemeState(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((next) => {
    if (!VALID.has(next)) return;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return [theme, setTheme, toggle];
}