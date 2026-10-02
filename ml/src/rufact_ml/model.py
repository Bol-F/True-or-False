from __future__ import annotations

import hashlib
import json
import math
import os
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import numpy as np

from rufact_ml.schemas import (
    AnalysisMeta,
    AnalysisSignal,
    EvidenceSpan,
    ModelInfoResponse,
    PredictionResponse,
)

MAX_TEXT_LENGTH = 5000
DEFAULT_ARTIFACT_PATH = Path(__file__).resolve().parents[2] / "artifacts" / "model.joblib"


def normalize_for_model(text: str) -> str:
    normalized = unicodedata.normalize("NFKC", text)
    return re.sub(r"\s+", " ", normalized).strip()[:MAX_TEXT_LENGTH]


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _expected_artifact_hash(path: Path) -> str | None:
    configured = os.getenv("RUFACT_MODEL_SHA256", "").strip().lower()
    if configured:
        return configured

    manifest_path = path.with_name("artifact-manifest.json")
    if not manifest_path.exists():
        return None

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    value = manifest.get("sha256")
    return value.lower() if isinstance(value, str) else None


def _find_span(text: str, feature: str) -> tuple[int, int, str] | None:
    tokens = feature.split()
    if not tokens or len(feature) > 90:
        return None

    pattern = r"\s+".join(re.escape(token) for token in tokens)
    match = re.search(pattern, text, flags=re.IGNORECASE | re.UNICODE)
    if not match:
        return None
    return match.start(), match.end(), text[match.start() : match.end()]


@dataclass(slots=True)
class ModelBundle:
    artifact: dict[str, Any]

    @property
    def version(self) -> str:
        return str(self.artifact["model_version"])

    @property
    def metrics(self) -> dict[str, Any]:
        return dict(self.artifact["metrics"])

    @property
    def base_model(self) -> Any:
        return self.artifact["base_model"]

    @property
    def calibrator(self) -> Any:
        return self.artifact["calibrator"]

    def _fake_probability(self, text: str) -> float:
        normalized = normalize_for_model(text)
        raw_probability = float(self.base_model.predict_proba([normalized])[0, 1])
        clipped = min(max(raw_probability, 1e-8), 1 - 1e-8)
        log_odds = math.log(clipped / (1 - clipped))
        calibrated = float(self.calibrator.predict_proba([[log_odds]])[0, 1])
        return min(max(calibrated, 0.0), 1.0)

    def _word_explanation_features(self, text: str) -> tuple[Any, np.ndarray, np.ndarray]:
        classifier = self.base_model.named_steps["classifier"]
        steps = self.base_model.named_steps
        if "tfidf" in steps:
            vectorizer = steps["tfidf"]
            return (
                vectorizer.transform([text]),
                vectorizer.get_feature_names_out(),
                classifier.coef_[0],
            )

        features = steps["features"]
        transformers = dict(features.transformer_list)
        vectorizer = transformers["word"]
        names = vectorizer.get_feature_names_out()
        weight = float((features.transformer_weights or {}).get("word", 1.0))
        return vectorizer.transform([text]), names, classifier.coef_[0][: len(names)] * weight

    def _explanations(
        self,
        original_text: str,
        normalized_text: str,
        label: str,
        limit: int = 4,
    ) -> tuple[list[AnalysisSignal], list[EvidenceSpan]]:
        vector, feature_names, coefficients = self._word_explanation_features(normalized_text)
        row = vector.tocsr()
        contributions = row.data * coefficients[row.indices]
        direction = 1 if label == "FAKE" else -1
        ranked = np.argsort(-(contributions * direction))
        tone = "risk" if label == "FAKE" else "reassuring"
        signals: list[AnalysisSignal] = []
        evidence: list[EvidenceSpan] = []
        occupied: list[tuple[int, int]] = []

        for position in ranked:
            contribution = float(contributions[position]) * direction
            if contribution <= 0:
                break

            feature = str(feature_names[row.indices[position]])
            span = _find_span(original_text, feature)
            if span is None:
                continue
            start, end, quote = span
            if any(start < used_end and end > used_start for used_start, used_end in occupied):
                continue

            signal_id = f"model-feature-{len(signals) + 1}"
            evidence_id = f"{signal_id}-evidence"
            severity = "high" if len(signals) == 0 else "medium" if len(signals) < 3 else "low"
            signals.append(
                AnalysisSignal(
                    id=signal_id,
                    title=f"Статистический маркер: «{quote}»",
                    description=(
                        f"Эта фраза внесла заметный вклад в выбор класса {label}. "
                        "Это объяснение решения модели, а не доказательство истинности факта."
                    ),
                    tone=tone,
                    severity=severity,
                    evidenceIds=[evidence_id],
                )
            )
            evidence.append(
                EvidenceSpan(
                    id=evidence_id,
                    start=start,
                    end=end,
                    quote=quote,
                    signalId=signal_id,
                    tone=tone,
                )
            )
            occupied.append((start, end))
            if len(signals) >= limit:
                break

        return signals, evidence

    def predict(self, text: str) -> PredictionResponse:
        normalized = normalize_for_model(text)
        fake_probability = self._fake_probability(normalized)
        label = "FAKE" if fake_probability >= 0.5 else "REAL"
        confidence = fake_probability if label == "FAKE" else 1 - fake_probability
        signals, evidence = self._explanations(text, normalized, label)
        explanation = (
            f"ML-классификатор отнёс текст к классу {label} по статистическому сочетанию "
            "слов и фраз. Выделенные фрагменты показывают вклад признаков модели; "
            "внешние источники и фактическая истинность утверждений не проверялись."
        )
        return PredictionResponse(
            label=label,
            confidence=round(confidence, 6),
            explanation=explanation,
            signals=signals,
            evidence=evidence,
            meta=AnalysisMeta(engineVersion=self.version),
        )

    def info(self) -> ModelInfoResponse:
        evaluation = self.metrics["evaluation"]
        return ModelInfoResponse(
            modelVersion=self.version,
            modelName=str(self.artifact["model_name"]),
            trainedAt=str(self.artifact["trained_at"]),
            maxTextLength=MAX_TEXT_LENGTH,
            evaluation=evaluation,
            limitations=list(self.metrics["limitations"]),
        )


def load_model_bundle(path: Path | None = None) -> ModelBundle:
    artifact_path = path or Path(os.getenv("RUFACT_MODEL_PATH", str(DEFAULT_ARTIFACT_PATH)))
    artifact_path = artifact_path.resolve()
    if not artifact_path.is_file():
        raise FileNotFoundError(
            f"Model artifact not found at {artifact_path}. Run `uv run --project ml rufact-train`."
        )

    expected_hash = _expected_artifact_hash(artifact_path)
    if expected_hash and _sha256(artifact_path) != expected_hash:
        raise RuntimeError("Model artifact checksum does not match artifact-manifest.json.")

    artifact = joblib.load(artifact_path)
    required = {
        "schema_version",
        "model_name",
        "model_version",
        "trained_at",
        "base_model",
        "calibrator",
        "metrics",
    }
    if not isinstance(artifact, dict) or not required.issubset(artifact):
        raise RuntimeError("Model artifact has an unsupported shape.")
    if artifact["schema_version"] != 1:
        raise RuntimeError("Model artifact schema version is not supported.")
    return ModelBundle(artifact=artifact)
