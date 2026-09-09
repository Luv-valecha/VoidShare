"use client";

export function ProgressBar({ percent, label, colorClass }) {
  return (
    <div>
      <div className="w-full bg-[var(--c-surface-2)]/80 rounded-full h-2.5 overflow-hidden shadow-inner">
        <div
          className={`h-2.5 rounded-full transition-all duration-150 ${colorClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-[var(--c-text-muted)] mt-1.5">
        {label} {Math.floor(percent)}%
      </p>
    </div>
  );
}
