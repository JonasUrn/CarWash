"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { joinQueue } from "@/lib/api";

export default function JoinPage() {
  const router = useRouter();
  const done = useRef(false);
  const [msg, setMsg] = useState("Prisijungiama prie eiles...");

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    joinQueue()
      .then(({ car_id }) => router.replace(`/stats?car_id=${car_id}`))
      .catch(() => setMsg("Nepavyko prisijungti prie plovyklos sistemos."));
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 24,
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
      <p style={{ color: "#6b7280", fontSize: 15 }}>{msg}</p>
    </main>
  );
}
