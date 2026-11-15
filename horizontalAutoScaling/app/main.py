
import math
import socket
import time

from fastapi import FastAPI, Query

app = FastAPI(title="Kubernetes HPA Load Test Service")


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "pod": socket.gethostname()
    }


@app.get("/ready")
def readiness_check():
    return {"status": "ready"}


@app.get("/compute")
def cpu_intensive_task(
    iterations: int = Query(
        default=200_000,
        ge=1_000,
        le=5_000_000
    )
):
    start = time.perf_counter()

    acc = 0.0

    for i in range(1, iterations):
        acc += math.sqrt(i) * math.sin(i)

    elapsed_ms = round(
        (time.perf_counter() - start) * 1000, 2
    )

    return {
        "pod": socket.gethostname(),
        "iterations": iterations,
        "elapsed_ms": elapsed_ms,
        "result": round(acc, 4)
    }
