"use client";

import { useState } from "react";
import { useAnalysisHistory } from "@/hooks/useAnalysisHistory";
import { analyzeText, getMockAnalysis, type AnalysisResponse } from "@/lib/api";
import type { HistoryItem } from "@/lib/analysis-history";
import { DEFAULT_TEXT, EXAMPLES } from "@/lib/examples";
import { AnalysisHistoryDialog } from "./AnalysisHistoryDialog";
import { AnalysisResult, type AnalysisStatus } from "./AnalysisResult";
import { type TextExample } from "./ExampleChips";
import { TextAnalyzer } from "./TextAnalyzer";

const INITIAL_RESULT: AnalysisResponse = getMockAnalysis(DEFAULT_TEXT);

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
  const history = useAnalysisHistory();
  const [text, setText] = useState(DEFAULT_TEXT);
  const [activeExampleId, setActiveExampleId] = useState<string | null>("medical");
  const [result, setResult] = useState<AnalysisResponse>(INITIAL_RESULT);
  const [analyzedText, setAnalyzedText] = useState(DEFAULT_TEXT);
  const [status, setStatus] = useState<AnalysisStatus>("initial");
  const [timestamp, setTimestamp] = useState("26 нояб. 2024, 14:37");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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
      const analyzedAt = new Date();
      setResult(nextResult);
      setAnalyzedText(normalizedText);
      setTimestamp(formatTimestamp(analyzedAt));
      setStatus("success");

      history.add({
        source: "user",
        status: "success",
        text: normalizedText,
        label: nextResult.label,
        confidence: nextResult.confidence,
        analyzedAt,
        meta: {
          engine: nextResult.meta?.engine ?? "external-model",
          version: nextResult.meta?.engineVersion ?? "external-api",
        },
      });
    } catch {
      setErrorMessage(
        "Сервис временно недоступен. Текст не был сохранён — вы можете повторить запрос.",
      );
      setStatus("error");
    }
  };

  const handleHistoryRestore = (item: HistoryItem) => {
    const restoredResult: AnalysisResponse =
      item.meta.engine === "demo-heuristic"
        ? getMockAnalysis(item.text)
        : {
            label: item.label,
            confidence: item.confidence,
            meta: {
              engine: item.meta.engine,
              engineVersion: item.meta.version,
              externalSourcesChecked: false,
            },
          };

    setText(item.text);
    setAnalyzedText(item.text);
    setActiveExampleId(null);
    setResult(restoredResult);
    setTimestamp(formatTimestamp(new Date(item.analyzedAt)));
    setValidationMessage(null);
    setErrorMessage(null);
    setStatus("success");
    setIsHistoryOpen(false);
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
          historyOpen={isHistoryOpen}
          historyEnabled={history.enabled}
          historyCount={history.items.length}
          onTextChange={handleTextChange}
          onClear={handleClear}
          onExampleSelect={handleExampleSelect}
          onSubmit={handleSubmit}
          onOpenHistory={() => setIsHistoryOpen(true)}
        />

        <div className="lg:-mt-[72px] xl:-mt-[104px]">
          <AnalysisResult
            result={result}
            analyzedText={analyzedText}
            status={status}
            timestamp={timestamp}
            errorMessage={errorMessage}
            onRetry={handleSubmit}
          />
        </div>
      </div>

      <AnalysisHistoryDialog
        isOpen={isHistoryOpen}
        enabled={history.enabled}
        items={history.items}
        errorMessage={history.error?.message ?? null}
        onClose={() => setIsHistoryOpen(false)}
        onEnable={history.enable}
        onDisable={history.disable}
        onClear={history.clear}
        onDelete={history.remove}
        onRestore={handleHistoryRestore}
      />
    </section>
  );
}
