"use client";

import { useEffect, useState } from "react";
import CarWashVisual from "@/components/CarWashVisual";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { fetchStats, QueueStats } from "@/lib/api";

export default function Home() {
  const [stats, setStats] = useState<QueueStats | null>(null);

  useEffect(() => {
    const load = () => fetchStats().then(setStats).catch(() => {});
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  const isServing = stats?.is_serving ?? false;
  const queueLen = stats?.queue_length ?? 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
        padding: 40,
        background: "linear-gradient(160deg, #0a0a0f 0%, #0d1117 60%, #0a0f1a 100%)",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            color: "#2563eb",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          AutoWash
        </div>
        <h1
          style={{
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#f9fafb",
            lineHeight: 1.1,
          }}
        >
          Car Wash
        </h1>
      </div>

      {/* Animated bay */}
      <CarWashVisual isServing={isServing} queueLength={queueLen} />

      {/* Status bar */}
      <div
        style={{
          display: "flex",
          gap: 32,
          alignItems: "center",
          background: "#111827",
          borderRadius: 16,
          padding: "18px 36px",
          border: "1px solid #1f2937",
        }}
      >
        <div>
          <div
            style={{
              color: "#6b7280",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: 2,
            }}
          >
            Waiting
          </div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 700,
              color: queueLen > 4 ? "#ef4444" : queueLen > 1 ? "#f59e0b" : "#10b981",
            }}
          >
            {queueLen} {queueLen === 1 ? "car" : "cars"}
          </div>
        </div>

        <div style={{ width: 1, height: 52, background: "#1f2937" }} />

        <div>
          <div
            style={{
              color: "#6b7280",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginBottom: 2,
            }}
          >
            Bay status
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: isServing ? "#22c55e" : "#f59e0b",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: isServing ? "#22c55e" : "#f59e0b",
              }}
            />
            {isServing ? "Washing" : "Available"}
          </div>
        </div>

        {stats && (
          <>
            <div style={{ width: 1, height: 52, background: "#1f2937" }} />
            <div>
              <div
                style={{
                  color: "#6b7280",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: 2,
                }}
              >
                Served today
              </div>
              <div style={{ fontSize: 34, fontWeight: 700, color: "#f9fafb" }}>
                {stats.cars_served_total}
              </div>
            </div>
          </>
        )}
      </div>

      {/* QR section */}
      <div
        style={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <QRCodeDisplay />
        <p style={{ color: "#6b7280", fontSize: 13, letterSpacing: "0.03em" }}>
          Scan to check your position in queue
        </p>
      </div>
    </main>
  );
}
