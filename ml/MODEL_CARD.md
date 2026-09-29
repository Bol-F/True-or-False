# Model card: RuFact TF-IDF Logistic Regression RU v1

## Intended use

This model is an educational first-pass classifier for Russian text. It may flag
language that resembles labelled misinformation examples. It must not be used as an
automatic accusation, moderation verdict, legal determination, or substitute for
source-based fact-checking.

## Model

- Model ID: `tfidf-logreg-ru-v1`
- Features: lowercase word TF-IDF, 1–2 word n-grams, maximum 50,000 features
- Classifier: balanced logistic regression
- Calibration: sigmoid mapping over the base-model log-odds
- Maximum evaluated input: 5,000 characters
- Classes: `REAL`, `FAKE`

The model emits local word/phrase contributions. These explain the linear
classifier's decision, not the truth or falsity of the highlighted phrase.

## Data

The training and calibration data comes from KazFakeCorpus, pinned to Git commit
`bd9bdd36d1171f0031cc448c808ebee6ecacd6d0` and released under CC BY 4.0.

- Main Russian subset: 2,106 rows before normalization; 2,039 unique texts after
  truncation-aware exact deduplication (986 REAL, 1,053 FAKE).
- External Russian subset: 157 unique texts (76 REAL, 81 FAKE).

The main REAL texts are official/news publications and the main FAKE examples are
primarily synthetic. The external set contains authentic fact-checked misinformation
and real news from Kazakhstan-based sources.

Dataset authors: Zhanar Lamasheva, Anargul Nekessova, Mansiya Kantureyeva,
Madina Sambetbayeva, Mira Kaldarova, and Aksaule Nazymkhan. See the accompanying
[paper](https://doi.org/10.3390/bdcc10060183) and
[dataset repository](https://github.com/Anargul-Aimuratovna/news-veracity-corpus).

## Evaluation

The generated `artifacts/metrics.json` is authoritative. It records:

1. grouped five-fold cross-validation on the main set, keeping paired REAL/FAKE
   source IDs in the same fold;
2. nested five-fold out-of-fold evaluation on the separate authentic external set;
3. calibration metrics, a confusion matrix, and bootstrap confidence intervals.

The external score is the headline quality estimate. Internal performance is known
to be inflated by the synthetic-vs-official construction of the main corpus.

## Known risks

- strong domain and source shift outside Kazakhstan-focused news;
- missed subtle falsehoods written in neutral language;
- false positives on legitimate warnings, forecasts, or emotionally worded reports;
- adversarial paraphrasing and new topics can bypass learned wording patterns;
- probabilities may be miscalibrated after distribution shift;
- binary labels oversimplify satire, opinion, partially true, and unverifiable claims.
