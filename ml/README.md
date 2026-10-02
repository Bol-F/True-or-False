# RuFact ML

CPU-friendly, reproducible baseline for Russian misinformation-risk classification.
It is a text-style classifier, not a web fact-checker: it estimates whether a text
resembles the labelled `REAL` or `FAKE` examples in its training data.

## What is trained

- word TF-IDF features with 1–2 word n-grams;
- character TF-IDF features with 3–5 character n-grams;
- balanced logistic regression;
- a second sigmoid calibration layer fitted on authentic, out-of-domain examples;
- exact phrase contributions from the linear model for local explanations.

The core pipeline uses the Russian subset of
[KazFakeCorpus](https://github.com/Anargul-Aimuratovna/news-veracity-corpus)
at commit `bd9bdd36d1171f0031cc448c808ebee6ecacd6d0`. The dataset is CC BY 4.0.
It adds 834 Panorama satire articles and a deterministic 834-article Lenta news
sample from the
[Taiga corpus](https://tatianashavrina.github.io/taiga_site/downloads), whose site
limits the data to personal and research use. The combined training set has 3,707
unique texts. Raw data is downloaded into ignored `data/raw/` files and
checksum-verified. Extracting Taiga's RAR file requires `bsdtar`/`libarchive-tools`.
The selection audit and rejected alternatives are recorded in
[`DATASET_RESEARCH.md`](DATASET_RESEARCH.md).

## Train and evaluate

From the repository root:

```bash
uv sync --project ml
uv run --project ml rufact-train
```

Training writes:

- `artifacts/model.joblib` — model bundle used by the API;
- `artifacts/metrics.json` — full evaluation protocol and metrics;
- `artifacts/artifact-manifest.json` — model checksum and compatibility metadata.

The v2 headline accuracy is 80.89% (macro F1 80.88%) from out-of-fold predictions
on 157 authentic Russian examples. Each outer fold is held out while calibration
strength is chosen inside the remaining data. The much easier
synthetic/official-news score is reported separately and must not be presented as
real-world accuracy.

## Run the API

```bash
uv run --project ml uvicorn rufact_ml.main:app --app-dir ml/src --reload --port 8000
```

The API loads the repository-root `.env.local` for local development. Set a shared
`ML_API_JWT_SECRET` of at least 32 bytes there. The Next.js server creates a
30-second HS256 token for every prediction; the token is bound to the exact body
SHA-256 and `X-Request-ID`. `/predict` rejects unsigned, replay-modified, expired,
or incorrectly addressed requests. This JWT is service-to-service authentication,
not end-user login.

Endpoints:

- `GET /health`
- `GET /model-info`
- authenticated `POST /predict` with `{ "text": "..." }`
- interactive API documentation at `http://127.0.0.1:8000/docs`

The production container runs as an unprivileged user, verifies its model checksum,
disables API documentation unless explicitly enabled, exposes a Docker health check,
honors `PORT`, and limits concurrent predictions. See
[`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md) for all required environment values.

## Test and lint

```bash
uv run --project ml pytest
uv run --project ml ruff check ml
```

The runtime dependency set and JavaScript production dependencies are audited in
the release checklist. Development-only packages are not copied into the container.

## Important limitations

- The core FAKE class is synthetic; auxiliary data contrasts Panorama satire with a
  deterministic Lenta news sample.
- The external Russian evaluation set is small (157 texts), Kazakhstan-focused, and
  its labels are confounded with source.
- The model learns statistical wording patterns; it does not retrieve evidence or
  establish whether a real-world claim is true.
- Confidence is calibrated for this dataset and can drift on new topics and sources.
