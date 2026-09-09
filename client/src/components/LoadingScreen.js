"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Radio, Server, Zap } from "lucide-react";

const STATUS_LINES = [
  "Nudging the signaling server awake…",
  "Free-tier servers nap when idle — knocking politely…",
  "Spinning up WebSocket listeners…",
  "Warming up the ICE negotiation lanes…",
  "Reticulating encrypted splines…",
  "Convincing the server it's still Tuesday…",
  "Almost there — shaking hands…",
];

const SLOW_MESSAGE_DELAY_MS = 7000;
const LINE_INTERVAL_MS = 2400;

export function LoadingScreen() {
  const [lineIndex, setLineIndex] = useState(0);
  const [showSlowNote, setShowSlowNote] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLineIndex((i) => (i + 1) % STATUS_LINES.length);
    }, LINE_INTERVAL_MS);
    const slowTimer = setTimeout(() => setShowSlowNote(true), SLOW_MESSAGE_DELAY_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(slowTimer);
    };
  }, []);

  const currentLine = useMemo(() => STATUS_LINES[lineIndex], [lineIndex]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[linear-gradient(160deg,var(--c-bg-from),var(--c-bg-to))] text-[var(--c-text)] z-50 px-6 text-center overflow-hidden">
      <div className="void-glow" />

      <div className="relative z-10 flex items-center gap-3 mb-2">
        <Zap className="w-8 h-8 sm:w-9 sm:h-9 text-[var(--c-accent)] animate-pulse" strokeWidth={2.5} />
        <h1 className="text-2xl sm:text-3xl font-bold tracking-wider text-[var(--c-accent)] drop-shadow-lg">
          VoidShare
        </h1>
      </div>
      <p className="relative z-10 text-xs uppercase tracking-[0.2em] text-[var(--c-text-dim)] mb-10">
        Waking the network
      </p>

      {/* Handshake visual: two counter-rotating rings, a "you" node, a "server"
          node, and a packet traveling between them along a motion path. */}
      <div className="relative z-10 w-56 h-56 sm:w-64 sm:h-64 mb-10">
        <svg viewBox="0 0 240 240" className="w-full h-full" aria-hidden="true">
          <circle
            cx="120"
            cy="120"
            r="100"
            fill="none"
            stroke="var(--c-border-strong)"
            strokeWidth="1"
            strokeDasharray="2 8"
            className="ls-orbit"
            style={{ transformOrigin: "120px 120px", animation: "ls-orbit 22s linear infinite" }}
          />
          <circle
            cx="120"
            cy="120"
            r="76"
            fill="none"
            stroke="var(--c-border-strong)"
            strokeWidth="1"
            strokeDasharray="1 6"
            className="ls-orbit-reverse"
            style={{ transformOrigin: "120px 120px", animation: "ls-orbit-reverse 16s linear infinite" }}
          />

          {/* Path the "packet" travels along, client -> server -> client */}
          <path
            id="ls-link-path"
            d="M 44 120 C 80 60, 160 60, 196 120 C 160 180, 80 180, 44 120 Z"
            fill="none"
            stroke="var(--c-accent2)"
            strokeOpacity="0.25"
            strokeWidth="1.5"
          />

          {/* Client node ("you") */}
          <g>
            <circle
              cx="44"
              cy="120"
              r="16"
              fill="var(--c-accent)"
              opacity="0.25"
              className="ls-node"
              style={{ transformOrigin: "44px 120px", animation: "ls-pulse 2.6s ease-in-out infinite" }}
            />
            <circle cx="44" cy="120" r="8" fill="var(--c-accent)" />
          </g>

          {/* Server node */}
          <g>
            <circle
              cx="196"
              cy="120"
              r="16"
              fill="var(--c-accent2)"
              opacity="0.25"
              className="ls-node"
              style={{
                transformOrigin: "196px 120px",
                animation: "ls-pulse 2.6s ease-in-out infinite",
                animationDelay: "0.6s",
              }}
            />
            <circle cx="196" cy="120" r="8" fill="var(--c-accent2)" />
          </g>

          {/* Traveling packet, riding the motion path */}
          <circle
            r="4.5"
            fill="var(--c-text)"
            className="ls-packet"
            style={{
              offsetPath: "path('M 44 120 C 80 60, 160 60, 196 120 C 160 180, 80 180, 44 120 Z')",
              animation: "ls-packet 3.2s ease-in-out infinite",
            }}
          />
        </svg>

        {/* Center icon */}
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="w-11 h-11 rounded-2xl bg-[var(--c-surface)]/80 border border-[var(--c-border-strong)] backdrop-blur grid place-items-center shadow-lg">
            <Server className="w-5 h-5 text-[var(--c-text-muted)]" />
          </div>
        </div>
      </div>

      {/* Rotating status line */}
      <div className="relative z-10 h-6 mb-6">
        <p key={lineIndex} className="text-sm text-[var(--c-text-muted)]" style={{ animation: "ls-fade-up 0.4s ease" }}>
          {currentLine}
        </p>
      </div>

      {/* Indeterminate progress rail */}
      <div className="relative z-10 w-56 sm:w-64 h-1.5 rounded-full bg-[var(--c-surface-2)] overflow-hidden mb-8">
        <div
          className="h-full w-1/3 rounded-full bg-[image:linear-gradient(to_right,transparent,var(--c-accent),var(--c-accent2),transparent)]"
          style={{ animation: "ls-shimmer 1.6s ease-in-out infinite" }}
        />
      </div>

      {/* Optional "why am I seeing this" — small bit of interactivity beyond
          pure animation, explains the free-tier cold start without being
          intrusive. */}
      <div className="relative z-10 w-full max-w-xs">
        <button
          type="button"
          onClick={() => setInfoOpen((v) => !v)}
          aria-expanded={infoOpen}
          className="mx-auto flex items-center gap-1.5 text-[11px] text-[var(--c-text-dim)] hover:text-[var(--c-text-muted)] transition"
        >
          <Radio className="w-3 h-3" />
          Why is this taking a moment?
          <ChevronDown className={`w-3 h-3 transition-transform ${infoOpen ? "rotate-180" : ""}`} />
        </button>

        {infoOpen && (
          <p
            className="mt-3 text-[11px] leading-relaxed text-[var(--c-text-dim)] glass-card rounded-xl p-3"
            style={{ animation: "ls-fade-up 0.3s ease" }}
          >
            VoidShare&rsquo;s signaling server runs on a free hosting tier that falls
            asleep after a period of inactivity. This screen is pinging it
            awake — it usually takes just a few seconds, occasionally up to
            about a minute on a true cold start. Nothing is broken, and no
            files are ever routed through this server &mdash; it only helps
            two browsers find each other.
          </p>
        )}

        {showSlowNote && (
          <p
            className="mt-3 text-[11px] text-amber-400/90"
            style={{ animation: "ls-fade-up 0.4s ease" }}
          >
            Still going — this is a genuine cold start, hang tight a little longer.
          </p>
        )}
      </div>
    </div>
  );
}
