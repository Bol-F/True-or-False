from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from starlette.concurrency import run_in_threadpool

from rufact_ml.model import ModelBundle, load_model_bundle
from rufact_ml.schemas import (
    HealthResponse,
    ModelInfoResponse,
    PredictionRequest,
    PredictionResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.model = load_model_bundle()
    yield
    app.state.model = None


app = FastAPI(
    title="RuFact ML API",
    version="1.0.0",
    description=(
        "Russian text-style classification API. Predictions are probabilistic "
        "and do not constitute source-based fact-checking."
    ),
    lifespan=lifespan,
)


def _model(request: Request) -> ModelBundle:
    return request.app.state.model


@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health(request: Request) -> HealthResponse:
    model = getattr(request.app.state, "model", None)
    return HealthResponse(ready=model is not None, modelVersion=model.version if model else None)


@app.get("/model-info", response_model=ModelInfoResponse, tags=["model"])
async def model_info(request: Request) -> ModelInfoResponse:
    return _model(request).info()


@app.post("/predict", response_model=PredictionResponse, tags=["model"])
async def predict(payload: PredictionRequest, request: Request) -> PredictionResponse:
    return await run_in_threadpool(_model(request).predict, payload.text)
