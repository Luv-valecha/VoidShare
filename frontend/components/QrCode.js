"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QrCode({ peerId }) {
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    if (peerId) {
      const connectionUrl = `${window.location.origin}?peerId=${encodeURIComponent(peerId)}`;
      QRCode.toDataURL(connectionUrl, {
        color: {
          dark: "#cc3333", // softer red
          light: "#111111", // very dark background
        },
        margin: 2,
      })
        .then(setQrUrl)
        .catch(console.error);
    }
  }, [peerId]);

  if (!qrUrl) return null;

  return (
    <div className="inline-flex flex-col items-center bg-gray-900 border border-red-800 rounded-xl shadow-[0_0_15px_rgba(204,51,51,0.5)] p-4 space-y-2">
      <img
        src={qrUrl}
        alt="Peer QR code"
        className="rounded-md border border-red-700 shadow-[0_0_10px_rgba(204,51,51,0.5)]"
      />
      <span className="text-xs text-red-300 tracking-widest uppercase font-medium">
        Scan to Connect
      </span>
    </div>
  );
}
