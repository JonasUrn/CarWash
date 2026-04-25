import os
import threading
import time
import random
from collections import deque
from dataclasses import dataclass, field

import simpy
import simpy.rt


@dataclass
class _State:
    queue_size: int = 0
    is_serving: bool = False
    service_started_at: float = 0.0
    current_service_dur: float = 0.0
    service_times: deque = field(default_factory=lambda: deque(maxlen=50))
    wait_times: deque = field(default_factory=lambda: deque(maxlen=50))
    cars_served: int = 0
    busy_sec: float = 0.0
    sim_start: float = field(default_factory=time.time)
    lock: threading.Lock = field(default_factory=threading.Lock)


_state = _State()


def _arrivals(env: simpy.Environment, resource: simpy.Resource, mean_iat: float, mean_svc: float):
    while True:
        yield env.timeout(random.expovariate(1 / mean_iat))
        env.process(_serve(env, resource, mean_svc))


def _serve(env: simpy.Environment, resource: simpy.Resource, mean_svc: float):
    arrived = env.now
    with _state.lock:
        _state.queue_size += 1

    with resource.request() as req:
        yield req
        wait = env.now - arrived
        duration = random.expovariate(1 / mean_svc)

        with _state.lock:
            _state.queue_size -= 1
            _state.wait_times.append(wait)
            _state.is_serving = True
            _state.service_started_at = time.time()
            _state.current_service_dur = duration

        yield env.timeout(duration)

        with _state.lock:
            _state.service_times.append(duration)
            _state.busy_sec += duration
            _state.cars_served += 1
            _state.is_serving = False
            _state.service_started_at = 0.0


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
        q = _state.queue_size
        serving = _state.is_serving
        svc_times = list(_state.service_times)
        wait_times = list(_state.wait_times)
        cars = _state.cars_served
        busy = _state.busy_sec
        elapsed = time.time() - _state.sim_start
        cur_dur = _state.current_service_dur
        svc_start = _state.service_started_at

    default_svc = float(os.getenv("MEAN_SVC_SEC", "5"))
    avg_svc = sum(svc_times) / len(svc_times) if svc_times else default_svc
    avg_wait = sum(wait_times) / len(wait_times) if wait_times else 0.0
    utilization = min(1.0, busy / elapsed) if elapsed > 0 else 0.0

    remaining = 0.0
    if serving and svc_start > 0:
        remaining = max(0.0, cur_dur - (time.time() - svc_start))

    return {
        "queue_length": q,
        "is_serving": serving,
        "avg_service_time_sec": round(avg_svc, 1),
        "avg_wait_time_sec": round(avg_wait, 1),
        "utilization": round(utilization, 3),
        "estimated_wait_sec": round(q * avg_svc + remaining, 1),
        "cars_served_total": cars,
    }
