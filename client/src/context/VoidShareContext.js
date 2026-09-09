"use client";

import { createContext, useContext } from "react";
import { useBackendWarmup } from "@/hooks/useBackendWarmup";
import { useVoidShare } from "@/hooks/useVoidShare";

const VoidShareContext = createContext(null);

/**
 * Bug fix: this used to be called directly inside the Home page component.
 * Since Next's App Router unmounts a page's component tree on every route
 * change, navigating to /devlogs and back used to unmount Home, which tore
 * down the whole session — a fresh signaling connection was opened, a new
 * ECDH key pair was generated, and any live peer connection was silently
 * abandoned (from the peer's point of view, we just vanished).
 *
 * Layouts, on the other hand, do NOT unmount when navigating between pages
 * that share them. So this provider lives in app/layout.js, one level above
 * every page, and both "/" and "/devlogs" just read from it. The session
 * (peer id, RTCPeerConnection, DataChannel, transfer state) now survives
 * navigating away from and back to the home page.
 */
export function VoidShareProvider({ children }) {
  const backendReady = useBackendWarmup();
  const voidShare = useVoidShare();

  return (
    <VoidShareContext.Provider value={{ backendReady, ...voidShare }}>
      {children}
    </VoidShareContext.Provider>
  );
}

export function useVoidShareContext() {
  const ctx = useContext(VoidShareContext);
  if (!ctx) throw new Error("useVoidShareContext must be used within a VoidShareProvider");
  return ctx;
}
