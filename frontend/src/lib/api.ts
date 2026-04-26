const API = "";

const BASE_HEADERS: Record<string, string> = {
  "ngrok-skip-browser-warning": "1",
};

export interface CarInfo {
  id: number;
  waited_sec: number;
}

export interface ServingCar {
  id: number;
  progress: number;
}

export interface QueueStats {
  queue_length: number;
  queue_cars: CarInfo[];
  is_serving: boolean;
  serving_car: ServingCar | null;
  remaining_sec: number;
  avg_service_time_sec: number;
  avg_wait_time_sec: number;
  utilization: number;
  estimated_wait_sec: number;
  cars_served_total: number;
  throughput_per_hour: number;
  paused: boolean;
  manual_only: boolean;
}

export interface SimConfig {
  dist_iat: "constant" | "exponential" | "triangular";
  mean_iat_sec: number;
  constant_iat_sec: number;
  min_iat_sec: number;
  mode_iat_sec: number;
  max_iat_sec: number;
  distribution: "constant" | "exponential" | "triangular";
  constant_sec: number;
  mean_sec: number;
  min_sec: number;
  mode_sec: number;
  max_sec: number;
}

export async function fetchStats(): Promise<QueueStats> {
  const res = await fetch(`${API}/api/stats`, { cache: "no-store", headers: BASE_HEADERS });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function joinQueue(): Promise<{ car_id: number }> {
  const res = await fetch(`${API}/api/join`, { method: "POST", headers: BASE_HEADERS });
  if (!res.ok) throw new Error("Failed to join queue");
  return res.json();
}

export async function fetchConfig(): Promise<SimConfig> {
  const res = await fetch(`${API}/api/config`, { cache: "no-store", headers: BASE_HEADERS });
  if (!res.ok) throw new Error("Failed to fetch config");
  return res.json();
}

export async function updateConfig(config: SimConfig): Promise<SimConfig> {
  const res = await fetch(`${API}/api/config`, {
    method: "POST",
    headers: { ...BASE_HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error("Failed to update config");
  return res.json();
}

export async function controlSimulation(action: "pause" | "resume" | "reset" | "manual_only" | "auto_spawn"): Promise<void> {
  await fetch(`${API}/api/control`, {
    method: "POST",
    headers: { ...BASE_HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
}
