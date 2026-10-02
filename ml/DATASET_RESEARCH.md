# Dataset research for RuFact v2

Research date: 2026-10-02.

The goal was to enlarge the Russian training corpus without changing RuFact into a
different task. Candidate data was checked for task fit, access, licensing, size,
and leakage against the existing training and external evaluation texts.

## Selected auxiliary data

### Balanced Taiga Panorama and Lenta sample

- Source: [Taiga downloads](https://tatianashavrina.github.io/taiga_site/downloads)
- Fake archive: `Fake_news.rar`
- Fake archive SHA-256: `5a522a810548fd31a0e96f678da0195a036ed78efbed09dcf4bd28572736633d`
- Real archive: `Lenta.db.zip`
- Real archive SHA-256: `3db0f1ac1ff2dbfa30b41a511473d369278411a2aa5d6478ea49ef6347cb53c0`
- Selected texts: 834 Panorama satire + 834 Lenta news
- Terms stated by the source: personal and research purposes
- Role in v2: balanced auxiliary `REAL` and `FAKE` examples

The fake collection contains satire from Panorama, not ordinary fact-checked
misinformation. A deterministic, seed-controlled sample of the same size is selected
from 36,445 Lenta records so that the auxiliary source does not add only one class.
This broadens news-style coverage but still creates a genre limitation. The model
card and UI disclose this explicitly.

After truncation-aware normalization, the auxiliary texts have zero exact overlap
with the 2,039 core training texts and zero exact overlap with the 157 external
evaluation texts. Combined training size is 3,707 texts, up from 2,039 (+81.8%).

## Screened but not selected

### RuFacts

- Source: [akozlova/RuFacts](https://huggingface.co/datasets/akozlova/RuFacts)
- License: CC BY 4.0
- Labelled train and validation rows: 6,236

RuFacts evaluates whether a claim is consistent with a separate evidence text. RuFact
receives only one text at inference time, so using RuFacts labels without the evidence
would train a mismatched and partly unlearnable task.

### SWARM

- Source: [manueltonneau/SWARM](https://huggingface.co/datasets/manueltonneau/SWARM)
- Size: 2,183 multilingual documents; 248 Russian-query results
- Access: gated, research-use-only

SWARM labels whether a document supports a specified propaganda narrative. It is a
narrative-conditioned stance task, not binary text veracity, and cannot be used in
RuFact without adding the narrative as a second input.

### EUvsDisinfo

- Source: [dataset record](https://zenodo.org/records/10514307)
- License: CC BY-SA 4.0 for the dataset metadata
- Published Russian subset: approximately 5,825 articles

The public record distributes URLs rather than the full article text for copyright
reasons. Rebuilding it requires third-party crawling, and the published Russian split
is heavily class-imbalanced and outlet-linked. It was not added to a reproducible MVP
training command.

### Fakespeak-RUS

- Source: [corpus paper](https://doi.org/10.1515/lingvan-2024-0198)
- Size reported by the paper: 370 articles

This is a carefully controlled corpus, but the current release is smaller than the
existing training set and is described as better suited to qualitative and
mixed-method research than model training.

## Model comparison

All candidates used the same 157-text external nested out-of-fold evaluation. Exact
normalized overlap with that set was rejected before fitting.

| Candidate | Training texts | Accuracy | Macro F1 |
| --- | ---: | ---: | ---: |
| v1 word TF-IDF | 2,039 | 71.97% | 71.95% |
| Satire-only expanded word TF-IDF | 2,873 | 86.62% | 86.62% |
| Satire-only word + character TF-IDF | 2,873 | 89.81% | 89.80% |
| Balanced Taiga word + character TF-IDF (selected) | 3,707 | 80.89% | 80.88% |

The apparently stronger satire-only result was rejected after smoke tests showed a
large false-positive shift on ordinary announcements. The selected balanced result
is still an improvement on this particular external sample, not a guarantee of
80.89% accuracy in production. The external sample is small and its
classes are confounded with source, so future work should collect a source-balanced,
time-separated Russian test set before making stronger claims.
