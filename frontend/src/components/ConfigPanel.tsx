"use client";

import { useEffect, useState } from "react";
import { fetchConfig, SimConfig, updateConfig } from "@/lib/api";

const DISTS = [
  { value: "constant", label: "Past." },
  { value: "exponential", label: "Ekspon." },
  { value: "triangular", label: "Trikamp." },
] as const;

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
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ color: "#6b7280", fontSize: 12, minWidth: 72 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>{children}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        color: "#4b5563",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: 8,
        marginTop: 4,
      }}
    >
      {children}
    </div>
  );
}

function DistButtons({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: "constant" | "exponential" | "triangular") => void;
}) {
  return (
    <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
      {DISTS.map((d) => (
        <button
          key={d.value}
          onClick={() => onChange(d.value)}
          style={{
            flex: 1,
            padding: "4px 6px",
            borderRadius: 6,
            border: "1px solid",
            borderColor: value === d.value ? "#2563eb" : "#1f2937",
            background: value === d.value ? "#1e3a8a" : "transparent",
            color: value === d.value ? "#93c5fd" : "#4b5563",
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}

const unit = (s: string) => <span style={{ color: "#374151", fontSize: 12 }}>{s}</span>;

const DEFAULT_CFG: SimConfig = {
  dist_iat: "exponential",
  mean_iat_sec: 7,
  constant_iat_sec: 7,
  min_iat_sec: 3,
  mode_iat_sec: 7,
  max_iat_sec: 15,
  distribution: "exponential",
  constant_sec: 5,
  mean_sec: 5,
  min_sec: 3,
  mode_sec: 5,
  max_sec: 10,
};

export default function ConfigPanel() {
  const [cfg, setCfg] = useState<SimConfig>(DEFAULT_CFG);
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
          marginBottom: 12,
        }}
      >
        Parametrai
      </div>

      {/* Arrival section */}
      <SectionLabel>Atvykimas</SectionLabel>
      <DistButtons
        value={cfg.dist_iat}
        onChange={(v) => set("dist_iat", v)}
      />
      {cfg.dist_iat === "constant" && (
        <Row label="Trukme">
          <NumInput value={cfg.constant_iat_sec} onChange={(v) => set("constant_iat_sec", v)} min={1} max={300} />
          {unit("sek.")}
        </Row>
      )}
      {cfg.dist_iat === "exponential" && (
        <Row label="Vidurkis">
          <NumInput value={cfg.mean_iat_sec} onChange={(v) => set("mean_iat_sec", v)} min={1} max={120} />
          {unit("sek.")}
        </Row>
      )}
      {cfg.dist_iat === "triangular" && (
        <>
          <Row label="Min">
            <NumInput value={cfg.min_iat_sec} onChange={(v) => set("min_iat_sec", v)} min={0.5} max={300} />
            {unit("sek.")}
          </Row>
          <Row label="Moda">
            <NumInput value={cfg.mode_iat_sec} onChange={(v) => set("mode_iat_sec", v)} min={0.5} max={300} />
            {unit("sek.")}
          </Row>
          <Row label="Maks">
            <NumInput value={cfg.max_iat_sec} onChange={(v) => set("max_iat_sec", v)} min={0.5} max={300} />
            {unit("sek.")}
          </Row>
        </>
      )}

      {/* Divider */}
      <div style={{ borderTop: "1px solid #1f2937", margin: "10px 0" }} />

      {/* Service section */}
      <SectionLabel>Aptarnavimas</SectionLabel>
      <DistButtons
        value={cfg.distribution}
        onChange={(v) => set("distribution", v)}
      />
      {cfg.distribution === "constant" && (
        <Row label="Trukme">
          <NumInput value={cfg.constant_sec} onChange={(v) => set("constant_sec", v)} min={1} max={300} />
          {unit("sek.")}
        </Row>
      )}
      {cfg.distribution === "exponential" && (
        <Row label="Vidurkis">
          <NumInput value={cfg.mean_sec} onChange={(v) => set("mean_sec", v)} min={1} max={300} />
          {unit("sek.")}
        </Row>
      )}
      {cfg.distribution === "triangular" && (
        <>
          <Row label="Min">
            <NumInput value={cfg.min_sec} onChange={(v) => set("min_sec", v)} min={0.5} max={300} />
            {unit("sek.")}
          </Row>
          <Row label="Moda">
            <NumInput value={cfg.mode_sec} onChange={(v) => set("mode_sec", v)} min={0.5} max={300} />
            {unit("sek.")}
          </Row>
          <Row label="Maks">
            <NumInput value={cfg.max_sec} onChange={(v) => set("max_sec", v)} min={0.5} max={300} />
            {unit("sek.")}
          </Row>
        </>
      )}

      <button
        onClick={apply}
        style={{
          marginTop: 8,
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
        {saved ? "✓ Pritaikyta" : "Taikyti"}
      </button>
    </div>
  );
}
