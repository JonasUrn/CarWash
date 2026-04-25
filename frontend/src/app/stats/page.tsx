import { Suspense } from "react";
import StatsClient from "@/components/StatsClient";

export default function StatsPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p style={{ color: "#6b7280" }}>Loading...</p>
        </main>
      }
    >
      <StatsClient />
    </Suspense>
  );
}
