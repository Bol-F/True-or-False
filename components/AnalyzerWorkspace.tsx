"use client";

import { useState } from "react";
import { analyzeText, type AnalysisResponse } from "@/lib/api";
import { DEFAULT_TEXT, EXAMPLES } from "@/lib/examples";
import { AnalysisResult, type AnalysisStatus } from "./AnalysisResult";
import { type TextExample } from "./ExampleChips";
import { TextAnalyzer } from "./TextAnalyzer";

const INITIAL_RESULT: AnalysisResponse = {
  label: "FAKE",
  confidence: 0.91,
};

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(date)
    .replace(" г.", "");
}

export function AnalyzerWorkspace() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [activeExampleId, setActiveExampleId] = useState<string | null>("medical");
  const [result, setResult] = useState<AnalysisResponse>(INITIAL_RESULT);
  const [status, setStatus] = useState<AnalysisStatus>("initial");
  const [timestamp, setTimestamp] = useState("26 нояб. 2024, 14:37");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTextChange = (value: string) => {
    setText(value);
    setActiveExampleId(null);
    if (value.trim()) {
      setValidationMessage(null);
    }
  };

  const handleClear = () => {
    setText("");
    setActiveExampleId(null);
    setValidationMessage(null);
  };

  const handleExampleSelect = (example: TextExample) => {
    setText(example.text);
    setActiveExampleId(example.id);
    setValidationMessage(null);
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    const normalizedText = text.trim();

    if (!normalizedText) {
      setValidationMessage("Введите текст, который нужно проверить.");
      document.getElementById("analysis-text")?.focus();
      return;
    }

    setValidationMessage(null);
    setErrorMessage(null);
    setStatus("loading");

    try {
      const nextResult = await analyzeText(normalizedText);
      setResult(nextResult);
      setTimestamp(formatTimestamp(new Date()));
      setStatus("success");
    } catch {
      setErrorMessage(
        "Сервис временно недоступен. Текст не был сохранён — вы можете повторить запрос.",
      );
      setStatus("error");
    }
  };

  return (
    <section
      id="analyzer"
      aria-label="Проверка текста"
      className="tool-gutter relative z-10 pb-0 pt-[11px]"
    >
      <div className="grid items-start gap-[18px] lg:grid-cols-[minmax(0,1.25fr)_minmax(390px,0.95fr)]">
        <TextAnalyzer
          text={text}
          examples={EXAMPLES}
          activeExampleId={activeExampleId}
          isLoading={status === "loading"}
          validationMessage={validationMessage}
          onTextChange={handleTextChange}
          onClear={handleClear}
          onExampleSelect={handleExampleSelect}
          onSubmit={handleSubmit}
        />

        <div className="lg:-mt-[72px] xl:-mt-[104px]">
          <AnalysisResult
            result={result}
            status={status}
            timestamp={timestamp}
            errorMessage={errorMessage}
            onRetry={handleSubmit}
          />
        </div>
      </div>
    </section>
  );
}
