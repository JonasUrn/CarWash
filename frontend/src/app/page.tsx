"use client";

import { useCallback, useEffect, useState } from "react";
import ConfigPanel from "@/components/ConfigPanel";
import SimulationLane from "@/components/SimulationLane";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import ConvergenceGraph from "@/components/ConvergenceGraph";
import { controlSimulation, fetchConfig, fetchStats, QueueStats, SimConfig } from "@/lib/api";

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

function theoreticalServiceMean(cfg: SimConfig): number {
  if (cfg.distribution === "constant") return cfg.constant_sec;
  if (cfg.distribution === "triangular") return (cfg.min_sec + cfg.mode_sec + cfg.max_sec) / 3;
  return cfg.mean_sec;
}

export default function Home() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [config, setConfig] = useState<SimConfig | null>(null);

  useEffect(() => {
    const load = () => fetchStats().then(setStats).catch(() => {});
    load();
    const id = setInterval(load, 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetchConfig().then(setConfig).catch(() => {});
    const id = setInterval(() => fetchConfig().then(setConfig).catch(() => {}), 5000);
    return () => clearInterval(id);
  }, []);

  const paused = stats?.paused ?? false;
  const manualOnly = stats?.manual_only ?? false;

  const handleControl = useCallback(
    (action: "pause" | "resume" | "reset" | "manual_only" | "auto_spawn") => () => {
      controlSimulation(action).catch(() => {});
    },
    []
  );

  const s = stats;
  const totalWaiting = s?.boxes.reduce((acc, b) => acc + b.queue_length, 0) ?? 0;
  const totalServed = s?.total_cars_served ?? 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "28px 24px",
        maxWidth: 1200,
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
              Stabdyti
            </button>
          )}
          <button
            onClick={handleControl("reset")}
            style={{ ...btnBase, background: "#1c1917", color: "#78716c", border: "1px solid #292524" }}
          >
            Is naujo
          </button>
          {manualOnly ? (
            <button
              onClick={handleControl("auto_spawn")}
              style={{ ...btnBase, background: "#713f12", color: "#fde68a" }}
            >
              Leisti auto
            </button>
          ) : (
            <button
              onClick={handleControl("manual_only")}
              style={{ ...btnBase, background: "#3b0764", color: "#e9d5ff" }}
            >
              🚫 Tik QR
            </button>
          )}
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
          {/* Simulation lanes */}
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
                marginBottom: 10,
              }}
            >
              {paused ? "Eile sustabdyta" : "Eile juda"}
            </div>
            <SimulationLane boxes={s?.boxes ?? []} />
          </div>

          {/* Status bar — per-box + totals */}
          <div
            style={{
              display: "flex",
              background: "#0d1117",
              borderRadius: 10,
              border: "1px solid #1f2937",
              overflow: "hidden",
            }}
          >
            {(s?.boxes ?? []).map((box) => (
              <div
                key={box.box_id}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRight: "1px solid #1f2937",
                  textAlign: "center",
                }}
              >
                <div style={{ color: "#374151", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Boksas {box.box_id + 1}
                </div>
                <div
                  style={{
                    color:
                      box.queue_length >= 10
                        ? "#ef4444"
                        : box.queue_length > 4
                        ? "#f59e0b"
                        : "#10b981",
                    fontSize: 15,
                    fontWeight: 700,
                    marginTop: 2,
                  }}
                >
                  {box.queue_length}/10
                </div>
                <div style={{ color: box.is_serving ? "#22c55e" : "#f59e0b", fontSize: 11, marginTop: 1 }}>
                  {box.is_serving ? "Plaunama" : "Laisvas"}
                </div>
              </div>
            ))}
            <div style={{ flex: 1, padding: "10px 12px", borderRight: "1px solid #1f2937", textAlign: "center" }}>
              <div style={{ color: "#374151", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Laukia iš viso
              </div>
              <div style={{ color: "#f9fafb", fontSize: 15, fontWeight: 700, marginTop: 2 }}>
                {totalWaiting}
              </div>
            </div>
            <div style={{ flex: 1, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ color: "#374151", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Aptarnautas
              </div>
              <div style={{ color: "#f9fafb", fontSize: 15, fontWeight: 700, marginTop: 2 }}>
                {totalServed}
              </div>
            </div>
          </div>

          {/* Per-box stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {(s?.boxes ?? []).map((box) => (
              <div
                key={box.box_id}
                style={{
                  background: "#0d1117",
                  border: "1px solid #1f2937",
                  borderRadius: 10,
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ color: "#374151", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Boksas {box.box_id + 1}
                </div>
                {[
                  { label: "Apytiksl. laukimas", val: fmt(box.estimated_wait_sec) },
                  { label: "Vid. plovimo laikas", val: box.avg_service_time_sec > 0 ? fmt(box.avg_service_time_sec) : "—" },
                  { label: "Vid. eiles laukimas", val: fmt(box.avg_wait_time_sec) },
                  { label: "Aptarnautas", val: `${box.cars_served_total}` },
                ].map(({ label, val }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#4b5563", fontSize: 12 }}>{label}</span>
                    <span style={{ color: "#f9fafb", fontSize: 12, fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Convergence graphs */}
      <ConvergenceGraph
        theoreticalServiceMean={config ? theoreticalServiceMean(config) : undefined}
      />
    </main>
  );
}
