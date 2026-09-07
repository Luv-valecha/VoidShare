"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ScanLine } from "lucide-react";

export function QrCode({ peerId }) {
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    if (!peerId) return;
    const connectionUrl = `${window.location.origin}?peerId=${encodeURIComponent(peerId)}`;
    QRCode.toDataURL(connectionUrl, {
      color: { dark: "#f87171", light: "#09090b" },
      margin: 2,
      width: 220,
    })
      .then(setQrUrl)
      .catch(console.error);
  }, [peerId]);

  if (!qrUrl) return null;

  return (
    <div className="glass-card inline-flex flex-col items-center rounded-2xl p-4 gap-2 shadow-lg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrUrl} alt="Scan to connect" className="rounded-lg" width={180} height={180} />
      <span className="flex items-center gap-1.5 text-[11px] text-zinc-400 tracking-wide uppercase font-medium">
        <ScanLine className="w-3.5 h-3.5 text-red-400" />
        Scan to connect
      </span>
    </div>
  );
}
