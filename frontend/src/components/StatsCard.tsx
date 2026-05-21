interface Props {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
}

export default function StatsCard({ label, value, unit, highlight }: Props) {
  return (
    <div
      style={{
        background: highlight ? "#eff6ff" : "#ffffff",
        border: `1px solid ${highlight ? "#2563eb" : "#e5e7eb"}`,
        borderRadius: 12,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span
        style={{
          color: "#6b7280",
          fontSize: 13,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: highlight ? "#2563eb" : "#111827",
          }}
        >
          {value}
        </span>
        {unit && (
          <span style={{ color: "#6b7280", fontSize: 14 }}>{unit}</span>
        )}
      </div>
    </div>
  );
}
