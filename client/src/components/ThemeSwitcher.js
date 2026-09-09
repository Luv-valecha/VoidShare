"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Palette } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export function ThemeSwitcher() {
  const { themeId, theme, themes, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Choose theme"
        title={`Theme: ${theme.name}`}
        className="inline-flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 text-xs font-medium text-[var(--c-text-muted)] bg-[var(--c-surface-2)]/70 border border-[var(--c-border-strong)] rounded-lg hover:border-[var(--c-accent)]/60 hover:text-[var(--c-text)] transition"
      >
        <Palette className="w-3.5 h-3.5 shrink-0" style={{ color: theme.swatch[0] }} />
        <span className="hidden sm:inline">{theme.name}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-72 max-h-[70vh] overflow-y-auto rounded-2xl border border-[var(--c-border-strong)] bg-[var(--c-surface)] shadow-2xl p-2"
        >
          <p className="px-2.5 py-2 text-[11px] uppercase tracking-wider text-[var(--c-text-dim)] font-semibold">
            Choose a theme
          </p>

          <div className="space-y-1">
            {themes.map((t) => {
              const active = t.id === themeId;
              return (
                <button
                  key={t.id}
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    setTheme(t.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${
                    active
                      ? "bg-[var(--c-accent)]/12 border border-[var(--c-accent)]/40"
                      : "border border-transparent hover:bg-[var(--c-surface-2)]/70"
                  }`}
                >
                  <span className="flex shrink-0 -space-x-1.5">
                    {t.swatch.map((c, i) => (
                      <span
                        key={i}
                        className="w-4 h-4 rounded-full border border-black/20 shadow-sm"
                        style={{ background: c }}
                      />
                    ))}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-[var(--c-text)] truncate">
                      {t.name}
                    </span>
                    <span className="block text-[11px] text-[var(--c-text-dim)] truncate">
                      {t.tagline}
                    </span>
                  </span>

                  {active && <Check className="w-4 h-4 shrink-0 text-[var(--c-accent)]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
