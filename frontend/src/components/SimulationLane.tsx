"use client";

import { useEffect, useRef, useState } from "react";
import type { BoxStats } from "@/lib/api";

interface Props {
  boxes: BoxStats[];
  highlightCarId?: number;
  highlightBoxId?: number;
}

const BAY_W = 100;
const CAR_W = 56;
const CAR_H = 28;
const GAP = 8;
const LANE_H = 120;
const MAX_VISIBLE = 6;

function MiniCar({ color = "#2563eb", highlight = false }: { color?: string; highlight?: boolean }) {
  return (
    <svg width={CAR_W} height={CAR_H} viewBox={`0 0 ${CAR_W} ${CAR_H}`}>
      {highlight && <rect x="0" y="0" width={CAR_W} height={CAR_H + 2} fill="#fbbf24" rx="4" opacity="0.15" />}
      <rect x="2" y="12" width={CAR_W - 4} height={CAR_H - 14} fill={color} rx="3" />
      <rect x="9" y="4" width={CAR_W - 20} height={14} fill={color} rx="4" />
      <rect x="12" y="6" width="13" height="8" fill="#bfdbfe" rx="2" opacity="0.85" />
      <rect x="28" y="6" width="11" height="8" fill="#bfdbfe" rx="2" opacity="0.85" />
      <circle cx="13" cy={CAR_H - 1} r="4.5" fill="#0f172a" />
      <circle cx="13" cy={CAR_H - 1} r="2" fill="#1e293b" />
      <circle cx={CAR_W - 12} cy={CAR_H - 1} r="4.5" fill="#0f172a" />
      <circle cx={CAR_W - 12} cy={CAR_H - 1} r="2" fill="#1e293b" />
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

interface LaneProps {
  box: BoxStats;
  label: string;
  highlightCarId?: number;
}

function SingleLane({ box, label, highlightCarId }: LaneProps) {
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const prevIds = useRef(new Set<number>());

  const { queue_cars, serving_car, remaining_sec, avg_service_time_sec } = box;

  useEffect(() => {
    const cur = new Set([
      ...queue_cars.map((c) => c.id),
      ...(serving_car ? [serving_car.id] : []),
    ]);
    const fresh = new Set([...cur].filter((id) => !prevIds.current.has(id)));
    prevIds.current = cur;
    if (fresh.size === 0) return;
    setNewIds(fresh);
    const t = setTimeout(() => setNewIds(new Set()), 650);
    return () => clearTimeout(t);
  }, [queue_cars, serving_car]);

  const selectedCar = queue_cars.find((c) => c.id === selectedId) ?? null;
  const selectedIdx = queue_cars.findIndex((c) => c.id === selectedId);
  const selectedWait = selectedIdx >= 0 ? remaining_sec + selectedIdx * avg_service_time_sec : null;

  const visibleCars = queue_cars.slice(0, MAX_VISIBLE);
  const overflowCount = queue_cars.length - MAX_VISIBLE;
  const contentWidth = BAY_W + 12 + visibleCars.length * (CAR_W + GAP) + (overflowCount > 0 ? 52 : 24);

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Lane label */}
      <div
        style={{
          color: "#374151",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 4,
          paddingLeft: 2,
        }}
      >
        {label}
      </div>

      {/* Selected car info */}
      <div style={{ minHeight: 28, marginBottom: 6, padding: "0 2px", display: "flex", alignItems: "center", gap: 12 }}>
        {selectedCar && selectedWait !== null ? (
          <>
            <span style={{ color: "#fbbf24", fontSize: 11, fontWeight: 600 }}>
              #{selectedIdx + 1}
            </span>
            <span style={{ color: "#64748b", fontSize: 11 }}>
              Lauke: {fmt(selectedCar.waited_sec)}
            </span>
            <span style={{ color: "#64748b", fontSize: 11 }}>
              Liks: {fmt(selectedWait)}
            </span>
            <button
              onClick={() => setSelectedId(null)}
              style={{ background: "none", border: "none", color: "#374151", cursor: "pointer", fontSize: 13, marginLeft: "auto" }}
            >
              ✕
            </button>
          </>
        ) : (
          <span style={{ color: "#9ca3af", fontSize: 10 }}>
            Paspauskite automobili
          </span>
        )}
      </div>

      <div style={{ width: "100%", overflowX: "auto" }}>
        <div style={{ position: "relative", height: LANE_H, minWidth: Math.max(contentWidth, 280) }}>
          {/* Road */}
          <div
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              height: 44, background: "#e8eaed", borderTop: "2px dashed #d1d5db",
            }}
          />
          {/* Lane markings */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute", bottom: 20, left: BAY_W + 44 + i * 64,
                width: 34, height: 2, background: "#d1d5db",
              }}
            />
          ))}

          {/* Wash bay */}
          <div
            style={{
              position: "absolute", left: 0, top: 0, width: BAY_W, height: LANE_H,
              background: "#dde1e6", borderRight: "2px solid #d1d5db",
              borderTop: "2px solid #d1d5db", borderRadius: "8px 0 0 0",
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 5,
            }}
          >
            <span style={{ color: "#9ca3af", fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Plovykla
            </span>
            {serving_car ? (
              <>
                <div onClick={() => setSelectedId(serving_car.id)} style={{ cursor: "pointer" }}>
                  <MiniCar color="#1e3a8a" highlight={selectedId === serving_car.id || highlightCarId === serving_car.id} />
                </div>
                <div style={{ width: 68, height: 3, background: "#d1d5db", borderRadius: 2 }}>
                  <div
                    style={{
                      width: `${serving_car.progress * 100}%`, height: "100%",
                      background: "#3b82f6", borderRadius: 2, transition: "width 0.3s linear",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 3, height: 7, borderRadius: 4, background: "#60a5fa",
                        animation: `dropFall ${0.45 + i * 0.14}s ease-in-out infinite alternate`,
                      }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div
                style={{
                  width: 56, height: 24, border: "1px dashed #d1d5db", borderRadius: 4,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <span style={{ color: "#9ca3af", fontSize: 9 }}>laisva</span>
              </div>
            )}
          </div>

          {/* Queue cars */}
          {visibleCars.map((car, i) => {
            const left = BAY_W + 12 + i * (CAR_W + GAP);
            const isNew = newIds.has(car.id);
            const isSelected = selectedId === car.id;
            const isHighlight = highlightCarId === car.id;
            return (
              <div
                key={car.id}
                onClick={() => setSelectedId(isSelected ? null : car.id)}
                style={{
                  position: "absolute", left, bottom: 8, width: CAR_W,
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
                    textAlign: "center", fontSize: 8,
                    color: isSelected ? "#a78bfa" : "#334155",
                    marginTop: 2, fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  #{i + 1}
                </div>
              </div>
            );
          })}

          {/* Overflow badge */}
          {overflowCount > 0 && (
            <div
              style={{
                position: "absolute", left: BAY_W + 12 + visibleCars.length * (CAR_W + GAP) + 2,
                bottom: 12, background: "#e5e7eb", border: "1px solid #d1d5db",
                borderRadius: 6, padding: "3px 7px", color: "#64748b", fontSize: 10, fontWeight: 600,
              }}
            >
              +{overflowCount}
            </div>
          )}

          {/* Entrance arrow */}
          <div style={{ position: "absolute", right: 8, bottom: 16, color: "#9ca3af", fontSize: 16 }}>
            →
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SimulationLane({ boxes, highlightCarId, highlightBoxId }: Props) {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      {boxes.map((box) => (
        <SingleLane
          key={box.box_id}
          box={box}
          label={`Boksas ${box.box_id + 1}`}
          highlightCarId={highlightBoxId === box.box_id ? highlightCarId : undefined}
        />
      ))}
    </div>
  );
}
