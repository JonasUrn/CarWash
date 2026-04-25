"use client";

interface Props {
  isServing: boolean;
  queueLength: number;
}

const SPRAY = [
  { x1: 125, y1: 72, x2: 118, y2: 152, dur: "0.3s" },
  { x1: 158, y1: 72, x2: 153, y2: 152, dur: "0.4s" },
  { x1: 191, y1: 72, x2: 187, y2: 152, dur: "0.25s" },
  { x1: 224, y1: 72, x2: 220, y2: 152, dur: "0.35s" },
  { x1: 257, y1: 72, x2: 251, y2: 152, dur: "0.45s" },
];

export default function CarWashVisual({ isServing, queueLength }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <svg viewBox="0 0 400 220" width="360" height="198">
        {/* Ground */}
        <rect x="20" y="178" width="360" height="30" fill="#1f2937" rx="4" />

        {/* Lane guide lines */}
        <rect x="40" y="178" width="320" height="3" fill="#374151" />

        {/* Left pillar */}
        <rect x="28" y="58" width="18" height="124" fill="#374151" rx="3" />
        {/* Right pillar */}
        <rect x="354" y="58" width="18" height="124" fill="#374151" rx="3" />
        {/* Top beam */}
        <rect x="28" y="52" width="344" height="18" fill="#374151" rx="3" />

        {/* Rotating brushes — only when serving */}
        {isServing && (
          <>
            <rect x="138" y="72" width="14" height="108" fill="#1d4ed8" rx="6" opacity="0.85">
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0 145 126;12 145 126;-12 145 126;0 145 126"
                dur="0.45s"
                repeatCount="indefinite"
              />
            </rect>
            <rect x="248" y="72" width="14" height="108" fill="#1d4ed8" rx="6" opacity="0.85">
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0 255 126;-12 255 126;12 255 126;0 255 126"
                dur="0.45s"
                repeatCount="indefinite"
              />
            </rect>

            {/* Water spray */}
            {SPRAY.map((s, i) => (
              <line
                key={i}
                x1={s.x1}
                y1={s.y1}
                x2={s.x2}
                y2={s.y2}
                stroke="#93c5fd"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.7"
              >
                <animate
                  attributeName="opacity"
                  values="0.7;0.2;0.7"
                  dur={s.dur}
                  repeatCount="indefinite"
                />
              </line>
            ))}
          </>
        )}

        {/* Car in bay — only when serving */}
        {isServing && (
          <g>
            {/* Body */}
            <rect x="90" y="135" width="170" height="40" fill="#1e40af" rx="5" />
            {/* Cabin */}
            <rect x="108" y="108" width="120" height="34" fill="#2563eb" rx="7" />
            {/* Windshields */}
            <rect x="114" y="114" width="48" height="20" fill="#bfdbfe" rx="3" opacity="0.85" />
            <rect x="170" y="114" width="48" height="20" fill="#bfdbfe" rx="3" opacity="0.85" />
            {/* Front bumper */}
            <rect x="88" y="148" width="10" height="18" fill="#1e3a8a" rx="2" />
            {/* Rear bumper */}
            <rect x="252" y="148" width="10" height="18" fill="#1e3a8a" rx="2" />
            {/* Wheels */}
            <circle cx="120" cy="178" r="14" fill="#111827" />
            <circle cx="120" cy="178" r="7" fill="#374151" />
            <circle cx="235" cy="178" r="14" fill="#111827" />
            <circle cx="235" cy="178" r="7" fill="#374151" />
          </g>
        )}

        {/* Status indicator light */}
        <circle cx="200" cy="36" r="10" fill={isServing ? "#22c55e" : "#f59e0b"}>
          {isServing && (
            <animate attributeName="opacity" values="1;0.35;1" dur="1.2s" repeatCount="indefinite" />
          )}
        </circle>
        <text x="200" y="22" textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="sans-serif">
          {isServing ? "IN USE" : "AVAILABLE"}
        </text>
      </svg>

      {/* Queue dots */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ color: "#6b7280", fontSize: 12, marginRight: 4 }}>Queue:</span>
        {queueLength === 0 ? (
          <span style={{ color: "#4b5563", fontSize: 12 }}>empty</span>
        ) : (
          Array.from({ length: Math.min(queueLength, 8) }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#2563eb",
                opacity: 1 - i * 0.08,
              }}
            />
          ))
        )}
        {queueLength > 8 && (
          <span style={{ color: "#6b7280", fontSize: 12 }}>+{queueLength - 8}</span>
        )}
      </div>
    </div>
  );
}
