"use client";

import { useCallback, useEffect, useState } from "react";
import ConfigPanel from "@/components/ConfigPanel";
import SimulationLane from "@/components/SimulationLane";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import StatsCard from "@/components/StatsCard";
import { fetchStats, spawnCar, QueueStats } from "@/lib/api";

function fmt(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`;
  return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
}

export default function Home() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [spawning, setSpawning] = useState(false);

  useEffect(() => {
    const load = () => fetchStats().then(setStats).catch(() => {});
    load();
    const id = setInterval(load, 500);
    return () => clearInterval(id);
  }, []);

  const handleSpawn = useCallback(async () => {
    setSpawning(true);
    await spawnCar().catch(() => {});
    setTimeout(() => setSpawning(false), 300);
  }, []);

  const s = stats;

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "28px 24px",
        maxWidth: 1100,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div
            style={{
              color: "#2563eb",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            AutoWash
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f9fafb", marginTop: 2 }}>
            Queue Simulator
          </h1>
        </div>
        <button
          onClick={handleSpawn}
          disabled={spawning}
          style={{
            background: spawning ? "#1e3a8a" : "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 600,
            cursor: spawning ? "default" : "pointer",
            transition: "background 0.15s",
          }}
        >
          + Spawn Car
        </button>
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* Left: config + QR */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <ConfigPanel />

          <div
            style={{
              background: "#0d1117",
              borderRadius: 12,
              border: "1px solid #1f2937",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <QRCodeDisplay />
            <p style={{ color: "#374151", fontSize: 11, textAlign: "center", lineHeight: 1.4 }}>
              Scan to join queue
              <br />
              and track your car
            </p>
          </div>
        </div>

        {/* Right: simulation + stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Simulation lane */}
          <div
            style={{
              background: "#0d1117",
              borderRadius: 12,
              border: "1px solid #1f2937",
              padding: "14px 14px 10px",
            }}
          >
            <div
              style={{
                color: "#374151",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 8,
              }}
            >
              Live Queue — cars enter from right →
            </div>
            <SimulationLane
              queueCars={s?.queue_cars ?? []}
              servingCar={s?.serving_car ?? null}
              remainingSec={s?.remaining_sec ?? 0}
              avgServiceTimeSec={s?.avg_service_time_sec ?? 5}
            />
          </div>

          {/* Status bar */}
          <div
            style={{
              display: "flex",
              background: "#0d1117",
              borderRadius: 10,
              border: "1px solid #1f2937",
              overflow: "hidden",
            }}
          >
            {[
              {
                label: "Waiting",
                val: `${s?.queue_length ?? 0} cars`,
                color:
                  (s?.queue_length ?? 0) > 4
                    ? "#ef4444"
                    : (s?.queue_length ?? 0) > 1
                    ? "#f59e0b"
                    : "#10b981",
              },
              {
                label: "Bay",
                val: s?.is_serving ? "Washing" : "Available",
                color: s?.is_serving ? "#22c55e" : "#f59e0b",
              },
              {
                label: "Served",
                val: `${s?.cars_served_total ?? 0}`,
                color: "#f9fafb",
              },
              {
                label: "Throughput",
                val: s ? `${s.throughput_per_hour}/hr` : "—",
                color: "#94a3b8",
              },
            ].map((item, i, arr) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  borderRight: i < arr.length - 1 ? "1px solid #1f2937" : undefined,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    color: "#374151",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{ color: item.color, fontSize: 18, fontWeight: 700, marginTop: 2 }}
                >
                  {item.val}
                </div>
              </div>
            ))}
          </div>

          {/* Stats grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 10,
            }}
          >
            <StatsCard label="Est. next wait" value={s ? fmt(s.estimated_wait_sec) : "—"} />
            <StatsCard label="Avg wash time" value={s ? fmt(s.avg_service_time_sec) : "—"} />
            <StatsCard label="Avg queue wait" value={s ? fmt(s.avg_wait_time_sec) : "—"} />
            <StatsCard
              label="Utilization"
              value={s ? `${Math.round(s.utilization * 100)}` : "—"}
              unit="%"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
