"use client";

import { useCallback, useEffect, useState } from "react";
import ConfigPanel from "@/components/ConfigPanel";
import SimulationLane from "@/components/SimulationLane";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import StatsCard from "@/components/StatsCard";
import { controlSimulation, fetchStats, QueueStats } from "@/lib/api";

function fmt(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`;
  return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
}

const btnBase: React.CSSProperties = {
  border: "none",
  borderRadius: 8,
  padding: "9px 16px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  transition: "background 0.15s",
};

export default function Home() {
  const [stats, setStats] = useState<QueueStats | null>(null);

  useEffect(() => {
    const load = () => fetchStats().then(setStats).catch(() => {});
    load();
    const id = setInterval(load, 500);
    return () => clearInterval(id);
  }, []);

  const paused = stats?.paused ?? false;

  const handleControl = useCallback(
    (action: "pause" | "resume" | "reset") => () => {
      controlSimulation(action).catch(() => {});
    },
    []
  );

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {paused ? (
            <button
              onClick={handleControl("resume")}
              style={{ ...btnBase, background: "#065f46", color: "#6ee7b7" }}
            >
              ▶ Testi
            </button>
          ) : (
            <button
              onClick={handleControl("pause")}
              style={{ ...btnBase, background: "#1e3a8a", color: "#93c5fd" }}
            >
              ⏸ Stabdyti
            </button>
          )}
          <button
            onClick={handleControl("reset")}
            style={{ ...btnBase, background: "#1c1917", color: "#78716c", border: "1px solid #292524" }}
          >
            ↺ Is naujo
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: 16,
          alignItems: "start",
          minWidth: 0,
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
          </div>
        </div>

        {/* Right: simulation + stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
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
              {paused ? "Eile sustabdyta" : "Eile juda"}
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
                label: "Laukia",
                val: `${s?.queue_length ?? 0} masinu`,
                color:
                  (s?.queue_length ?? 0) > 4
                    ? "#ef4444"
                    : (s?.queue_length ?? 0) > 1
                    ? "#f59e0b"
                    : "#10b981",
              },
              {
                label: "Boksas",
                val: s?.is_serving ? "Plaunama" : "Laisvas",
                color: s?.is_serving ? "#22c55e" : "#f59e0b",
              },
              {
                label: "Aptarnautas",
                val: `${s?.cars_served_total ?? 0}`,
                color: "#f9fafb",
              },
              {
                label: "Pralaidumas",
                val: s ? `${s.throughput_per_hour}/val.` : "—",
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
            <StatsCard label="Apytiksl. laukimas" value={s ? fmt(s.estimated_wait_sec) : "—"} />
            <StatsCard
              label="Vid. plovimo laikas"
              value={s && s.avg_service_time_sec > 0 ? fmt(s.avg_service_time_sec) : "—"}
            />
            <StatsCard label="Vid. eiles laukimas" value={s ? fmt(s.avg_wait_time_sec) : "—"} />
          </div>
        </div>
      </div>
    </main>
  );
}
