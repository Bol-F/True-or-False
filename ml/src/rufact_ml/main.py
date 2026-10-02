from __future__ import annotations

import asyncio
import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool
from starlette.middleware.trustedhost import TrustedHostMiddleware

from rufact_ml.auth import require_service_jwt
from rufact_ml.model import ModelBundle, load_model_bundle
from rufact_ml.schemas import (
    HealthResponse,
    ModelInfoResponse,
    PredictionRequest,
    PredictionResponse,
)

load_dotenv(Path.cwd() / ".env.local", override=False)

MAX_BODY_BYTES = 24_000


def _positive_int(name: str, fallback: int) -> int:
    try:
        value = int(os.getenv(name, ""))
    except ValueError:
        return fallback
    return value if value > 0 else fallback


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.model = load_model_bundle()
    app.state.predict_semaphore = asyncio.Semaphore(
        _positive_int("RUFACT_MAX_CONCURRENT_PREDICTIONS", 4)
    )
    yield
    app.state.model = None


is_production = os.getenv("RUFACT_ENV", "development").strip().lower() == "production"
docs_enabled = not is_production or os.getenv("RUFACT_API_DOCS_ENABLED", "").lower() == "true"

app = FastAPI(
    title="RuFact ML API",
    version="1.0.0",
    description=(
        "Russian text-style classification API. Predictions are probabilistic "
        "and do not constitute source-based fact-checking."
    ),
    lifespan=lifespan,
    docs_url="/docs" if docs_enabled else None,
    redoc_url="/redoc" if docs_enabled else None,
    openapi_url="/openapi.json" if docs_enabled else None,
)

allowed_hosts = [
    host.strip()
    for host in os.getenv("RUFACT_ALLOWED_HOSTS", "").split(",")
    if host.strip()
]
if allowed_hosts:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)


@app.middleware("http")
async def security_boundary(request: Request, call_next):
    declared_length = request.headers.get("content-length")
    if request.url.path == "/predict" and declared_length:
        try:
            if int(declared_length) > MAX_BODY_BYTES:
                return JSONResponse(
                    {"detail": "Request body is too large."},
                    status_code=413,
                )
        except ValueError:
            return JSONResponse({"detail": "Invalid Content-Length."}, status_code=400)

    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response


def _model(request: Request) -> ModelBundle:
    return request.app.state.model


@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health(request: Request) -> HealthResponse:
    model = getattr(request.app.state, "model", None)
    return HealthResponse(ready=model is not None, modelVersion=model.version if model else None)


@app.get("/model-info", response_model=ModelInfoResponse, tags=["model"])
async def model_info(request: Request) -> ModelInfoResponse:
    return _model(request).info()


@app.post(
    "/predict",
    response_model=PredictionResponse,
    tags=["model"],
    dependencies=[Depends(require_service_jwt)],
)
async def predict(payload: PredictionRequest, request: Request) -> PredictionResponse:
    async with request.app.state.predict_semaphore:
        return await run_in_threadpool(_model(request).predict, payload.text)
