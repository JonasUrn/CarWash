"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import StatsCard from "@/components/StatsCard";
import { fetchStats, QueueStats } from "@/lib/api";

function fmt(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`;
  return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
}

type Phase = "queued" | "serving" | "done" | "unknown";

export default function StatsClient() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get("car_id");
  const carId = rawId ? parseInt(rawId, 10) : null;

  const [stats, setStats] = useState<QueueStats | null>(null);
  const [error, setError] = useState(false);
  const phaseRef = useRef<Phase>(carId ? "queued" : "unknown");
  const [phase, setPhase] = useState<Phase>(carId ? "queued" : "unknown");

  useEffect(() => {
    const load = () =>
      fetchStats()
        .then((s) => {
          setStats(s);
          setError(false);
          if (carId) {
            const inQueue = s.queue_cars.some((c) => c.id === carId);
            const isServing = s.serving_car?.id === carId;
            if (isServing) {
              phaseRef.current = "serving";
            } else if (!inQueue && phaseRef.current !== "queued") {
              phaseRef.current = "done";
            }
            setPhase(phaseRef.current);
          }
        })
        .catch(() => setError(true));
    load();
    const id = setInterval(load, 1500);
    return () => clearInterval(id);
  }, [carId]);

  if (error) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <p style={{ color: "#9ca3af" }}>Unable to connect to car wash system.</p>
      </main>
    );
  }

  if (!stats) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <p style={{ color: "#6b7280" }}>Connecting...</p>
      </main>
    );
  }

  const myCarInQueue = carId ? stats.queue_cars.find((c) => c.id === carId) : null;
  const myIdx = carId ? stats.queue_cars.findIndex((c) => c.id === carId) : -1;
  const myWait =
    myIdx >= 0
      ? stats.remaining_sec + myIdx * stats.avg_service_time_sec
      : phase === "serving"
      ? stats.remaining_sec
      : null;

  const genericPosition = stats.queue_length + (stats.is_serving ? 1 : 0);

  return (
    <main
      style={{ minHeight: "100vh", padding: "36px 24px", maxWidth: 480, margin: "0 auto" }}
    >
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            color: "#2563eb",
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          AutoWash
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#f9fafb" }}>
          {carId ? "Your Queue Status" : "Queue Status"}
        </h1>
        <p style={{ color: "#4b5563", fontSize: 12, marginTop: 4 }}>
          Updates every 1.5 seconds
        </p>
      </div>

      {/* Personalized section when car_id present */}
      {carId && (
        <div
          style={{
            background:
              phase === "done"
                ? "#064e3b"
                : phase === "serving"
                ? "#1e3a8a"
                : "#111827",
            border: `1px solid ${
              phase === "done" ? "#065f46" : phase === "serving" ? "#1d4ed8" : "#1f2937"
            }`,
            borderRadius: 14,
            padding: "18px 20px",
            marginBottom: 16,
          }}
        >
          {phase === "done" ? (
            <>
              <div style={{ color: "#6ee7b7", fontWeight: 700, fontSize: 18 }}>
                Your car is clean! 🎉
              </div>
              <div style={{ color: "#34d399", fontSize: 13, marginTop: 4 }}>
                Wash complete — enjoy!
              </div>
            </>
          ) : phase === "serving" ? (
            <>
              <div style={{ color: "#93c5fd", fontWeight: 700, fontSize: 18 }}>
                Your car is being washed
              </div>
              <div style={{ color: "#60a5fa", fontSize: 13, marginTop: 4 }}>
                Est. remaining: {fmt(stats.remaining_sec)}
              </div>
              <div
                style={{
                  marginTop: 10,
                  height: 4,
                  background: "#1e3a8a",
                  borderRadius: 2,
                }}
              >
                <div
                  style={{
                    width: `${(stats.serving_car?.progress ?? 0) * 100}%`,
                    height: "100%",
                    background: "#3b82f6",
                    borderRadius: 2,
                    transition: "width 0.3s linear",
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <div style={{ color: "#f9fafb", fontWeight: 700, fontSize: 18 }}>
                {myIdx >= 0 ? `#${myIdx + 1} in queue` : "Waiting to enter queue..."}
              </div>
              {myWait !== null && (
                <div style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>
                  Est. wait: {fmt(myWait)}
                </div>
              )}
              {myCarInQueue && (
                <div style={{ color: "#4b5563", fontSize: 12, marginTop: 2 }}>
                  In queue for: {fmt(myCarInQueue.waited_sec)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Generic stats */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {!carId && (
          <StatsCard
            label="Position if joining now"
            value={genericPosition === 0 ? "Next!" : `~${genericPosition + 1}`}
            unit={genericPosition > 0 ? "in line" : undefined}
            highlight
          />
        )}
        <StatsCard label="Est. wait for new car" value={fmt(stats.estimated_wait_sec)} />
        <StatsCard label="Avg wash time" value={fmt(stats.avg_service_time_sec)} />
        <StatsCard label="Avg queue wait" value={fmt(stats.avg_wait_time_sec)} />
        <StatsCard
          label="Utilization"
          value={`${Math.round(stats.utilization * 100)}`}
          unit="%"
        />
        <StatsCard label="Throughput" value={`${stats.throughput_per_hour}`} unit="/hr" />
        <StatsCard label="Cars served" value={`${stats.cars_served_total}`} />
      </div>

      {/* Bay pill */}
      <div
        style={{
          marginTop: 16,
          padding: "11px 16px",
          background: "#0d1117",
          borderRadius: 10,
          border: "1px solid #1f2937",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: stats.is_serving ? "#22c55e" : "#f59e0b",
            flexShrink: 0,
          }}
        />
        <span style={{ color: "#6b7280", fontSize: 13 }}>
          {stats.is_serving ? "Currently washing a car" : "Bay is available"}
        </span>
      </div>
    </main>
  );
}
