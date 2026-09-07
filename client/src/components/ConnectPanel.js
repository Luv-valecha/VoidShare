"use client";

import { KeyRound, Loader2, Plug, PlugZap, ShieldCheck } from "lucide-react";

export function ConnectPanel({
  friendId,
  setFriendId,
  connected,
  channelOpen,
  keysReady,
  onConnect,
  onDisconnect,
}) {
  return (
    <div className="glass-card w-full rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          placeholder="Enter friend's Peer ID"
          value={friendId}
          onChange={(e) => setFriendId(e.target.value)}
          disabled={connected}
          className="w-full min-w-0 flex-1 px-4 py-3 sm:py-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-600/70 disabled:opacity-50 transition text-sm sm:text-base"
        />

        {!connected ? (
          <button
            onClick={onConnect}
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white px-5 py-3 sm:py-2.5 rounded-xl shadow-md transition font-medium text-sm"
          >
            <Plug className="w-4 h-4" />
            Connect
          </button>
        ) : (
          <button
            onClick={onDisconnect}
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 bg-zinc-800 hover:bg-red-700 text-white px-5 py-3 sm:py-2.5 rounded-xl shadow-md transition font-medium text-sm"
          >
            <PlugZap className="w-4 h-4" />
            Disconnect
          </button>
        )}
      </div>

      {connected && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <StatusPill ok label="Connected" />

          <StatusPill
            ok={channelOpen}
            label="Channel open"
            pending={!channelOpen}
          />

          <StatusPill
            ok={keysReady}
            label={keysReady ? "Secure channel ready" : "Exchanging keys…"}
            pending={!keysReady}
            icon={keysReady ? ShieldCheck : KeyRound}
          />
        </div>
      )}
    </div>
  );
}

function StatusPill({ ok, pending, label, icon: Icon }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border ${
        ok
          ? "bg-emerald-500/10 border-emerald-600/40 text-emerald-400"
          : "bg-zinc-800/60 border-zinc-700 text-zinc-400"
      }`}
    >
      {pending ? (
        <Loader2 className="w-3 h-3 shrink-0 animate-spin" />
      ) : Icon ? (
        <Icon className="w-3 h-3 shrink-0" />
      ) : (
        <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-emerald-400" />
      )}

      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
}