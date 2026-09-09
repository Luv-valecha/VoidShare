"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function PeerIdCard({ myId }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(myId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card rounded-2xl p-5 shadow-lg">
      <p className="text-[11px] uppercase tracking-wider text-[var(--c-text-dim)] font-medium">
        Your Peer ID
      </p>
      <div className="flex items-center justify-between gap-3 mt-2">
        <p className="text-[var(--c-accent2)] text-sm break-all font-mono">{myId || "\u2014"}</p>
        <button
          onClick={copy}
          disabled={!myId}
          className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[image:linear-gradient(to_right,var(--c-accent2-strong),var(--c-accent2))] disabled:opacity-50 px-3 py-1.5 rounded-lg hover:opacity-90 transition shadow-sm"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
