const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
  avg_service_time_sec: number;
  avg_wait_time_sec: number;
  utilization: number;
  estimated_wait_sec: number;
  cars_served_total: number;
}

export async function fetchStats(): Promise<QueueStats> {
  const res = await fetch(`${API}/api/stats`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function spawnCar(): Promise<void> {
  await fetch(`${API}/api/spawn`, { method: "POST" });
}
