"use client";

import { Check, Copy, Download, MailWarning, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

import type { AnalysisResponse } from "@/lib/api";
import { buildAnalysisReport } from "@/lib/analysis-report";

interface ResultActionsProps {
  result: AnalysisResponse;
  analyzedText: string;
  timestamp: string;
}

type ActionStatus = "idle" | "copied" | "shared" | "error";

function downloadReport(report: string) {
  const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `rufact-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function ResultActions({
  result,
  analyzedText,
  timestamp,
}: ResultActionsProps) {
  const [status, setStatus] = useState<ActionStatus>("idle");
  const report = buildAnalysisReport({ result, analyzedText, timestamp });

  useEffect(() => {
    if (status === "idle") return;
    const timeoutId = window.setTimeout(() => setStatus("idle"), 2_500);
    return () => window.clearTimeout(timeoutId);
  }, [status]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(report);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  async function handleShare() {
    if (!navigator.share) {
      await handleCopy();
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
      className="mt-4 border-t border-[#e1dcd6] pt-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#d8dcde] bg-white/55 px-3 text-[10.5px] font-extrabold text-[#3d5870] transition-colors hover:bg-white"
        >
          {status === "copied" ? (
            <Check size={14} strokeWidth={2.2} aria-hidden="true" />
          ) : (
            <Copy size={14} strokeWidth={2} aria-hidden="true" />
          )}
          {status === "copied" ? "Скопировано" : "Копировать отчёт"}
        </button>
        <button
          type="button"
          onClick={() => downloadReport(report)}
          className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#d8dcde] bg-white/55 px-3 text-[10.5px] font-extrabold text-[#3d5870] transition-colors hover:bg-white"
        >
          <Download size={14} strokeWidth={2} aria-hidden="true" />
          Скачать .txt
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#d8dcde] bg-white/55 px-3 text-[10.5px] font-extrabold text-[#3d5870] transition-colors hover:bg-white"
        >
          <Share2 size={14} strokeWidth={2} aria-hidden="true" />
          Поделиться
        </button>
        <a
          href={`mailto:hello@rufact.ru?subject=${encodeURIComponent("Ошибка в результате RuFact")}&body=${encodeURIComponent(`Результат: ${result.label}, уверенность: ${Math.round(result.confidence * 100)}%.\n\nОпишите, что кажется неверным. Исходный текст не добавлен автоматически для защиты приватности.`)}`}
          className="focus-ring ml-auto inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-[10px] font-bold text-[#826258] transition-colors hover:bg-[#f5e9e3]"
        >
          <MailWarning size={14} strokeWidth={1.9} aria-hidden="true" />
          Сообщить об ошибке
        </a>
      </div>
      <p className="mt-2 min-h-4 text-[9.5px] leading-[1.4] text-[#798795]" role="status">
        {status === "shared"
          ? "Отчёт передан в системное меню."
          : status === "error"
            ? "Не удалось выполнить действие. Скачайте отчёт файлом."
            : "Исходный текст входит в отчёт, но не отправляется RuFact автоматически."}
      </p>
    </section>
  );
}
