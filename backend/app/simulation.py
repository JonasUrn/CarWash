import os
import threading
import time
import random
from collections import deque
from dataclasses import dataclass, field

import simpy
import simpy.rt

_car_counter = 0
_spawn_requests: deque = deque()


@dataclass
class Car:
    id: int
    real_arrived: float


@dataclass
class _State:
    queue: list = field(default_factory=list)
    serving_id: int | None = None
    service_started_at: float = 0.0
    current_service_dur: float = 0.0
    service_times: deque = field(default_factory=lambda: deque(maxlen=50))
    wait_times: deque = field(default_factory=lambda: deque(maxlen=50))
    cars_served: int = 0
    busy_sec: float = 0.0
    sim_start: float = field(default_factory=time.time)
    lock: threading.Lock = field(default_factory=threading.Lock)


_state = _State()


def _next_id() -> int:
    global _car_counter
    _car_counter += 1
    return _car_counter


def _arrivals(env: simpy.Environment, resource: simpy.Resource, mean_iat: float, mean_svc: float):
    next_in = random.expovariate(1 / mean_iat)
    while True:
        step = min(0.2, next_in)
        yield env.timeout(step)
        next_in -= step

        while _spawn_requests:
            _spawn_requests.popleft()
            env.process(_serve(env, resource, mean_svc))

        if next_in <= 0:
            env.process(_serve(env, resource, mean_svc))
            next_in = random.expovariate(1 / mean_iat)


def _serve(env: simpy.Environment, resource: simpy.Resource, mean_svc: float):
    car = Car(id=_next_id(), real_arrived=time.time())
    with _state.lock:
        _state.queue.append(car)

    with resource.request() as req:
        yield req
        wait = time.time() - car.real_arrived
        duration = random.expovariate(1 / mean_svc)

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


def request_spawn():
    _spawn_requests.append(1)


def start_simulation():
    mean_iat = float(os.getenv("MEAN_IAT_SEC", "7"))
    mean_svc = float(os.getenv("MEAN_SVC_SEC", "5"))

    def _run():
        env = simpy.rt.RealtimeEnvironment(factor=1.0, strict=False)
        resource = simpy.Resource(env, capacity=1)
        env.process(_arrivals(env, resource, mean_iat, mean_svc))
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
    default_svc = float(os.getenv("MEAN_SVC_SEC", "5"))
    avg_svc = sum(svc_times) / len(svc_times) if svc_times else default_svc
    avg_wait = sum(wait_times) / len(wait_times) if wait_times else 0.0
    utilization = min(1.0, busy / elapsed) if elapsed > 0 else 0.0

    queue_cars = [
        {"id": c.id, "waited_sec": round(now - c.real_arrived, 1)}
        for c in queue_snap
    ]

    serving_car = None
    remaining = 0.0
    if serving_id is not None and svc_start > 0 and cur_dur > 0:
        elapsed_svc = now - svc_start
        progress = min(1.0, elapsed_svc / cur_dur)
        remaining = max(0.0, cur_dur - elapsed_svc)
        serving_car = {"id": serving_id, "progress": round(progress, 3)}

    return {
        "queue_length": len(queue_snap),
        "queue_cars": queue_cars,
        "is_serving": serving_id is not None,
        "serving_car": serving_car,
        "avg_service_time_sec": round(avg_svc, 1),
        "avg_wait_time_sec": round(avg_wait, 1),
        "utilization": round(utilization, 3),
        "estimated_wait_sec": round(len(queue_snap) * avg_svc + remaining, 1),
        "cars_served_total": cars,
    }
