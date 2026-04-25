"use client";

import { useEffect, useRef, useState } from "react";
import type { CarInfo, ServingCar } from "@/lib/api";

interface Props {
  queueCars: CarInfo[];
  servingCar: ServingCar | null;
}

const BAY_W = 108;
const CAR_W = 58;
const CAR_H = 30;
const GAP = 10;
const LANE_H = 116;

function MiniCar({ color = "#2563eb" }: { color?: string }) {
  return (
    <svg width={CAR_W} height={CAR_H} viewBox={`0 0 ${CAR_W} ${CAR_H}`}>
      <rect x="2" y="13" width={CAR_W - 4} height={CAR_H - 15} fill={color} rx="3" />
      <rect x="9" y="4" width={CAR_W - 20} height={15} fill={color} rx="4" />
      <rect x="12" y="6" width="15" height="9" fill="#bfdbfe" rx="2" opacity="0.85" />
      <rect x="30" y="6" width="13" height="9" fill="#bfdbfe" rx="2" opacity="0.85" />
      <circle cx="14" cy={CAR_H - 1} r="5" fill="#0f172a" />
      <circle cx="14" cy={CAR_H - 1} r="2" fill="#1e293b" />
      <circle cx={CAR_W - 14} cy={CAR_H - 1} r="5" fill="#0f172a" />
      <circle cx={CAR_W - 14} cy={CAR_H - 1} r="2" fill="#1e293b" />
    </svg>
  );
}

export default function SimulationLane({ queueCars, servingCar }: Props) {
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
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
    const t = setTimeout(() => setNewIds(new Set()), 600);
    return () => clearTimeout(t);
  }, [queueCars, servingCar]);

  const contentWidth = BAY_W + 16 + queueCars.length * (CAR_W + GAP) + 40;

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <div
        style={{
          position: "relative",
          height: LANE_H,
          minWidth: Math.max(contentWidth, 360),
        }}
      >
        {/* Road */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 46,
            background: "#0f172a",
            borderTop: "2px dashed #1e293b",
          }}
        />

        {/* Road lane markings */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              bottom: 20,
              left: BAY_W + 60 + i * 70,
              width: 36,
              height: 2,
              background: "#1e293b",
            }}
          />
        ))}

        {/* Bay */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: BAY_W,
            height: LANE_H,
            background: "#030712",
            borderRight: "2px solid #1e293b",
            borderTop: "2px solid #1e293b",
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
              color: "#334155",
              fontSize: 9,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Wash Bay
          </span>

          {servingCar ? (
            <>
              <MiniCar color="#1e3a8a" />

              {/* Wash progress bar */}
              <div
                style={{
                  width: 74,
                  height: 3,
                  background: "#1e293b",
                  borderRadius: 2,
                }}
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

              {/* Animated water drops */}
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
                width: 60,
                height: 28,
                border: "1px dashed #1e293b",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#1e293b", fontSize: 10 }}>free</span>
            </div>
          )}
        </div>

        {/* Queue cars */}
        {queueCars.map((car, i) => {
          const left = BAY_W + 16 + i * (CAR_W + GAP);
          const isNew = newIds.has(car.id);
          return (
            <div
              key={car.id}
              style={{
                position: "absolute",
                left,
                bottom: 8,
                width: CAR_W,
                transition: "left 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                animation: isNew ? "carSlideIn 0.5s ease-out" : undefined,
              }}
            >
              <MiniCar />
              <div
                style={{
                  textAlign: "center",
                  fontSize: 9,
                  color: "#64748b",
                  marginTop: 1,
                }}
              >
                #{i + 1} · {car.waited_sec}s
              </div>
            </div>
          );
        })}

        {/* Entrance arrow */}
        <div
          style={{
            position: "absolute",
            right: 10,
            bottom: 16,
            color: "#1e293b",
            fontSize: 20,
          }}
        >
          →
        </div>
      </div>
    </div>
  );
}
