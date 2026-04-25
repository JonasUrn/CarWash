"use client";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function QRCodeDisplay() {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: 14,
        display: "inline-block",
        boxShadow: "0 0 40px rgba(37,99,235,0.2)",
      }}
    >
      <img
        src={`${API}/api/qr`}
        alt="Scan for queue status"
        width={160}
        height={160}
        style={{ display: "block" }}
      />
    </div>
  );
}
