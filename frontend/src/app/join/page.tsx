"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchStats, joinQueue, QueueStats } from "@/lib/api";

function fmt(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`;
  return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
}

const btnBase: React.CSSProperties = {
  border: "none",
  borderRadius: 10,
  padding: "14px 0",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  width: "100%",
};

export default function JoinPage() {
  const router = useRouter();
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [decided, setDecided] = useState(false);

  useEffect(() => {
    const load = () => fetchStats().then(setStats).catch(() => {});
    load();
    const id = setInterval(load, 1500);
    return () => clearInterval(id);
  }, []);

  const handleJoin = async () => {
    if (decided) return;
    setDecided(true);
    try {
      const { car_id } = await joinQueue();
      router.replace(`/stats?car_id=${car_id}`);
    } catch {
      setDecided(false);
    }
  };

  const handleLeave = () => {
    if (decided) return;
    setDecided(true);
    router.replace("/stats");
  };

  const s = stats;

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
        maxWidth: 360,
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

      {/* Queue stats */}
      <div
        style={{
          width: "100%",
          background: "#0d1117",
          border: "1px solid #1f2937",
          borderRadius: 12,
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {[
          { label: "Laukia eilėje", val: s ? `${s.queue_length} mašin${s.queue_length === 1 ? "a" : "os"}` : "—" },
          { label: "Apytiksl. laukimas", val: s ? fmt(s.estimated_wait_sec) : "—" },
          { label: "Boksas", val: s?.is_serving ? "Plaunama" : "Laisvas" },
        ].map(({ label, val }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#6b7280", fontSize: 13 }}>{label}</span>
            <span style={{ color: "#f9fafb", fontSize: 13, fontWeight: 600 }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Buttons — hidden after decision */}
      {!decided && (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={handleJoin}
            style={{ ...btnBase, background: "#1d4ed8", color: "#fff" }}
          >
            Laukti eilėje
          </button>
          <button
            onClick={handleLeave}
            style={{ ...btnBase, background: "#1c1917", color: "#78716c", border: "1px solid #292524" }}
          >
            Išeiti
          </button>
        </div>
      )}

      {decided && (
        <p style={{ color: "#6b7280", fontSize: 14 }}>Palaukite...</p>
      )}
    </main>
  );
}
