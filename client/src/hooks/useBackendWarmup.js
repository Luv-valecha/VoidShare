"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const SIGNALING_HTTP_URL =
  process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL?.replace(/^ws/, "http") ||
  "https://voidshareserver.onrender.com";

/**
 * Free-tier hosts (e.g. Render) put the signaling server to sleep after
 * inactivity. This pings its plain HTTP endpoint first so it's awake by the
 * time we try to open a WebSocket to it.
 */
export function useBackendWarmup() {
  const [backendReady, setBackendReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await fetch(SIGNALING_HTTP_URL);
      } catch (err) {
        console.error("Error waking signaling server:", err);
        if (!cancelled) toast.error("Couldn't reach the signaling server. Please try again shortly.");
      } finally {
        if (!cancelled) setBackendReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return backendReady;
}
