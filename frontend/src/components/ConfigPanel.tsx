"use client";

import { useEffect, useState } from "react";
import { fetchConfig, SimConfig, updateConfig } from "@/lib/api";

const DISTS = ["constant", "exponential", "triangular"] as const;

function NumInput({
  value,
  onChange,
  min = 0.5,
  max = 300,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={0.5}
      onChange={(e) => {
        const v = parseFloat(e.target.value);
        if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
      }}
      style={{
        width: 72,
        padding: "5px 8px",
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: 6,
        color: "#f9fafb",
        fontSize: 13,
        outline: "none",
      }}
    />
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
      }}
    >
      <span style={{ color: "#6b7280", fontSize: 12, minWidth: 80 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>{children}</div>
    </div>
  );
}

const unit = (s: string) => (
  <span style={{ color: "#374151", fontSize: 12 }}>{s}</span>
);

export default function ConfigPanel() {
  const [cfg, setCfg] = useState<SimConfig>({
    mean_iat_sec: 7,
    distribution: "exponential",
    constant_sec: 5,
    mean_sec: 5,
    min_sec: 3,
    mode_sec: 5,
    max_sec: 10,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchConfig().then(setCfg).catch(() => {});
  }, []);

  const set = <K extends keyof SimConfig>(k: K, v: SimConfig[K]) =>
    setCfg((c) => ({ ...c, [k]: v }));

  const apply = async () => {
    await updateConfig(cfg).catch(() => {});
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div
      style={{
        background: "#0d1117",
        borderRadius: 12,
        border: "1px solid #1f2937",
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          color: "#4b5563",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: 14,
        }}
      >
        Parameters
      </div>

      <Row label="Arrival gap">
        <NumInput
          value={cfg.mean_iat_sec}
          onChange={(v) => set("mean_iat_sec", v)}
          min={1}
          max={120}
        />
        {unit("sec mean")}
      </Row>

      <div style={{ marginBottom: 10 }}>
        <span style={{ color: "#6b7280", fontSize: 12 }}>Service dist.</span>
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          {DISTS.map((d) => (
            <button
              key={d}
              onClick={() => set("distribution", d)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                border: "1px solid",
                borderColor: cfg.distribution === d ? "#2563eb" : "#1f2937",
                background: cfg.distribution === d ? "#1e3a8a" : "transparent",
                color: cfg.distribution === d ? "#93c5fd" : "#4b5563",
                fontSize: 11,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {cfg.distribution === "constant" && (
        <Row label="Duration">
          <NumInput
            value={cfg.constant_sec}
            onChange={(v) => set("constant_sec", v)}
            min={1}
            max={300}
          />
          {unit("sec")}
        </Row>
      )}

      {cfg.distribution === "exponential" && (
        <Row label="Mean">
          <NumInput
            value={cfg.mean_sec}
            onChange={(v) => set("mean_sec", v)}
            min={1}
            max={300}
          />
          {unit("sec")}
        </Row>
      )}

      {cfg.distribution === "triangular" && (
        <>
          <Row label="Min">
            <NumInput value={cfg.min_sec} onChange={(v) => set("min_sec", v)} min={0.5} max={300} />
            {unit("sec")}
          </Row>
          <Row label="Mode">
            <NumInput value={cfg.mode_sec} onChange={(v) => set("mode_sec", v)} min={0.5} max={300} />
            {unit("sec")}
          </Row>
          <Row label="Max">
            <NumInput value={cfg.max_sec} onChange={(v) => set("max_sec", v)} min={0.5} max={300} />
            {unit("sec")}
          </Row>
        </>
      )}

      <button
        onClick={apply}
        style={{
          marginTop: 4,
          width: "100%",
          padding: "9px",
          background: saved ? "#064e3b" : "#1e3a8a",
          color: saved ? "#6ee7b7" : "#93c5fd",
          border: `1px solid ${saved ? "#065f46" : "#1d4ed8"}`,
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        {saved ? "✓ Applied" : "Apply"}
      </button>
    </div>
  );
}
