"use client";

import { KeyRound, Loader2, Plug, PlugZap, ShieldCheck } from "lucide-react";

export function ConnectPanel({
  myId,
  friendId,
  setFriendId,
  connected,
  channelOpen,
  keysReady,
  onConnect,
  onDisconnect,
}) {
  const isSelf = Boolean(myId && friendId && friendId.trim() === myId);

  return (
    <div className="glass-card w-full rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          placeholder="Enter friend's Peer ID"
          value={friendId}
          onChange={(e) => setFriendId(e.target.value)}
          disabled={connected}
          aria-invalid={isSelf}
          className={`w-full min-w-0 flex-1 px-4 py-3 sm:py-2.5 rounded-xl bg-[var(--c-surface-2)]/70 border text-[var(--c-text)] placeholder-[var(--c-text-dim)] focus:outline-none focus:ring-2 disabled:opacity-50 transition text-sm sm:text-base ${
            isSelf
              ? "border-amber-500/70 focus:ring-amber-500/60"
              : "border-[var(--c-border-strong)] focus:ring-[var(--c-accent)]/70"
          }`}
        />

        {!connected ? (
          <button
            onClick={onConnect}
            disabled={isSelf}
            title={isSelf ? "That's your own Peer ID — share it with someone else instead." : undefined}
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 text-white bg-[image:linear-gradient(to_right,var(--c-accent-strong),var(--c-accent))] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-3 sm:py-2.5 rounded-xl shadow-md transition font-medium text-sm"
          >
            <Plug className="w-4 h-4" />
            Connect
          </button>
        ) : (
          <button
            onClick={onDisconnect}
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 bg-[var(--c-surface-2)] hover:bg-[var(--c-accent-strong)] text-[var(--c-text)] hover:text-white px-5 py-3 sm:py-2.5 rounded-xl shadow-md transition font-medium text-sm"
          >
            <PlugZap className="w-4 h-4" />
            Disconnect
          </button>
        )}
      </div>

      {isSelf && !connected && (
        <p className="text-xs text-amber-400 -mt-1">
          That&apos;s your own Peer ID. Ask your friend for theirs, or share yours with them instead.
        </p>
      )}

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
            label={keysReady ? "Secure channel ready" : "Exchanging keys\u2026"}
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
          : "bg-[var(--c-surface-2)]/60 border-[var(--c-border-strong)] text-[var(--c-text-muted)]"
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
