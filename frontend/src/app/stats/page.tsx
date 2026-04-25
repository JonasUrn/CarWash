"use client";

import { useEffect, useState } from "react";
import StatsCard from "@/components/StatsCard";
import { fetchStats, QueueStats } from "@/lib/api";

function formatSec(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}m ${s}s`;
}

export default function StatsPage() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = () =>
      fetchStats()
        .then((s) => { setStats(s); setError(false); })
        .catch(() => setError(true));
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  if (error) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <p style={{ color: "#9ca3af" }}>Unable to connect to car wash system.</p>
      </main>
    );
  }

  if (!stats) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <p style={{ color: "#9ca3af" }}>Loading...</p>
      </main>
    );
  }

  const position = stats.queue_length + (stats.is_serving ? 1 : 0);

  return (
    <main style={{ minHeight: "100vh", padding: "40px 24px", maxWidth: 480, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            color: "#2563eb",
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          AutoWash
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f9fafb" }}>Queue Status</h1>
        <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>
          Live — updates every 3 seconds
        </p>
      </div>

      {/* Stats cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <StatsCard
          label="Your position"
          value={position === 0 ? "Next!" : `~${position + 1}`}
          unit={position > 0 ? "in line" : undefined}
          highlight
        />
        <StatsCard
          label="Estimated wait"
          value={formatSec(stats.estimated_wait_sec)}
        />
        <StatsCard
          label="Avg wash time"
          value={formatSec(stats.avg_service_time_sec)}
        />
        <StatsCard
          label="Utilization"
          value={`${Math.round(stats.utilization * 100)}`}
          unit="%"
        />
        <StatsCard
          label="Cars served today"
          value={`${stats.cars_served_total}`}
        />
      </div>

      {/* Bay status pill */}
      <div
        style={{
          marginTop: 20,
          padding: "12px 18px",
          background: "#111827",
          borderRadius: 10,
          border: "1px solid #1f2937",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: stats.is_serving ? "#22c55e" : "#f59e0b",
            flexShrink: 0,
          }}
        />
        <span style={{ color: "#9ca3af", fontSize: 14 }}>
          {stats.is_serving ? "Currently washing a car" : "Bay is available — drive in!"}
        </span>
      </div>
    </main>
  );
}
