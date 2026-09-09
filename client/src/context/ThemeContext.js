"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { THEMES, DEFAULT_THEME, THEME_STORAGE_KEY } from "@/data/themes";

const ThemeContext = createContext(null);

/**
 * Applies `data-theme="<id>"` to <html> and mirrors the choice into
 * localStorage so it survives reloads. A tiny inline script in layout.js
 * sets the attribute before React hydrates (see the `<head>` snippet there),
 * so there's no flash of the wrong theme — this provider just keeps state
 * and React in sync with whatever that script already applied.
 */
export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(DEFAULT_THEME);

  useEffect(() => {
    let stored = null;
    try {
      stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      /* localStorage unavailable (private mode, etc.) — fall back to default */
    }
    const valid = THEMES.some((t) => t.id === stored);
    setThemeId(valid ? stored : DEFAULT_THEME);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeId);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeId);
    } catch {
      /* ignore write failures */
    }
  }, [themeId]);

  const setTheme = useCallback((id) => {
    if (!THEMES.some((t) => t.id === id)) return;
    setThemeId(id);
  }, []);

  const value = useMemo(
    () => ({
      themeId,
      theme: THEMES.find((t) => t.id === themeId) || THEMES[0],
      themes: THEMES,
      setTheme,
    }),
    [themeId, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
