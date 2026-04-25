from pydantic import BaseModel


class QueueStats(BaseModel):
    queue_length: int
    is_serving: bool
    avg_service_time_sec: float
    avg_wait_time_sec: float
    utilization: float
    estimated_wait_sec: float
    cars_served_total: int
