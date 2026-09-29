from __future__ import annotations

import argparse
import hashlib
import json
import re
import urllib.request
from collections import Counter
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import sklearn
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    log_loss,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedGroupKFold, StratifiedKFold, cross_val_predict
from sklearn.pipeline import Pipeline

from rufact_ml import MODEL_VERSION
from rufact_ml.model import MAX_TEXT_LENGTH, normalize_for_model

SEED = 20260929
DATASET_REVISION = "bd9bdd36d1171f0031cc448c808ebee6ecacd6d0"
MODEL_NAME = "RuFact TF-IDF + Logistic Regression (RU)"
CALIBRATION_CANDIDATES = (1.0, 10.0, 100.0)

ML_ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = ML_ROOT / "data" / "raw"
ARTIFACT_DIR = ML_ROOT / "artifacts"


@dataclass(frozen=True, slots=True)
class DatasetFile:
    filename: str
    sha256: str

    @property
    def url(self) -> str:
        return (
            "https://raw.githubusercontent.com/Anargul-Aimuratovna/"
            f"news-veracity-corpus/{DATASET_REVISION}/data/{self.filename}"
        )


MAIN_FILE = DatasetFile(
    filename="corpus_labelstudio_export.json",
    sha256="aa632a5e2f17389d0eba55823d8bc9b625e7572ac74101f99a67dcb5d24bad3f",
)
EXTERNAL_FILE = DatasetFile(
    filename="external_validation_set.json",
    sha256="38ef928eaab90188013f9cc2ec9432f5d28b680491885a40837aa666f000b2b0",
)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def ensure_dataset_file(spec: DatasetFile, force: bool = False) -> Path:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    destination = RAW_DIR / spec.filename
    if destination.exists() and not force and sha256_file(destination) == spec.sha256:
        return destination

    request = urllib.request.Request(spec.url, headers={"User-Agent": "RuFact-ML/1.0"})
    temporary = destination.with_suffix(destination.suffix + ".tmp")
    with urllib.request.urlopen(request, timeout=60) as response, temporary.open("wb") as output:
        while chunk := response.read(1024 * 1024):
            output.write(chunk)

    actual_hash = sha256_file(temporary)
    if actual_hash != spec.sha256:
        temporary.unlink(missing_ok=True)
        raise RuntimeError(
            f"Checksum mismatch for {spec.filename}: expected {spec.sha256}, got {actual_hash}."
        )
    temporary.replace(destination)
    return destination


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _main_label(row: dict[str, Any]) -> int:
    news_id = str(row["data"]["NEWS_ID"])
    if news_id.startswith("FAKE_RU_NEWS_"):
        return 1
    if news_id.startswith("REAL_RU_NEWS_"):
        return 0
    raise ValueError(f"Unexpected NEWS_ID: {news_id}")


def _pair_group(row: dict[str, Any]) -> int:
    news_id = str(row["data"]["NEWS_ID"])
    match = re.search(r"_(\d+)$", news_id)
    if not match:
        raise ValueError(f"NEWS_ID has no numeric suffix: {news_id}")
    return int(match.group(1))


def load_main_dataset(path: Path) -> tuple[np.ndarray, np.ndarray, np.ndarray, dict[str, int]]:
    rows = _read_json(path)
    seen: set[str] = set()
    texts: list[str] = []
    labels: list[int] = []
    groups: list[int] = []
    duplicates = 0

    for row in rows:
        text = normalize_for_model(str(row["data"]["text"]))
        if not text:
            continue
        if text in seen:
            duplicates += 1
            continue
        seen.add(text)
        texts.append(text)
        labels.append(_main_label(row))
        groups.append(_pair_group(row))

    counts = Counter(labels)
    summary = {
        "rawSamples": len(rows),
        "samples": len(texts),
        "real": counts[0],
        "fake": counts[1],
        "exactDuplicatesRemoved": duplicates,
    }
    return np.asarray(texts, dtype=object), np.asarray(labels), np.asarray(groups), summary


