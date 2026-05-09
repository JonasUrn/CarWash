import threading
import time
import random
from collections import deque
from dataclasses import dataclass, field
from typing import Optional

import simpy
import simpy.rt

_car_counter = 0
_spawn_requests: deque = deque()   # tuples of (car_id, box_id)
_paused = threading.Event()
_generation = 0
_paused_sec: float = 0.0   # total accumulated pause duration (real seconds)
_paused_at: float = 0.0    # real timestamp when current pause started; 0 if not paused
_manual_only: bool = False  # when True, auto-spawning is disabled; manual /join still works

QUEUE_LIMIT = 10
NUM_BOXES = 2


@dataclass
class Car:
    id: int
    real_arrived: float   # virtual timestamp at arrival


@dataclass
class SimConfig:
    dist_iat: str = "exponential"
    mean_iat_sec: float = 7.0
    constant_iat_sec: float = 7.0
    min_iat_sec: float = 3.0
    mode_iat_sec: float = 7.0
    max_iat_sec: float = 15.0
    distribution: str = "exponential"
    constant_sec: float = 5.0
    mean_sec: float = 5.0
    min_sec: float = 3.0
    mode_sec: float = 5.0
    max_sec: float = 10.0


@dataclass
class _BoxState:
    queue: list = field(default_factory=list)
    serving_id: Optional[int] = None
    service_started_at: float = 0.0   # virtual timestamp
    current_service_dur: float = 0.0
    service_times: deque = field(default_factory=lambda: deque(maxlen=100))
    wait_times: deque = field(default_factory=lambda: deque(maxlen=100))
    cars_served: int = 0
    busy_sec: float = 0.0


@dataclass
class _State:
    boxes: list = field(default_factory=lambda: [_BoxState(), _BoxState()])
    wait_times_all: list = field(default_factory=list)    # unbounded, for convergence graph
    service_times_all: list = field(default_factory=list)  # unbounded, for convergence graph
    sim_start: float = field(default_factory=time.time)
    lock: threading.Lock = field(default_factory=threading.Lock)


_state = _State()
_config = SimConfig()
_config_lock = threading.Lock()


def _vt() -> float:
    """Virtual timestamp: real time minus all paused duration."""
    total_paused = _paused_sec
    if _paused_at > 0:
        total_paused += time.time() - _paused_at
    return time.time() - total_paused


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


def _sample_iat() -> float:
    with _config_lock:
        dist = _config.dist_iat
        c = _config.constant_iat_sec
        m = _config.mean_iat_sec
        lo, mo, hi = _config.min_iat_sec, _config.mode_iat_sec, _config.max_iat_sec
    if dist == "constant":
        return c
    if dist == "triangular":
        return random.triangular(lo, hi, mo)
    return random.expovariate(1 / m)


def _arrivals(env: simpy.Environment, resources: list, gen: int):
    remaining = _sample_iat()
    while gen == _generation:
        step = min(0.2, remaining)
        yield env.timeout(step)
        if gen != _generation:
            return
        while _spawn_requests:
            car_id, box_id = _spawn_requests.popleft()
            env.process(_serve(env, resources[box_id], box_id, car_id, gen))
        if not _paused.is_set() and not _manual_only:
            remaining -= step
            if remaining <= 0:
                with _state.lock:
                    lens = [len(_state.boxes[i].queue) for i in range(NUM_BOXES)]
                box_id = 0 if lens[0] <= lens[1] else 1
                if lens[box_id] < QUEUE_LIMIT:
                    env.process(_serve(env, resources[box_id], box_id, _next_id(), gen))
                remaining = _sample_iat()


def _serve(env: simpy.Environment, resource: simpy.Resource, box_id: int, car_id: int, gen: int):
    if gen != _generation:
        return
    car = Car(id=car_id, real_arrived=_vt())
    with _state.lock:
        if gen != _generation:
            return
        _state.boxes[box_id].queue.append(car)
    with resource.request() as req:
        yield req
        if gen != _generation:
            with _state.lock:
                box = _state.boxes[box_id]
                box.queue = [c for c in box.queue if c.id != car.id]
            return
        wait = _vt() - car.real_arrived
        duration = _sample_svc()
        with _state.lock:
            box = _state.boxes[box_id]
            box.queue = [c for c in box.queue if c.id != car.id]
            box.wait_times.append(wait)
            box.serving_id = car.id
            box.service_started_at = _vt()
            box.current_service_dur = duration
            _state.wait_times_all.append(wait)
        elapsed = 0.0
        while elapsed < duration:
            yield env.timeout(0.1)
            if gen != _generation:
                with _state.lock:
                    box = _state.boxes[box_id]
                    box.serving_id = None
                    box.service_started_at = 0.0
                return
            if not _paused.is_set():
                elapsed += 0.1
        with _state.lock:
            box = _state.boxes[box_id]
            box.service_times.append(duration)
            box.busy_sec += duration
            box.cars_served += 1
            box.serving_id = None
            box.service_started_at = 0.0
            _state.service_times_all.append(duration)


