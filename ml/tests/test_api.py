from fastapi.testclient import TestClient

from rufact_ml.main import app


def test_health_and_prediction_contract() -> None:
    analyzed_text = (
        "Срочно перешлите всем: неизвестные эксперты доказали, что этот "
        "метод гарантированно помогает каждому без исключения."
    )
    with TestClient(app) as client:
        health = client.get("/health")
        assert health.status_code == 200
        assert health.json()["ready"] is True

        response = client.post(
            "/predict",
            json={"text": analyzed_text},
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["label"] in {"REAL", "FAKE"}
        assert 0.5 <= payload["confidence"] <= 1
        assert payload["meta"] == {
            "engine": "external-model",
            "engineVersion": "tfidf-word-char-logreg-ru-v2",
            "externalSourcesChecked": False,
        }
        for evidence in payload["evidence"]:
            assert evidence["start"] < evidence["end"]
            assert analyzed_text[evidence["start"] : evidence["end"]] == evidence["quote"]


def test_prediction_validation() -> None:
    with TestClient(app) as client:
        assert client.post("/predict", json={"text": "   "}).status_code == 422
        assert client.post("/predict", json={"text": "а" * 5001}).status_code == 422


def test_model_info_exposes_measured_quality() -> None:
    with TestClient(app) as client:
        response = client.get("/model-info")
        assert response.status_code == 200
        payload = response.json()
        headline = payload["evaluation"]["externalNestedCrossValidation"]
        assert headline["samples"] == 157
        assert headline["metrics"]["accuracy"] == 0.808917
        assert headline["metrics"]["confusionMatrix"] == [[65, 11], [19, 62]]
