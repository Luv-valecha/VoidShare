"use client";

import Link from "next/link";
import { Zap, ScrollText, Github } from "lucide-react";

export function Header() {
  return (
    <header className="relative z-10 flex items-center justify-between gap-3 mb-6 sm:mb-10">
      {/* Logo */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="grid place-items-center w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-gradient-to-br from-red-600 to-red-500 shadow-[0_0_25px_rgba(239,68,68,0.55)]">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
        </span>

        <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-white truncate">
          Void<span className="text-red-500">Share</span>
        </h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <Link
          href="/devlogs"
          aria-label="DevLogs"
          className="inline-flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 text-xs font-medium text-zinc-300 bg-zinc-900/70 border border-zinc-800 rounded-lg hover:border-red-500/60 hover:text-white transition"
        >
          <ScrollText className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">DevLogs</span>
        </Link>

        <a
          href="https://github.com/Luv-valecha/VoidShare"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="inline-flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 text-xs font-medium text-zinc-300 bg-zinc-900/70 border border-zinc-800 rounded-lg hover:border-zinc-600 hover:text-white transition"
        >
          <Github className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </div>
    </header>
  );
}