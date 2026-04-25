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
        background: highlight ? "#1a3a6e" : "#111827",
        border: `1px solid ${highlight ? "#2563eb" : "#1f2937"}`,
        borderRadius: 12,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span
        style={{
          color: "#9ca3af",
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
            color: highlight ? "#60a5fa" : "#f9fafb",
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
