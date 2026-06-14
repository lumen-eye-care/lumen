"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

/**
 * Theme system for Lumen — light "cinematic cream" (default) and dark
 * "cinematic navy". The palette swap is pure CSS: this provider only toggles
 * the `data-theme` attribute on <html> and persists the choice.
 *
 * The current theme is read with useSyncExternalStore directly off the DOM
 * attribute (the external store), so there is no setState-in-effect and no
 * hydration mismatch — THEME_SCRIPT sets the attribute before first paint and
 * a MutationObserver keeps React in sync after toggles.
 */

export type Theme = "light" | "dark";

const STORAGE_KEY = "lumen.theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

// SSR + first client render assume light (THEME_SCRIPT corrects the DOM before
// paint; useSyncExternalStore re-reads on mount without a hydration error).
function getServerSnapshot(): Theme {
  return "light";
}

function applyTheme(next: Theme) {
  const root = document.documentElement;
  const body = document.body;
  // Brief cross-fade window, then remove so normal interaction isn't globally
  // transitioned (and initial load never animates).
  body.classList.add("lm-transitioning");
  root.setAttribute("data-theme", next);
  window.setTimeout(() => body.classList.remove("lm-transitioning"), 320);
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Private mode / storage disabled — runtime state still works.
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setTheme = useCallback((next: Theme) => applyTheme(next), []);
  const toggle = useCallback(
    () => applyTheme(getSnapshot() === "dark" ? "light" : "dark"),
    [],
  );

  const value = useMemo(
    () => ({ theme, setTheme, toggle }),
    [theme, setTheme, toggle],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within <ThemeProvider>");
  }
  return ctx;
}

/**
 * Inline script injected before <body> renders. Resolves the saved theme (or
 * system preference) and sets data-theme synchronously so the first paint is
 * already correct — no flash of the wrong palette.
 */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;
