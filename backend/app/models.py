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
    remaining_sec: float
    avg_service_time_sec: float
    avg_wait_time_sec: float
    utilization: float
    estimated_wait_sec: float
    cars_served_total: int
    throughput_per_hour: float


class SimConfigIn(BaseModel):
    mean_iat_sec: Optional[float] = None
    distribution: Optional[str] = None
    constant_sec: Optional[float] = None
    mean_sec: Optional[float] = None
    min_sec: Optional[float] = None
    mode_sec: Optional[float] = None
    max_sec: Optional[float] = None


class SimConfigOut(BaseModel):
    mean_iat_sec: float
    distribution: str
    constant_sec: float
    mean_sec: float
    min_sec: float
    mode_sec: float
    max_sec: float


class JoinResponse(BaseModel):
    car_id: int
