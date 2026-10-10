"use client";

import { Check, Copy, Download, MailWarning, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

import type { AnalysisResponse } from "@/lib/api";
import { buildAnalysisReport } from "@/lib/analysis-report";
import { copyText } from "@/lib/copy-text";
import { useFeedback } from "./FeedbackProvider";
import { useLanguage } from "./LanguageProvider";

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
  const { locale } = useLanguage();
  const labels = locale === "uz"
    ? { actions: "Natija amallari", copy: "Nusxalash", copyReport: "Hisobotni nusxalash", done: "Tayyor", download: "Yuklash", share: "Ulashish", reportIssue: "Xato haqida xabar berish", shareTitle: "RuFact tahlil natijasi", result: "Natija", confidence: "ishonch", shared: "Hisobot tizim menyusiga yuborildi.", shareCopied: "Tizim menyusi mavjud emas — hisobot nusxalandi.", copied: "Hisobot buferga nusxalandi.", downloaded: "Matnli hisobot qurilmaga saqlandi.", error: "Amal bajarilmadi. Hisobotni fayl sifatida yuklab oling.", privacy: "Asl matn hisobotga kiradi, lekin RuFact uni avtomatik yubormaydi." }
    : locale === "en"
      ? { actions: "Result actions", copy: "Copy", copyReport: "Copy report", done: "Done", download: "Download", share: "Share", reportIssue: "Report an error", shareTitle: "RuFact analysis result", result: "Result", confidence: "confidence", shared: "The report was sent to the system share menu.", shareCopied: "Sharing is unavailable — the report was copied.", copied: "The report was copied to the clipboard.", downloaded: "The text report was saved to this device.", error: "The action failed. Download the report as a file.", privacy: "The source text is included in the report but is not sent automatically by RuFact." }
      : { actions: "Действия с результатом", copy: "Копировать", copyReport: "Копировать отчёт", done: "Готово", download: "Скачать", share: "Поделиться", reportIssue: "Сообщить об ошибке", shareTitle: "Результат анализа RuFact", result: "Результат", confidence: "уверенность", shared: "Отчёт передан в системное меню.", shareCopied: "Системное меню недоступно — отчёт скопирован.", copied: "Отчёт скопирован в буфер обмена.", downloaded: "Текстовый отчёт сохранён на устройство.", error: "Не удалось выполнить действие. Скачайте отчёт файлом.", privacy: "Исходный текст входит в отчёт, но не отправляется RuFact автоматически." };
  const report = buildAnalysisReport({ result, analyzedText, timestamp, locale });

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
        title: labels.shareTitle,
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
      aria-label={labels.actions}
      className="mt-3 border-t border-[#e1dcd6] pt-2.5 sm:mt-4 sm:pt-3"
    >
      <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
        <button
          type="button"
          aria-label={labels.copyReport}
          onClick={handleCopy}
          className="focus-ring inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border border-[#d8dcde] bg-white/55 px-1.5 text-[0.5625rem] font-extrabold text-[#3d5870] transition-colors hover:bg-white sm:gap-2 sm:px-3 sm:text-[0.65625rem]"
        >
          {status === "copied" ? (
            <Check size={14} strokeWidth={2.2} aria-hidden="true" />
          ) : (
            <Copy size={14} strokeWidth={2} aria-hidden="true" />
          )}
          {status === "copied" ? labels.done : <><span className="sm:hidden">{labels.copy}</span><span className="hidden sm:inline">{labels.copyReport}</span></>}
        </button>
        <button
          type="button"
          aria-label={`${labels.download} .txt`}
          onClick={() => {
            downloadReport(report);
            setStatus("downloaded");
          }}
          className="focus-ring inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border border-[#d8dcde] bg-white/55 px-1.5 text-[0.5625rem] font-extrabold text-[#3d5870] transition-colors hover:bg-white sm:gap-2 sm:px-3 sm:text-[0.65625rem]"
        >
          <Download size={14} strokeWidth={2} aria-hidden="true" />
          <span>{labels.download}</span><span className="hidden sm:inline"> .txt</span>
        </button>
        <button
          type="button"
          aria-label={labels.share}
          onClick={handleShare}
          className="focus-ring inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border border-[#d8dcde] bg-white/55 px-1.5 text-[0.5625rem] font-extrabold text-[#3d5870] transition-colors hover:bg-white sm:gap-2 sm:px-3 sm:text-[0.65625rem]"
        >
          <Share2 size={14} strokeWidth={2} aria-hidden="true" />
          {labels.share}
        </button>
        <button
          type="button"
          onClick={() =>
            openFeedback({
              source: "result",
              summary: `${labels.result}: ${result.label}; ${labels.confidence}: ${Math.round(result.confidence * 100)}%.`,
            })
          }
          className="focus-ring col-span-3 mx-auto inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-[0.5625rem] font-bold text-[#826258] transition-colors hover:bg-[#f5e9e3] sm:col-auto sm:ml-auto sm:mr-0 sm:min-h-9 sm:gap-2 sm:text-[0.625rem]"
        >
          <MailWarning size={14} strokeWidth={1.9} aria-hidden="true" />
          {labels.reportIssue}
        </button>
      </div>
      <p className="mt-1.5 min-h-4 text-[0.53125rem] leading-[1.35] text-[#798795] sm:mt-2 sm:text-[0.59375rem] sm:leading-[1.4]" role="status">
        {status === "shared"
          ? labels.shared
          : status === "share-copied"
            ? labels.shareCopied
            : status === "copied"
              ? labels.copied
              : status === "downloaded"
                ? labels.downloaded
          : status === "error"
            ? labels.error
            : labels.privacy}
      </p>
    </section>
  );
}
