"use client";

import { Zap } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black to-zinc-950 text-white z-50">
      <div className="flex items-center gap-3 mb-8">
        <Zap className="w-9 h-9 text-red-500 animate-pulse" strokeWidth={2.5} />
        <h1 className="text-3xl font-bold text-red-400 tracking-wider drop-shadow-lg">
          VoidShare
        </h1>
      </div>

      <div className="w-14 h-14 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />

      <p className="mt-8 text-zinc-500 text-sm">Waking up the signaling server{"\u2026"}</p>
    </div>
  );
}
