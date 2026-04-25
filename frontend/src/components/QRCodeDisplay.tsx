"use client";

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
        src="/api/qr"
        alt="QR kodas"
        width={160}
        height={160}
        style={{ display: "block" }}
      />
    </div>
  );
}
