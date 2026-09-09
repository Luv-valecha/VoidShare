"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ScanLine } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export function QrCode({ peerId }) {
  const [qrUrl, setQrUrl] = useState("");
  const { themeId } = useTheme();

  useEffect(() => {
    if (!peerId) return;

    const connectionUrl = `${window.location.origin}?peerId=${encodeURIComponent(peerId)}`;

    // Pull the theme's actual colors from CSS custom properties so the QR
    // code always matches whatever theme is active, instead of being
    // hardcoded to the original dark-red palette.
    const styles = getComputedStyle(document.documentElement);
    const dark = styles.getPropertyValue("--c-qr-dark").trim() || "#f87171";
    const light = styles.getPropertyValue("--c-qr-light").trim() || "#09090b";

    QRCode.toDataURL(connectionUrl, {
      color: { dark, light },
      margin: 2,
      width: 220,
    })
      .then(setQrUrl)
      .catch(console.error);
    // Re-generate whenever the theme changes, not just when peerId changes.
  }, [peerId, themeId]);

  if (!qrUrl) return null;

  return (
    <div className="glass-card inline-flex flex-col items-center rounded-2xl p-4 gap-2 shadow-lg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrUrl} alt="Scan to connect" className="rounded-lg" width={180} height={180} />
      <span className="flex items-center gap-1.5 text-[11px] text-[var(--c-text-muted)] tracking-wide uppercase font-medium">
        <ScanLine className="w-3.5 h-3.5 text-[var(--c-accent)]" />
        Scan to connect
      </span>
    </div>
  );
}