def load_external_dataset(path: Path) -> tuple[np.ndarray, np.ndarray, np.ndarray, dict[str, int]]:
    rows = [row for row in _read_json(path) if row.get("Language") == "RU"]
    texts = np.asarray([normalize_for_model(str(row["TEXT"])) for row in rows], dtype=object)
    labels = np.asarray([1 if row["Class"] == "FAKE" else 0 for row in rows])
    sources = np.asarray([str(row["Source"]) for row in rows], dtype=object)
    if len(set(texts.tolist())) != len(texts):
        raise RuntimeError("External Russian evaluation data contains exact duplicate texts.")
    counts = Counter(labels.tolist())
    summary = {"samples": len(texts), "real": counts[0], "fake": counts[1]}
    return texts, labels, sources, summary


def build_base_model() -> Pipeline:
    return Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    lowercase=True,
                    ngram_range=(1, 2),
                    min_df=2,
                    max_df=0.98,
                    max_features=50_000,
                    sublinear_tf=True,
                    norm="l2",
                ),
            ),
            (
                "classifier",
                LogisticRegression(
                    C=2.0,
                    solver="liblinear",
                    max_iter=2_000,
                    class_weight="balanced",
                    random_state=SEED,
                ),
            ),
        ]
    )


def _log_odds(probabilities: np.ndarray) -> np.ndarray:
    clipped = np.clip(probabilities, 1e-8, 1 - 1e-8)
    return np.log(clipped / (1 - clipped)).reshape(-1, 1)


def _new_calibrator(c_value: float) -> LogisticRegression:
    return LogisticRegression(
        C=c_value,
        solver="liblinear",
        class_weight="balanced",
        random_state=SEED,
    )


def _classification_metrics(labels: np.ndarray, probabilities: np.ndarray) -> dict[str, Any]:
    predictions = (probabilities >= 0.5).astype(int)
    return {
        "accuracy": round(float(accuracy_score(labels, predictions)), 6),
        "macroF1": round(float(f1_score(labels, predictions, average="macro")), 6),
        "precisionFake": round(float(precision_score(labels, predictions, zero_division=0)), 6),
        "recallFake": round(float(recall_score(labels, predictions, zero_division=0)), 6),
        "precisionReal": round(
            float(precision_score(labels, predictions, pos_label=0, zero_division=0)), 6
        ),
        "recallReal": round(
            float(recall_score(labels, predictions, pos_label=0, zero_division=0)), 6
        ),
        "rocAuc": round(float(roc_auc_score(labels, probabilities)), 6),
        "brierScore": round(float(brier_score_loss(labels, probabilities)), 6),
        "logLoss": round(float(log_loss(labels, probabilities)), 6),
        "confusionMatrix": confusion_matrix(labels, predictions, labels=[0, 1]).tolist(),
    }


def _stratified_bootstrap_intervals(
    labels: np.ndarray,
    probabilities: np.ndarray,
    iterations: int = 2_000,
) -> dict[str, list[float]]:
    rng = np.random.default_rng(SEED)
    by_class = [np.flatnonzero(labels == value) for value in (0, 1)]
    accuracy_values: list[float] = []
    macro_f1_values: list[float] = []
    predictions = probabilities >= 0.5
    for _ in range(iterations):
        sample = np.concatenate(
            [rng.choice(indices, size=len(indices), replace=True) for indices in by_class]
        )
        accuracy_values.append(float(accuracy_score(labels[sample], predictions[sample])))
        macro_f1_values.append(
            float(f1_score(labels[sample], predictions[sample], average="macro"))
        )

    return {
        "accuracy95": [
            round(float(value), 6) for value in np.percentile(accuracy_values, [2.5, 97.5])
        ],
        "macroF195": [
            round(float(value), 6) for value in np.percentile(macro_f1_values, [2.5, 97.5])
        ],
    }


