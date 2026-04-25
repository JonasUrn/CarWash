import os
import threading
import time
import random
from collections import deque
from dataclasses import dataclass, field
from typing import Optional

import simpy
import simpy.rt

_car_counter = 0
_spawn_requests: deque = deque()


@dataclass
class Car:
    id: int
    real_arrived: float


@dataclass
class SimConfig:
    mean_iat_sec: float = 7.0
    distribution: str = "exponential"
    constant_sec: float = 5.0
    mean_sec: float = 5.0
    min_sec: float = 3.0
    mode_sec: float = 5.0
    max_sec: float = 10.0


@dataclass
class _State:
    queue: list = field(default_factory=list)
    serving_id: Optional[int] = None
    service_started_at: float = 0.0
    current_service_dur: float = 0.0
    service_times: deque = field(default_factory=lambda: deque(maxlen=100))
    wait_times: deque = field(default_factory=lambda: deque(maxlen=100))
    cars_served: int = 0
    busy_sec: float = 0.0
    sim_start: float = field(default_factory=time.time)
    lock: threading.Lock = field(default_factory=threading.Lock)


_state = _State()
_config = SimConfig()
_config_lock = threading.Lock()


def get_config() -> SimConfig:
    with _config_lock:
        return SimConfig(**{f: getattr(_config, f) for f in SimConfig.__dataclass_fields__})


def update_config(**kwargs):
    with _config_lock:
        for k, v in kwargs.items():
            if hasattr(_config, k):
                setattr(_config, k, v)


def _next_id() -> int:
    global _car_counter
    _car_counter += 1
    return _car_counter


def _sample_svc() -> float:
    with _config_lock:
        dist = _config.distribution
        c = _config.constant_sec
        m = _config.mean_sec
        lo, mo, hi = _config.min_sec, _config.mode_sec, _config.max_sec
    if dist == "constant":
        return c
    if dist == "triangular":
        return random.triangular(lo, hi, mo)
    return random.expovariate(1 / m)


def _iat() -> float:
    with _config_lock:
        mean = _config.mean_iat_sec
    return random.expovariate(1 / mean)


def _arrivals(env: simpy.Environment, resource: simpy.Resource):
    remaining = _iat()
    while True:
        step = min(0.2, remaining)
        yield env.timeout(step)
        remaining -= step
        while _spawn_requests:
            env.process(_serve(env, resource, _spawn_requests.popleft()))
        if remaining <= 0:
            env.process(_serve(env, resource, _next_id()))
            remaining = _iat()


def _serve(env: simpy.Environment, resource: simpy.Resource, car_id: int):
    car = Car(id=car_id, real_arrived=time.time())
    with _state.lock:
        _state.queue.append(car)
    with resource.request() as req:
        yield req
        wait = time.time() - car.real_arrived
        duration = _sample_svc()
        with _state.lock:
            _state.queue = [c for c in _state.queue if c.id != car.id]
            _state.wait_times.append(wait)
            _state.serving_id = car.id
            _state.service_started_at = time.time()
            _state.current_service_dur = duration
        yield env.timeout(duration)
        with _state.lock:
            _state.service_times.append(duration)
            _state.busy_sec += duration
            _state.cars_served += 1
            _state.serving_id = None
            _state.service_started_at = 0.0


def request_spawn() -> int:
    car_id = _next_id()
    _spawn_requests.append(car_id)
    return car_id


def start_simulation():
    def _run():
        env = simpy.rt.RealtimeEnvironment(factor=1.0, strict=False)
        resource = simpy.Resource(env, capacity=1)
        env.process(_arrivals(env, resource))
        env.run()
    threading.Thread(target=_run, daemon=True).start()


def get_stats() -> dict:
    with _state.lock:
        queue_snap = list(_state.queue)
        serving_id = _state.serving_id
        svc_start = _state.service_started_at
        cur_dur = _state.current_service_dur
        svc_times = list(_state.service_times)
        wait_times = list(_state.wait_times)
        cars = _state.cars_served
        busy = _state.busy_sec
        elapsed = time.time() - _state.sim_start

    now = time.time()
    with _config_lock:
        default_svc = _config.mean_sec

    avg_svc = sum(svc_times) / len(svc_times) if svc_times else default_svc
    avg_wait = sum(wait_times) / len(wait_times) if wait_times else 0.0
    utilization = min(1.0, busy / elapsed) if elapsed > 0 else 0.0
    throughput = cars / (elapsed / 3600) if elapsed > 0 else 0.0

    queue_cars = [
        {"id": c.id, "waited_sec": round(now - c.real_arrived, 1)}
        for c in queue_snap
    ]

    serving_car = None
    remaining = 0.0
    if serving_id is not None and svc_start > 0 and cur_dur > 0:
        elapsed_svc = now - svc_start
        remaining = max(0.0, cur_dur - elapsed_svc)
        serving_car = {"id": serving_id, "progress": round(min(1.0, elapsed_svc / cur_dur), 3)}

    return {
        "queue_length": len(queue_snap),
        "queue_cars": queue_cars,
        "is_serving": serving_id is not None,
        "serving_car": serving_car,
        "remaining_sec": round(remaining, 1),
        "avg_service_time_sec": round(avg_svc, 1),
        "avg_wait_time_sec": round(avg_wait, 1),
        "utilization": round(utilization, 3),
        "estimated_wait_sec": round(len(queue_snap) * avg_svc + remaining, 1),
        "cars_served_total": cars,
        "throughput_per_hour": round(throughput, 1),
    }
