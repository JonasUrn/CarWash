import os
from dataclasses import asdict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from app.models import ControlAction, JoinResponse, QueueStats, SimConfigIn, SimConfigOut
from app.qr_gen import make_qr_png
from app.simulation import (
    get_config, get_stats, pause_simulation, request_spawn,
    reset_simulation, resume_simulation, set_manual_only, start_simulation, update_config,
)

app = FastAPI(title="CarWash Simulator v2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    start_simulation()


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/api/stats", response_model=QueueStats)
def stats():
    return get_stats()


@app.post("/api/spawn")
def spawn():
    request_spawn()
    return {"spawned": True}


@app.post("/api/join", response_model=JoinResponse)
def join():
    return {"car_id": request_spawn()}


@app.get("/api/config", response_model=SimConfigOut)
def get_sim_config():
    return asdict(get_config())


@app.post("/api/config", response_model=SimConfigOut)
def set_sim_config(body: SimConfigIn):
    update_config(**{k: v for k, v in body.model_dump().items() if v is not None})
    return asdict(get_config())


@app.post("/api/control")
def control(body: ControlAction):
    if body.action == "pause":
        pause_simulation()
    elif body.action == "resume":
        resume_simulation()
    elif body.action == "reset":
        reset_simulation()
    elif body.action == "manual_only":
        set_manual_only(True)
    elif body.action == "auto_spawn":
        set_manual_only(False)
    return {"ok": True}


@app.get("/api/qr")
def qr():
    url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/join"
    return Response(content=make_qr_png(url), media_type="image/png")