def evaluate_internal(
    texts: np.ndarray,
    labels: np.ndarray,
    groups: np.ndarray,
) -> dict[str, Any]:
    splitter = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=SEED)
    probabilities = cross_val_predict(
        build_base_model(),
        texts,
        labels,
        groups=groups,
        cv=splitter,
        method="predict_proba",
        n_jobs=1,
    )[:, 1]
    return {
        "protocol": (
            "5-fold stratified group cross-validation; paired REAL/FAKE source IDs stay "
            "in the same fold; exact normalized duplicates removed"
        ),
        "samples": int(len(texts)),
        "metrics": _classification_metrics(labels, probabilities),
    }


def _select_calibration_c(
    log_odds: np.ndarray,
    labels: np.ndarray,
    splits: list[tuple[np.ndarray, np.ndarray]],
) -> tuple[float, dict[str, float]]:
    scores: dict[str, float] = {}
    for c_value in CALIBRATION_CANDIDATES:
        probabilities = np.zeros(len(labels), dtype=float)
        for train_indices, validation_indices in splits:
            calibrator = _new_calibrator(c_value)
            calibrator.fit(log_odds[train_indices], labels[train_indices])
            probabilities[validation_indices] = calibrator.predict_proba(
                log_odds[validation_indices]
            )[:, 1]
        score = f1_score(labels, probabilities >= 0.5, average="macro")
        scores[str(c_value)] = round(float(score), 6)

    selected = max(
        CALIBRATION_CANDIDATES,
        key=lambda candidate: (scores[str(candidate)], -candidate),
    )
    return selected, scores


def evaluate_external_nested(
    raw_probabilities: np.ndarray,
    labels: np.ndarray,
) -> tuple[dict[str, Any], np.ndarray]:
    log_odds = _log_odds(raw_probabilities)
    outer = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    out_of_fold = np.zeros(len(labels), dtype=float)
    selected_values: list[float] = []

    for fold, (train_indices, test_indices) in enumerate(outer.split(log_odds, labels), start=1):
        inner_splitter = StratifiedKFold(n_splits=4, shuffle=True, random_state=SEED + fold)
        inner_splits = list(inner_splitter.split(log_odds[train_indices], labels[train_indices]))
        selected_c, _ = _select_calibration_c(
            log_odds[train_indices], labels[train_indices], inner_splits
        )
        selected_values.append(selected_c)
        calibrator = _new_calibrator(selected_c)
        calibrator.fit(log_odds[train_indices], labels[train_indices])
        out_of_fold[test_indices] = calibrator.predict_proba(log_odds[test_indices])[:, 1]

    evaluation = {
        "protocol": (
            "Nested 5-fold out-of-fold evaluation on authentic Russian examples. "
            "Each outer fold is untouched while calibration strength is selected by "
            "4-fold cross-validation inside the remaining examples."
        ),
        "samples": int(len(labels)),
        "outerFolds": 5,
        "selectedCalibrationC": selected_values,
        "metrics": _classification_metrics(labels, out_of_fold),
        "confidenceIntervals": _stratified_bootstrap_intervals(labels, out_of_fold),
    }
    return evaluation, out_of_fold


def fit_final_calibrator(
    raw_probabilities: np.ndarray,
    labels: np.ndarray,
) -> tuple[LogisticRegression, float, dict[str, float]]:
    log_odds = _log_odds(raw_probabilities)
    splitter = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    selected_c, scores = _select_calibration_c(
        log_odds, labels, list(splitter.split(log_odds, labels))
    )
    calibrator = _new_calibrator(selected_c)
    calibrator.fit(log_odds, labels)
    return calibrator, selected_c, scores


