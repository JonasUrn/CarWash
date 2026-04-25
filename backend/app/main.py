import os
from dataclasses import asdict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from app.models import JoinResponse, QueueStats, SimConfigIn, SimConfigOut
from app.qr_gen import make_qr_png
from app.simulation import get_config, get_stats, request_spawn, start_simulation, update_config

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


@app.get("/api/qr")
def qr():
    url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/join"
    return Response(content=make_qr_png(url), media_type="image/png")
