"use client";

import { useCallback, useEffect, useState } from "react";
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
        display: "flex",
        flexDirection: "column",
        padding: "32px 24px",
        gap: 20,
        maxWidth: 960,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              color: "#2563eb",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            AutoWash
          </div>
          <h1
            style={{ fontSize: 26, fontWeight: 800, color: "#f9fafb", marginTop: 2 }}
          >
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
            padding: "11px 22px",
            fontSize: 15,
            fontWeight: 600,
            cursor: spawning ? "default" : "pointer",
            transition: "background 0.15s",
            letterSpacing: "0.01em",
          }}
        >
          + Spawn Car
        </button>
      </div>

      {/* Simulation lane */}
      <div
        style={{
          background: "#0d1117",
          borderRadius: 16,
          border: "1px solid #1f2937",
          padding: "18px 16px 12px",
        }}
      >
        <div
          style={{
            color: "#4b5563",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 10,
          }}
        >
          Live Queue — cars enter from right →
        </div>
        <SimulationLane
          queueCars={s?.queue_cars ?? []}
          servingCar={s?.serving_car ?? null}
        />
      </div>

      {/* Status bar */}
      <div
        style={{
          display: "flex",
          background: "#111827",
          borderRadius: 12,
          border: "1px solid #1f2937",
          overflow: "hidden",
        }}
      >
        {[
          {
            label: "Waiting",
            value: `${s?.queue_length ?? 0} ${(s?.queue_length ?? 0) === 1 ? "car" : "cars"}`,
            color:
              (s?.queue_length ?? 0) > 4
                ? "#ef4444"
                : (s?.queue_length ?? 0) > 1
                ? "#f59e0b"
                : "#10b981",
          },
          {
            label: "Bay",
            value: s?.is_serving ? "Washing" : "Available",
            color: s?.is_serving ? "#22c55e" : "#f59e0b",
          },
          {
            label: "Served today",
            value: `${s?.cars_served_total ?? 0}`,
            color: "#f9fafb",
          },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              padding: "14px 20px",
              borderRight: i < 2 ? "1px solid #1f2937" : undefined,
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: "#6b7280",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              {item.label}
            </div>
            <div
              style={{ color: item.color, fontSize: 20, fontWeight: 700, marginTop: 3 }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
        }}
      >
        <StatsCard label="Est. wait" value={s ? fmt(s.estimated_wait_sec) : "—"} />
        <StatsCard
          label="Avg wash time"
          value={s ? fmt(s.avg_service_time_sec) : "—"}
        />
        <StatsCard
          label="Avg wait time"
          value={s ? fmt(s.avg_wait_time_sec) : "—"}
        />
        <StatsCard
          label="Utilization"
          value={s ? `${Math.round(s.utilization * 100)}` : "—"}
          unit="%"
        />
      </div>

      {/* QR section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          background: "#111827",
          border: "1px solid #1f2937",
          borderRadius: 16,
          padding: "20px 24px",
        }}
      >
        <QRCodeDisplay />
        <div>
          <div style={{ color: "#f9fafb", fontWeight: 600, fontSize: 15 }}>
            Queue Status QR
          </div>
          <div style={{ color: "#6b7280", fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>
            Scan with your phone to check queue position,
            <br />
            estimated wait time, and live stats.
          </div>
        </div>
      </div>
    </main>
  );
}