def train(force_download: bool = False) -> dict[str, Any]:
    main_path = ensure_dataset_file(MAIN_FILE, force=force_download)
    external_path = ensure_dataset_file(EXTERNAL_FILE, force=force_download)
    main_texts, main_labels, main_groups, main_summary = load_main_dataset(main_path)
    external_texts, external_labels, external_sources, external_summary = load_external_dataset(
        external_path
    )
    if set(main_texts.tolist()).intersection(external_texts.tolist()):
        raise RuntimeError("Main and external datasets overlap after normalization.")

    print("Evaluating grouped in-domain performance...", flush=True)
    internal_evaluation = evaluate_internal(main_texts, main_labels, main_groups)

    print("Fitting base model...", flush=True)
    base_model = build_base_model()
    base_model.fit(main_texts, main_labels)
    raw_external = base_model.predict_proba(external_texts)[:, 1]

    print("Running nested external calibration evaluation...", flush=True)
    external_evaluation, _ = evaluate_external_nested(raw_external, external_labels)
    calibrator, selected_c, calibration_scores = fit_final_calibrator(raw_external, external_labels)

    trained_at = datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    limitations = [
        "The main FAKE class is synthetic while the REAL class is mostly official news.",
        "The external Russian evaluation set has 157 Kazakhstan-focused texts.",
        "The model classifies wording patterns and does not retrieve or verify evidence.",
        "Confidence can become miscalibrated on new topics, sources, or adversarial paraphrases.",
        "Binary REAL/FAKE labels do not represent satire, opinion, or partially true claims.",
    ]
    metrics = {
        "schemaVersion": 1,
        "generatedAt": trained_at,
        "modelName": MODEL_NAME,
        "modelVersion": MODEL_VERSION,
        "maxTextLength": MAX_TEXT_LENGTH,
        "dataset": {
            "name": "KazFakeCorpus Russian subset",
            "revision": DATASET_REVISION,
            "license": "CC BY 4.0",
            "main": main_summary,
            "external": {**external_summary, "sources": sorted(set(external_sources.tolist()))},
        },
        "evaluation": {
            "headline": "externalNestedCrossValidation",
            "inDomainGroupedCrossValidation": internal_evaluation,
            "externalNestedCrossValidation": external_evaluation,
            "finalCalibration": {
                "method": "sigmoid over base-model log-odds",
                "selectedC": selected_c,
                "crossValidatedMacroF1ByC": calibration_scores,
            },
        },
        "limitations": limitations,
    }
    artifact = {
        "schema_version": 1,
        "model_name": MODEL_NAME,
        "model_version": MODEL_VERSION,
        "trained_at": trained_at,
        "base_model": base_model,
        "calibrator": calibrator,
        "metrics": metrics,
        "sklearn_version": sklearn.__version__,
        "dataset_revision": DATASET_REVISION,
    }

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    artifact_path = ARTIFACT_DIR / "model.joblib"
    metrics_path = ARTIFACT_DIR / "metrics.json"
    manifest_path = ARTIFACT_DIR / "artifact-manifest.json"
    temporary_artifact = artifact_path.with_suffix(".joblib.tmp")
    joblib.dump(artifact, temporary_artifact, compress=3)
    temporary_artifact.replace(artifact_path)
    metrics_path.write_text(
        json.dumps(metrics, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    manifest = {
        "schemaVersion": 1,
        "filename": artifact_path.name,
        "sha256": sha256_file(artifact_path),
        "bytes": artifact_path.stat().st_size,
        "modelVersion": MODEL_VERSION,
        "sklearnVersion": sklearn.__version__,
    }
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Train and evaluate the RuFact baseline model.")
    parser.add_argument(
        "--force-download",
        action="store_true",
        help="Download the pinned dataset files again even when verified files exist.",
    )
    args = parser.parse_args()
    metrics = train(force_download=args.force_download)
    headline = metrics["evaluation"]["externalNestedCrossValidation"]["metrics"]
    print(
        "External OOF metrics: "
        f"accuracy={headline['accuracy']:.3f}, macro_f1={headline['macroF1']:.3f}, "
        f"precision_fake={headline['precisionFake']:.3f}, "
        f"recall_fake={headline['recallFake']:.3f}",
        flush=True,
    )


if __name__ == "__main__":
    main()
