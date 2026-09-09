"use client";

import { Download, FileUp, Loader2, Lock } from "lucide-react";
import { ProgressBar } from "./ProgressBar";

// NOTE on the ellipsis characters below: JSX does NOT decode JS-style
// "\u2026" escapes in plain text — neither in attribute string literals
// (label="Sending\u2026") nor in raw JSX children (Sending\u2026 without
// braces). Both used to leak the literal six characters \u2026 onto the
// screen. The fix is to use the real ellipsis glyph (…) directly in the
// source, or wrap an escape in a JS expression like {"\u2026"} instead.

export function FileTransferPanel({
  connected,
  keysReady,
  selectedFile,
  setSelectedFile,
  encrypting,
  isSending,
  isReceiving,
  sendingProgress,
  receivingProgress,
  receivedChunks,
  onSend,
  onDownload,
}) {
  return (
    <div className="glass-card rounded-2xl p-5 shadow-lg space-y-4">
      <label className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-dashed border-[var(--c-border-strong)] bg-[var(--c-surface-2)]/50 cursor-pointer hover:border-[var(--c-accent)]/60 transition">
        <span className="flex items-center gap-2 text-sm text-[var(--c-text-muted)] truncate">
          <FileUp className="w-4 h-4 text-[var(--c-text-dim)] shrink-0" />
          <span className="truncate">{selectedFile ? selectedFile.name : "Choose a file to send"}</span>
        </span>
        <span className="text-xs font-semibold text-white bg-[image:linear-gradient(to_right,var(--c-accent),var(--c-accent2))] px-3 py-1.5 rounded-lg shrink-0">
          Browse
        </span>
        <input
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) setSelectedFile(file);
          }}
        />
      </label>

      {selectedFile && connected && !isSending && (
        <button
          onClick={onSend}
          disabled={encrypting || !keysReady}
          className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl shadow-md transition font-medium text-sm"
        >
          {encrypting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Encrypting…
            </>
          ) : !keysReady ? (
            <>
              <Lock className="w-4 h-4" /> Waiting for secure channel…
            </>
          ) : (
            <>
              <FileUp className="w-4 h-4" /> Send File
            </>
          )}
        </button>
      )}

      {isSending && (
        <ProgressBar
          percent={sendingProgress}
          label="Sending…"
          colorClass="bg-[image:linear-gradient(to_right,var(--c-accent-soft),var(--c-accent),var(--c-accent-strong))]"
        />
      )}

      {isReceiving && (
        <ProgressBar
          percent={receivingProgress}
          label="Receiving…"
          colorClass="bg-[image:linear-gradient(to_right,var(--c-accent2-soft),var(--c-accent2),var(--c-accent2-strong))]"
        />
      )}

      {receivedChunks.length > 0 && !isReceiving && (
        <button
          onClick={onDownload}
          className="w-full inline-flex items-center justify-center gap-2 text-white bg-[image:linear-gradient(to_bottom_right,var(--c-accent2-strong),var(--c-accent),var(--c-accent2-strong))] px-4 py-2.5 rounded-xl hover:shadow-xl transition duration-300 font-medium text-sm"
        >
          <Download className="w-4 h-4" />
          Download Received File
        </button>
      )}
    </div>
  );
}