def request_spawn(box_id: Optional[int] = None) -> Optional[tuple]:
    """Returns (car_id, box_id) on success or None if the chosen box queue is full."""
    with _state.lock:
        if box_id is None:
            lens = [len(_state.boxes[i].queue) for i in range(NUM_BOXES)]
            box_id = 0 if lens[0] <= lens[1] else 1
        if len(_state.boxes[box_id].queue) >= QUEUE_LIMIT:
            return None
    car_id = _next_id()
    _spawn_requests.append((car_id, box_id))
    return (car_id, box_id)


def set_manual_only(enabled: bool) -> None:
    global _manual_only
    _manual_only = enabled


def get_manual_only() -> bool:
    return _manual_only


def pause_simulation():
    global _paused_at
    _paused_at = time.time()
    _paused.set()


def resume_simulation():
    global _paused_sec, _paused_at
    if _paused_at > 0:
        _paused_sec += time.time() - _paused_at
        _paused_at = 0.0
    _paused.clear()


def reset_simulation():
    global _car_counter, _state, _generation, _paused_sec, _paused_at, _manual_only
    _generation += 1
    _paused.clear()
    _paused_sec = 0.0
    _paused_at = 0.0
    _car_counter = 0
    _manual_only = False
    _state = _State()
    _spawn_requests.clear()
    start_simulation()


def start_simulation():
    gen = _generation

    def _run():
        env = simpy.rt.RealtimeEnvironment(factor=1.0, strict=False)
        resources = [simpy.Resource(env, capacity=1) for _ in range(NUM_BOXES)]
        env.process(_arrivals(env, resources, gen))
        env.run()

    threading.Thread(target=_run, daemon=True).start()


def get_stats() -> dict:
    with _state.lock:
        now = _vt()
        sim_start = _state.sim_start
        elapsed = now - sim_start

        boxes_data = []
        total_cars = 0

        for box_id in range(NUM_BOXES):
            box = _state.boxes[box_id]
            queue_snap = list(box.queue)
            serving_id = box.serving_id
            svc_start = box.service_started_at
            cur_dur = box.current_service_dur
            svc_times = list(box.service_times)
            wait_times = list(box.wait_times)

            avg_svc = sum(svc_times) / len(svc_times) if svc_times else 0.0
            avg_wait = sum(wait_times) / len(wait_times) if wait_times else 0.0
            utilization = min(1.0, box.busy_sec / elapsed) if elapsed > 0 else 0.0

            queue_cars = [
                {"id": c.id, "waited_sec": round(now - c.real_arrived, 1)}
                for c in queue_snap
            ]

            serving_car = None
            remaining = 0.0
            if serving_id is not None and svc_start > 0 and cur_dur > 0:
                elapsed_svc = now - svc_start
                remaining = max(0.0, cur_dur - elapsed_svc)
                serving_car = {
                    "id": serving_id,
                    "progress": round(min(1.0, elapsed_svc / cur_dur), 3),
                }

            boxes_data.append({
                "box_id": box_id,
                "queue_length": len(queue_snap),
                "queue_cars": queue_cars,
                "is_serving": serving_id is not None,
                "serving_car": serving_car,
                "remaining_sec": round(remaining, 1),
                "avg_service_time_sec": round(avg_svc, 1),
                "avg_wait_time_sec": round(avg_wait, 1),
                "utilization": round(utilization, 3),
                "estimated_wait_sec": round(len(queue_snap) * avg_svc + remaining, 1),
                "cars_served_total": box.cars_served,
            })
            total_cars += box.cars_served

    throughput = total_cars / (elapsed / 3600) if elapsed > 0 else 0.0

    return {
        "boxes": boxes_data,
        "total_cars_served": total_cars,
        "throughput_per_hour": round(throughput, 1),
        "sim_elapsed_sec": round(elapsed, 1),
        "paused": _paused.is_set(),
        "manual_only": _manual_only,
    }


def get_graph_stats() -> dict:
    with _state.lock:
        wait_times = list(_state.wait_times_all)
        service_times = list(_state.service_times_all)

    def running_mean(times: list) -> list:
        result = []
        total = 0.0
        for i, t in enumerate(times):
            total += t
            result.append(round(total / (i + 1), 2))
        return result

    return {
        "wait_time_series": running_mean(wait_times),
        "service_time_series": running_mean(service_times),
    }
