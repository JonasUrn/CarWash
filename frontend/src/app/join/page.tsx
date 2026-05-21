"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchStats, joinQueue, QueueStats } from "@/lib/api";

function fmt(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`;
  return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
}

const QUEUE_LIMIT = 10;

export default function JoinPage() {
  const router = useRouter();
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [decided, setDecided] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const load = () => fetchStats().then(setStats).catch(() => {});
    load();
    const id = setInterval(load, 1500);
    return () => clearInterval(id);
  }, []);

  const handleJoin = async (boxId: number) => {
    if (decided) return;
    setErrorMsg(null);
    setDecided(true);
    try {
      const { car_id, box_id } = await joinQueue(boxId);
      router.replace(`/stats?car_id=${car_id}&box_id=${box_id}`);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 409) {
        setErrorMsg("Eilė pilna — pasirinkite kitą boksą.");
      } else {
        setErrorMsg("Klaida. Bandykite dar kartą.");
      }
      setDecided(false);
    }
  };

  const handleLeave = () => {
    if (decided) return;
    setDecided(true);
    router.replace("/stats");
  };

  const boxes = stats?.boxes ?? null;
  const allFull = boxes ? boxes.every((b) => b.queue_length >= QUEUE_LIMIT) : false;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: 24,
        maxWidth: 400,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          color: "#2563eb",
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
        }}
      >
        AutoWash
      </div>

      {/* All-full banner */}
      {allFull && (
        <div
          style={{
            width: "100%",
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            borderRadius: 10,
            padding: "12px 16px",
            textAlign: "center",
            color: "#991b1b",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Eilė per ilga — bandykite vėliau (10/10)
        </div>
      )}

      {/* Error message */}
      {errorMsg && (
        <div
          style={{
            width: "100%",
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            borderRadius: 10,
            padding: "10px 14px",
            color: "#991b1b",
            fontSize: 13,
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Box cards */}
      <div style={{ width: "100%", display: "flex", gap: 12 }}>
        {[0, 1].map((boxId) => {
          const box = boxes?.[boxId];
          const full = (box?.queue_length ?? 0) >= QUEUE_LIMIT;
          return (
            <div
              key={boxId}
              style={{
                flex: 1,
                background: "#ffffff",
                border: `1px solid ${full ? "#fca5a5" : "#e5e7eb"}`,
                borderRadius: 12,
                padding: "16px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  color: "#6b7280",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontWeight: 600,
                }}
              >
                Boksas {boxId + 1}
              </div>

              {full && (
                <div
                  style={{
                    background: "#fee2e2",
                    color: "#991b1b",
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 6,
                    padding: "3px 8px",
                    textAlign: "center",
                  }}
                >
                  Eilė pilna
                </div>
              )}

              {[
                { label: "Laukia", val: box ? `${box.queue_length} / ${QUEUE_LIMIT}` : "—" },
                { label: "Laukimas", val: box ? fmt(box.estimated_wait_sec) : "—" },
                { label: "Boksas", val: box?.is_serving ? "Plaunama" : "Laisvas" },
              ].map(({ label, val }) => (
                <div
                  key={label}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span style={{ color: "#6b7280", fontSize: 12 }}>{label}</span>
                  <span style={{ color: "#111827", fontSize: 12, fontWeight: 600 }}>{val}</span>
                </div>
              ))}

              {!decided && !allFull && (
                <button
                  onClick={() => handleJoin(boxId)}
                  disabled={full}
                  style={{
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 0",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: full ? "not-allowed" : "pointer",
                    width: "100%",
                    marginTop: 4,
                    background: full ? "#f1f0ef" : "#1d4ed8",
                    color: full ? "#9ca3af" : "#fff",
                  }}
                >
                  {full ? "Pilna" : "Laukti čia"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Leave button */}
      {!decided && (
        <button
          onClick={handleLeave}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: "12px 0",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            width: "100%",
            background: "#f1f0ef",
            color: "#57534e",
          }}
        >
          Išeiti
        </button>
      )}

      {decided && !errorMsg && (
        <p style={{ color: "#6b7280", fontSize: 14 }}>Palaukite...</p>
      )}
    </main>
  );
}
