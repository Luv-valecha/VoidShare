"use client";

import Link from "next/link";
import { Zap, ScrollText, Github } from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function Header() {
  return (
    <header className="relative z-10 flex items-center justify-between gap-3 mb-6 sm:mb-10">
      {/* Logo */}
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="grid place-items-center w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-[image:linear-gradient(to_bottom_right,var(--c-accent-strong),var(--c-accent))]"
          style={{ boxShadow: "0 0 25px color-mix(in oklab, var(--c-accent) 55%, transparent)" }}
        >
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
        </span>

        <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-[var(--c-text)] truncate">
          Void<span className="text-[var(--c-accent)]">Share</span>
        </h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <ThemeSwitcher />

        <Link
          href="/devlogs"
          aria-label="DevLogs"
          className="inline-flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 text-xs font-medium text-[var(--c-text-muted)] bg-[var(--c-surface-2)]/70 border border-[var(--c-border-strong)] rounded-lg hover:border-[var(--c-accent)]/60 hover:text-[var(--c-text)] transition"
        >
          <ScrollText className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">DevLogs</span>
        </Link>

        <a
          href="https://github.com/Luv-valecha/VoidShare"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="inline-flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 text-xs font-medium text-[var(--c-text-muted)] bg-[var(--c-surface-2)]/70 border border-[var(--c-border-strong)] rounded-lg hover:border-[var(--c-border-strong)] hover:text-[var(--c-text)] transition"
        >
          <Github className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </div>
    </header>
  );
}
