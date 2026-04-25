import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from app.models import QueueStats
from app.qr_gen import make_qr_png
from app.simulation import get_stats, request_spawn, start_simulation

app = FastAPI(title="CarWash Simulator")

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


@app.get("/api/qr")
def qr():
    url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/stats"
    return Response(content=make_qr_png(url), media_type="image/png")
