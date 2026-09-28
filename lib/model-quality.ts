export type QualityMetricKey =
  | "accuracy"
  | "macroF1"
  | "precisionFake"
  | "recallFake";

export interface ModelQualityMetric {
  key: QualityMetricKey;
  label: string;
  value: number | null;
  description: string;
}

export interface ModelQuality {
  status: "demo" | "evaluated";
  modelName: string;
  modelVersion: string | null;
  evaluatedAt: string | null;
  dataset: {
    name: string;
    samples: number;
    split: string;
  } | null;
  metrics: readonly ModelQualityMetric[];
  limitations: readonly string[];
}

export const MODEL_QUALITY: ModelQuality = {
  status: "demo",
  modelName: "Локальный демонстрационный классификатор",
  modelVersion: "demo-heuristic-v1",
  evaluatedAt: null,
  dataset: null,
  metrics: [
    {
      key: "accuracy",
      label: "Accuracy",
      value: null,
      description: "Доля правильных ответов на отдельной тестовой выборке",
    },
    {
      key: "macroF1",
      label: "Macro F1",
      value: null,
      description: "Баланс качества по классам REAL и FAKE",
    },
    {
      key: "precisionFake",
      label: "Precision · FAKE",
      value: null,
      description: "Какая доля предупреждений действительно относится к классу FAKE",
    },
    {
      key: "recallFake",
      label: "Recall · FAKE",
      value: null,
      description: "Какую долю размеченных примеров FAKE удалось обнаружить",
    },
  ],
  limitations: [
    "Демонстрационный режим анализирует языковые маркеры, а не проверяет факты в интернете.",
    "Метрики появятся только после оценки RuBERT на отдельной размеченной выборке.",
  ],
};
