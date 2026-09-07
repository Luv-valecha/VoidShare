"use client";

import { Download, FileUp, Loader2, Lock } from "lucide-react";
import { ProgressBar } from "./ProgressBar";

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
      <label className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 cursor-pointer hover:border-red-500/60 transition">
        <span className="flex items-center gap-2 text-sm text-zinc-300 truncate">
          <FileUp className="w-4 h-4 text-zinc-500 shrink-0" />
          <span className="truncate">{selectedFile ? selectedFile.name : "Choose a file to send"}</span>
        </span>
        <span className="text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-blue-700 px-3 py-1.5 rounded-lg shrink-0">
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
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl shadow-md transition font-medium text-sm"
        >
          {encrypting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Encrypting{"\u2026"}
            </>
          ) : !keysReady ? (
            <>
              <Lock className="w-4 h-4" /> Waiting for secure channel{"\u2026"}
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
          label="Sending\u2026"
          colorClass="bg-gradient-to-r from-red-500 via-orange-500 to-red-700"
        />
      )}

      {isReceiving && (
        <ProgressBar
          percent={receivingProgress}
          label="Receiving\u2026"
          colorClass="bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-700"
        />
      )}

      {receivedChunks.length > 0 && !isReceiving && (
        <button
          onClick={onDownload}
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-br from-blue-700 via-red-600 to-blue-900 px-4 py-2.5 rounded-xl hover:shadow-xl transition duration-300 font-medium text-sm"
        >
          <Download className="w-4 h-4" />
          Download Received File
        </button>
      )}
    </div>
  );
}
