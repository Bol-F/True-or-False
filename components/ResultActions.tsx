"use client";

import { Check, Copy, Download, MailWarning, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

import type { AnalysisResponse } from "@/lib/api";
import { buildAnalysisReport } from "@/lib/analysis-report";
import { copyText } from "@/lib/copy-text";
import { useFeedback } from "./FeedbackProvider";

interface ResultActionsProps {
  result: AnalysisResponse;
  analyzedText: string;
  timestamp: string;
}

type ActionStatus = "idle" | "copied" | "downloaded" | "shared" | "share-copied" | "error";

function downloadReport(report: string) {
  const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `rufact-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function ResultActions({
  result,
  analyzedText,
  timestamp,
}: ResultActionsProps) {
  const [status, setStatus] = useState<ActionStatus>("idle");
  const { openFeedback } = useFeedback();
  const report = buildAnalysisReport({ result, analyzedText, timestamp });

  useEffect(() => {
    if (status === "idle") return;
    const timeoutId = window.setTimeout(() => setStatus("idle"), 2_500);
    return () => window.clearTimeout(timeoutId);
  }, [status]);

  async function handleCopy() {
    setStatus((await copyText(report)) ? "copied" : "error");
  }

  async function handleShare() {
    if (!navigator.share) {
      setStatus((await copyText(report)) ? "share-copied" : "error");
      return;
    }

    try {
      await navigator.share({
        title: "Результат анализа RuFact",
        text: report,
      });
      setStatus("shared");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus("error");
    }
  }

  return (
    <section
      aria-label="Действия с результатом"
      className="mt-3 border-t border-[#e1dcd6] pt-2.5 sm:mt-4 sm:pt-3"
    >
      <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
        <button
          type="button"
          aria-label="Копировать отчёт"
          onClick={handleCopy}
          className="focus-ring inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border border-[#d8dcde] bg-white/55 px-1.5 text-[9px] font-extrabold text-[#3d5870] transition-colors hover:bg-white sm:gap-2 sm:px-3 sm:text-[10.5px]"
        >
          {status === "copied" ? (
            <Check size={14} strokeWidth={2.2} aria-hidden="true" />
          ) : (
            <Copy size={14} strokeWidth={2} aria-hidden="true" />
          )}
          {status === "copied" ? "Готово" : <><span className="sm:hidden">Копировать</span><span className="hidden sm:inline">Копировать отчёт</span></>}
        </button>
        <button
          type="button"
          aria-label="Скачать .txt"
          onClick={() => {
            downloadReport(report);
            setStatus("downloaded");
          }}
          className="focus-ring inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border border-[#d8dcde] bg-white/55 px-1.5 text-[9px] font-extrabold text-[#3d5870] transition-colors hover:bg-white sm:gap-2 sm:px-3 sm:text-[10.5px]"
        >
          <Download size={14} strokeWidth={2} aria-hidden="true" />
          <span className="sm:hidden">Скачать</span><span className="hidden sm:inline">Скачать .txt</span>
        </button>
        <button
          type="button"
          aria-label="Поделиться"
          onClick={handleShare}
          className="focus-ring inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border border-[#d8dcde] bg-white/55 px-1.5 text-[9px] font-extrabold text-[#3d5870] transition-colors hover:bg-white sm:gap-2 sm:px-3 sm:text-[10.5px]"
        >
          <Share2 size={14} strokeWidth={2} aria-hidden="true" />
          Поделиться
        </button>
        <button
          type="button"
          onClick={() =>
            openFeedback({
              source: "result",
              summary: `Результат: ${result.label}; уверенность: ${Math.round(result.confidence * 100)}%.`,
            })
          }
          className="focus-ring col-span-3 mx-auto inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-[9px] font-bold text-[#826258] transition-colors hover:bg-[#f5e9e3] sm:col-auto sm:ml-auto sm:mr-0 sm:min-h-9 sm:gap-2 sm:text-[10px]"
        >
          <MailWarning size={14} strokeWidth={1.9} aria-hidden="true" />
          Сообщить об ошибке
        </button>
      </div>
      <p className="mt-1.5 min-h-4 text-[8.5px] leading-[1.35] text-[#798795] sm:mt-2 sm:text-[9.5px] sm:leading-[1.4]" role="status">
        {status === "shared"
          ? "Отчёт передан в системное меню."
          : status === "share-copied"
            ? "Системное меню недоступно — отчёт скопирован."
            : status === "copied"
              ? "Отчёт скопирован в буфер обмена."
              : status === "downloaded"
                ? "Текстовый отчёт сохранён на устройство."
          : status === "error"
            ? "Не удалось выполнить действие. Скачайте отчёт файлом."
            : "Исходный текст входит в отчёт, но не отправляется RuFact автоматически."}
      </p>
    </section>
  );
}
