from typing import Optional
from pydantic import BaseModel


class CarInfo(BaseModel):
    id: int
    waited_sec: float


class ServingCar(BaseModel):
    id: int
    progress: float


class QueueStats(BaseModel):
    queue_length: int
    queue_cars: list[CarInfo]
    is_serving: bool
    serving_car: Optional[ServingCar]
    avg_service_time_sec: float
    avg_wait_time_sec: float
    utilization: float
    estimated_wait_sec: float
    cars_served_total: int
