"use client";

import { useEffect, useState } from "react";

export default function QRCodeDisplay() {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let url: string;
    fetch("/api/qr", { headers: { "ngrok-skip-browser-warning": "1" } })
      .then((r) => {
        if (!r.ok) throw new Error("qr failed");
        return r.blob();
      })
      .then((blob) => {
        url = URL.createObjectURL(blob);
        setSrc(url);
      })
      .catch(() => {});
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: 14,
        display: "inline-block",
        boxShadow: "0 0 40px rgba(37,99,235,0.2)",
        minWidth: 188,
        minHeight: 188,
      }}
    >
      {src && (
        <img
          src={src}
          alt="QR kodas"
          width={160}
          height={160}
          style={{ display: "block" }}
        />
      )}
    </div>
  );
}
