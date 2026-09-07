"use client";

export function ProgressBar({ percent, label, colorClass }) {
  return (
    <div>
      <div className="w-full bg-zinc-800/80 rounded-full h-2.5 overflow-hidden shadow-inner">
        <div
          className={`h-2.5 rounded-full transition-all duration-150 ${colorClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-zinc-400 mt-1.5">
        {label} {Math.floor(percent)}%
      </p>
    </div>
  );
}
