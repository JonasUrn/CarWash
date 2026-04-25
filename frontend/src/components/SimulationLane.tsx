"use client";

import { useEffect, useRef, useState } from "react";
import type { CarInfo, ServingCar } from "@/lib/api";

interface Props {
  queueCars: CarInfo[];
  servingCar: ServingCar | null;
  remainingSec: number;
  avgServiceTimeSec: number;
  highlightCarId?: number;
}

const BAY_W = 112;
const CAR_W = 60;
const CAR_H = 30;
const GAP = 10;
const LANE_H = 130;

function MiniCar({ color = "#2563eb", highlight = false }: { color?: string; highlight?: boolean }) {
  return (
    <svg width={CAR_W} height={CAR_H} viewBox={`0 0 ${CAR_W} ${CAR_H}`}>
      {highlight && <rect x="0" y="0" width={CAR_W} height={CAR_H + 2} fill="#fbbf24" rx="4" opacity="0.15" />}
      <rect x="2" y="13" width={CAR_W - 4} height={CAR_H - 15} fill={color} rx="3" />
      <rect x="10" y="4" width={CAR_W - 22} height={15} fill={color} rx="4" />
      <rect x="13" y="6" width="15" height="9" fill="#bfdbfe" rx="2" opacity="0.85" />
      <rect x="31" y="6" width="13" height="9" fill="#bfdbfe" rx="2" opacity="0.85" />
      <circle cx="15" cy={CAR_H - 1} r="5" fill="#0f172a" />
      <circle cx="15" cy={CAR_H - 1} r="2" fill="#1e293b" />
      <circle cx={CAR_W - 14} cy={CAR_H - 1} r="5" fill="#0f172a" />
      <circle cx={CAR_W - 14} cy={CAR_H - 1} r="2" fill="#1e293b" />
      {highlight && (
        <rect x="1" y="1" width={CAR_W - 2} height={CAR_H - 2} fill="none" stroke="#fbbf24" strokeWidth="1.5" rx="3" />
      )}
    </svg>
  );
}

function fmt(sec: number) {
  if (sec < 60) return `${Math.round(sec)}s`;
  return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
}

export default function SimulationLane({
  queueCars,
  servingCar,
  remainingSec,
  avgServiceTimeSec,
  highlightCarId,
}: Props) {
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const prevIds = useRef(new Set<number>());

  useEffect(() => {
    const cur = new Set([
      ...queueCars.map((c) => c.id),
      ...(servingCar ? [servingCar.id] : []),
    ]);
    const fresh = new Set([...cur].filter((id) => !prevIds.current.has(id)));
    prevIds.current = cur;
    if (fresh.size === 0) return;
    setNewIds(fresh);
    const t = setTimeout(() => setNewIds(new Set()), 650);
    return () => clearTimeout(t);
  }, [queueCars, servingCar]);

  const selectedCar = queueCars.find((c) => c.id === selectedId) ?? null;
  const selectedIdx = queueCars.findIndex((c) => c.id === selectedId);
  const selectedWait =
    selectedIdx >= 0 ? remainingSec + selectedIdx * avgServiceTimeSec : null;

  const contentWidth = BAY_W + 16 + queueCars.length * (CAR_W + GAP) + 48;

  return (
    <div>
      {/* Selected car info bar */}
      <div
        style={{
          minHeight: 32,
          marginBottom: 8,
          padding: "0 4px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        {selectedCar && selectedWait !== null ? (
          <>
            <span style={{ color: "#fbbf24", fontSize: 12, fontWeight: 600 }}>
              Car #{selectedIdx + 1}
            </span>
            <span style={{ color: "#64748b", fontSize: 12 }}>
              Waited: {fmt(selectedCar.waited_sec)}
            </span>
            <span style={{ color: "#64748b", fontSize: 12 }}>
              Est. wait: {fmt(selectedWait)}
            </span>
            <button
              onClick={() => setSelectedId(null)}
              style={{
                background: "none",
                border: "none",
                color: "#374151",
                cursor: "pointer",
                fontSize: 14,
                marginLeft: "auto",
              }}
            >
              ✕
            </button>
          </>
        ) : servingCar && selectedId === servingCar.id ? (
          <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 600 }}>
            Your car is being washed!
          </span>
        ) : (
          <span style={{ color: "#1e293b", fontSize: 12 }}>
            Click a car to see its wait time
          </span>
        )}
      </div>

      <div style={{ width: "100%", overflowX: "auto" }}>
        <div
          style={{
            position: "relative",
            height: LANE_H,
            minWidth: Math.max(contentWidth, 360),
          }}
        >
          {/* Road surface */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 48,
              background: "#0a0f1a",
              borderTop: "2px dashed #1e293b",
            }}
          />

          {/* Lane markings */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                bottom: 22,
                left: BAY_W + 50 + i * 72,
                width: 38,
                height: 2,
                background: "#1a2236",
              }}
            />
          ))}

          {/* Wash bay */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: BAY_W,
              height: LANE_H,
              background: "#030712",
              borderRight: "2px solid #1a2236",
              borderTop: "2px solid #1a2236",
              borderRadius: "8px 0 0 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                color: "#1e293b",
                fontSize: 9,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Wash Bay
            </span>

            {servingCar ? (
              <>
                <div
                  onClick={() => setSelectedId(servingCar.id)}
                  style={{ cursor: "pointer" }}
                >
                  <MiniCar
                    color="#1e3a8a"
                    highlight={
                      selectedId === servingCar.id ||
                      highlightCarId === servingCar.id
                    }
                  />
                </div>
                <div
                  style={{ width: 76, height: 3, background: "#1a2236", borderRadius: 2 }}
                >
                  <div
                    style={{
                      width: `${servingCar.progress * 100}%`,
                      height: "100%",
                      background: "#3b82f6",
                      borderRadius: 2,
                      transition: "width 0.3s linear",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 4,
                        height: 8,
                        borderRadius: 4,
                        background: "#60a5fa",
                        animation: `dropFall ${0.45 + i * 0.14}s ease-in-out infinite alternate`,
                      }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div
                style={{
                  width: 62,
                  height: 28,
                  border: "1px dashed #1a2236",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ color: "#1a2236", fontSize: 10 }}>free</span>
              </div>
            )}
          </div>

          {/* Queue cars */}
          {queueCars.map((car, i) => {
            const left = BAY_W + 16 + i * (CAR_W + GAP);
            const isNew = newIds.has(car.id);
            const isSelected = selectedId === car.id;
            const isHighlight = highlightCarId === car.id;
            return (
              <div
                key={car.id}
                onClick={() => setSelectedId(isSelected ? null : car.id)}
                style={{
                  position: "absolute",
                  left,
                  bottom: 10,
                  width: CAR_W,
                  cursor: "pointer",
                  transition: "left 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                  animation: isNew ? "carSlideIn 0.55s ease-out" : undefined,
                }}
              >
                <MiniCar
                  color={isHighlight ? "#d97706" : isSelected ? "#7c3aed" : "#2563eb"}
                  highlight={isSelected || isHighlight}
                />
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 9,
                    color: isSelected ? "#a78bfa" : "#334155",
                    marginTop: 2,
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  #{i + 1}
                </div>
              </div>
            );
          })}

          {/* Entrance arrow */}
          <div
            style={{
              position: "absolute",
              right: 10,
              bottom: 18,
              color: "#1a2236",
              fontSize: 18,
            }}
          >
            →
          </div>
        </div>
      </div>
    </div>
  );
}
