"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  RefreshCw,
} from "lucide-react";
import type { AnalysisResponse } from "@/lib/api";
import { ConfidenceRing } from "./ConfidenceRing";
import { LoadingState } from "./LoadingState";
import { ResultExplanation } from "./ResultExplanation";

export type AnalysisStatus = "initial" | "loading" | "success" | "error";

interface AnalysisResultProps {
  result: AnalysisResponse;
  status: AnalysisStatus;
  timestamp: string;
  errorMessage: string | null;
  onRetry: () => void;
}

export function AnalysisResult({
  result,
  status,
  timestamp,
  errorMessage,
  onRetry,
}: AnalysisResultProps) {
  const isFake = result.label === "FAKE";
  const tone = isFake ? "fake" : "real";
  const accent = isFake ? "#c7353c" : "#2f7447";
  const panelClass = isFake
    ? "border-[#f2d9d4] bg-[linear-gradient(110deg,#ffefec,#fae6e2)]"
    : "border-[#d6e7d8] bg-[linear-gradient(110deg,#eef7ef,#e3f0e5)]";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      aria-live="polite"
      aria-busy={status === "loading"}
      className="rounded-[22px] border border-white/70 bg-[rgba(255,248,246,0.91)] p-5 shadow-[0_20px_42px_rgba(59,40,34,0.11)] sm:p-6 sm:pb-8"
    >
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 sm:flex-nowrap">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] ${
              isFake ? "bg-[#ffe6e3] text-[#d63b43]" : "bg-[#e0eee2] text-[#34794b]"
            }`}
          >
            {isFake ? (
              <AlertCircle size={21} strokeWidth={2} aria-hidden="true" />
            ) : (
              <CheckCircle2 size={21} strokeWidth={2} aria-hidden="true" />
            )}
          </span>
          <h2 className="text-[14px] font-extrabold text-[#112f4d] sm:truncate sm:text-[16px]">
            Результат анализа
          </h2>
        </div>
        <time className="w-full pl-12 text-left text-[10px] font-medium text-[#768398] sm:w-auto sm:shrink-0 sm:pl-0 sm:text-right sm:text-[11px]">
          {timestamp}
        </time>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        {status === "loading" ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoadingState />
          </motion.div>
        ) : status === "error" ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 rounded-[15px] border border-[#efc9c4] bg-[#fff0ed] p-5"
            role="alert"
          >
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 shrink-0 text-[#be3f43]" size={21} />
              <div>
                <h3 className="text-[15px] font-extrabold text-[#a93239]">
                  Не удалось выполнить анализ
                </h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[#735c62]">
                  {errorMessage ?? "Попробуйте ещё раз через несколько секунд."}
                </p>
                <button
                  type="button"
                  onClick={onRetry}
                  className="focus-ring mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#a83a3e] px-4 text-[12px] font-bold text-white"
                >
                  <RefreshCw size={15} aria-hidden="true" />
                  Повторить
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`${result.label}-${result.confidence}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.28 }}
          >
            <section
              className={`mt-3 grid items-center gap-4 rounded-[15px] border px-4 py-3.5 sm:grid-cols-[1fr_auto] sm:gap-5 ${panelClass}`}
              aria-label={`Результат: ${result.label}`}
            >
              <div className="flex min-w-0 items-center gap-4">
                <span
                  className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] ${
                    isFake ? "bg-[#f5c8c8] text-[#c63840]" : "bg-[#cfe4d2] text-[#347a4d]"
                  }`}
                >
                  {isFake ? (
                    <AlertTriangle size={23} fill="currentColor" strokeWidth={1.5} aria-hidden="true" />
                  ) : (
                    <CheckCircle2 size={24} strokeWidth={2.2} aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0">
                  <p
                    className="text-[42px] leading-none font-extrabold tracking-[-0.04em] sm:text-[48px]"
                    style={{ color: accent }}
                  >
                    {result.label}
                  </p>
                  <p className="mt-2 max-w-[300px] text-[11px] leading-[1.4] text-[#5e5e68] sm:text-[12px]">
                    {isFake
                      ? "Высокая вероятность недостоверной информации"
                      : "Признаки недостоверности выражены слабо"}
                  </p>
                </div>
              </div>

              <ConfidenceRing value={result.confidence} label="уверенность модели" tone={tone} />
            </section>

            <ResultExplanation label={result.label} />

            <aside className="mt-4 flex gap-3 rounded-[13px] bg-[#e7eef9] px-4 py-3 text-[#3c608e]">
              <Info className="mt-0.5 shrink-0" size={19} fill="#5f8ed8" color="white" aria-hidden="true" />
              <p className="text-[11.5px] leading-[1.55] sm:text-[12px]">
                Результаты работы модели — это вероятность, а не окончательный вердикт.
                Всегда проверяйте информацию по надёжным источникам и используйте
                критическое мышление.
              </p>
            </aside>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
