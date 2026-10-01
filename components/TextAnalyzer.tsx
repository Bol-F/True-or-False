"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  FileText,
  LoaderCircle,
  Sparkles,
  Trash2,
} from "lucide-react";
import { ExampleChips, type TextExample } from "./ExampleChips";
import { HistoryTrigger } from "./HistoryTrigger";

interface TextAnalyzerProps {
  text: string;
  examples: readonly TextExample[];
  activeExampleId: string | null;
  isLoading: boolean;
  validationMessage: string | null;
  historyOpen: boolean;
  historyEnabled: boolean;
  historyCount: number;
  geminiConfigured: boolean;
  useGemini: boolean;
  onTextChange: (value: string) => void;
  onClear: () => void;
  onExampleSelect: (example: TextExample) => void;
  onSubmit: () => void;
  onOpenHistory: () => void;
  onUseGeminiChange: (enabled: boolean) => void;
}

const MAX_LENGTH = 5000;

export function TextAnalyzer({
  text,
  examples,
  activeExampleId,
  isLoading,
  validationMessage,
  historyOpen,
  historyEnabled,
  historyCount,
  geminiConfigured,
  useGemini,
  onTextChange,
  onClear,
  onExampleSelect,
  onSubmit,
  onOpenHistory,
  onUseGeminiChange,
}: TextAnalyzerProps) {
  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.22 }}
      className="rounded-[21px] border border-white/70 bg-[rgba(252,250,247,0.94)] p-5 shadow-[0_14px_34px_rgba(24,41,55,0.075)]"
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#e6f0fa] text-[#3574ba]">
            <FileText size={19} strokeWidth={2} aria-hidden="true" />
          </span>
          <h2 className="text-[15px] font-extrabold tracking-[-0.02em] text-[#102a49] sm:text-[16px]">
            Введите текст для проверки
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <HistoryTrigger
            isOpen={historyOpen}
            enabled={historyEnabled}
            itemCount={historyCount}
            onOpen={onOpenHistory}
          />
          <button
            type="button"
            onClick={onClear}
            disabled={isLoading || text.length === 0}
            aria-label="Очистить текст"
            className="focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-[12px] font-medium text-[#78869a] transition-colors hover:bg-[#f1eeea] hover:text-[#4d5c72] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Trash2 size={14} strokeWidth={1.8} aria-hidden="true" />
            <span className="hidden sm:inline">Очистить</span>
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="analysis-text" className="sr-only">
          Русскоязычный текст для анализа
        </label>
        <textarea
          id="analysis-text"
          value={text}
          maxLength={MAX_LENGTH}
          disabled={isLoading}
          aria-describedby="text-counter text-helper"
          aria-invalid={Boolean(validationMessage)}
          aria-errormessage={validationMessage ? "text-validation" : undefined}
          onChange={(event) => onTextChange(event.target.value)}
          className={`focus-ring block min-h-[308px] w-full resize-none rounded-[14px] border bg-[rgba(255,255,255,0.42)] px-4 py-3 text-[14px] leading-[1.48] text-[#303b4d] shadow-inner shadow-[#16324a]/[0.015] transition-colors placeholder:text-[#8993a0] disabled:cursor-wait disabled:opacity-75 sm:min-h-[184px] sm:text-[16px] ${
            validationMessage
              ? "border-[#d98383]"
              : "border-[#d7d9dc] hover:border-[#c6cbd0]"
          }`}
          placeholder="Вставьте новость, публикацию или утверждение…"
        />
        <div className="mt-1 flex justify-end pr-1">
          <span
            id="text-counter"
            className="text-[11px] font-medium tabular-nums text-[#78859a]"
          >
            {text.length} / {MAX_LENGTH}
          </span>
        </div>
      </div>

      {validationMessage ? (
        <p
          id="text-validation"
          aria-live="polite"
          className="pt-2 text-[12px] font-semibold text-[#b73c42]"
        >
          {validationMessage}
        </p>
      ) : null}

      <ExampleChips
        examples={examples}
        activeId={activeExampleId}
        disabled={isLoading}
        onSelect={onExampleSelect}
      />

      <section
        aria-labelledby="gemini-option-heading"
        className="mt-4 rounded-[13px] border border-[#cfdae6] bg-[#eef4f8]/75 px-3.5 py-2.5"
      >
        <label
          htmlFor="use-gemini"
          className={`flex items-start gap-3 ${
            geminiConfigured ? "cursor-pointer" : "cursor-not-allowed"
          }`}
        >
          <input
            id="use-gemini"
            type="checkbox"
            role="switch"
            checked={useGemini}
            disabled={isLoading || !geminiConfigured}
            aria-describedby="gemini-option-description gemini-privacy-note"
            onChange={(event) => onUseGeminiChange(event.target.checked)}
            className="focus-ring mt-0.5 h-4 w-4 shrink-0 accent-[#285b87] disabled:cursor-not-allowed"
          />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span
                id="gemini-option-heading"
                className="text-[12.5px] font-extrabold text-[#163957]"
              >
                Второе мнение Gemini
              </span>
              <span className="rounded bg-[#d9e6f1] px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.08em] text-[#496b88]">
                Экспериментально
              </span>
            </span>
            <span
              id="gemini-option-description"
              className="mt-0.5 block text-[10.5px] leading-[1.45] text-[#60768a]"
            >
              {geminiConfigured
                ? useGemini
                  ? "Включено для этой проверки; основной ML-вердикт не изменится."
                  : "Необязательный независимый анализ без поиска в интернете."
                : "Сейчас не настроено; основной ML-анализ работает как обычно."}
            </span>
          </span>
        </label>
        <p
          id="gemini-privacy-note"
          className="mt-1.5 pl-7 text-[9.5px] leading-[1.45] text-[#718092]"
        >
          {geminiConfigured ? (
            <>
              Текст передаётся Google. Не отправляйте личные или конфиденциальные данные. {" "}
              <a
                href="https://ai.google.dev/gemini-api/terms"
                target="_blank"
                rel="noreferrer"
                className="focus-ring rounded-sm font-bold text-[#315f87] underline decoration-[#8aa5bd] underline-offset-2"
              >
                Условия Google
              </a>
            </>
          ) : (
            "Для включения добавьте серверный GEMINI_API_KEY; ключ в браузер не передаётся."
          )}
        </p>
      </section>

      <div className="mt-6 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-7">
        <motion.button
          type="button"
          whileHover={isLoading ? undefined : { y: -1 }}
          whileTap={isLoading ? undefined : { scale: 0.99 }}
          disabled={isLoading}
          onClick={onSubmit}
          className="focus-ring group inline-flex min-h-[58px] flex-1 items-center justify-center gap-4 rounded-[14px] bg-[linear-gradient(100deg,#0b2a4a,#244f78)] px-7 text-[16px] font-bold text-white shadow-[0_12px_24px_rgba(13,47,79,0.16)] disabled:cursor-wait disabled:opacity-85 sm:max-w-[345px]"
        >
          {isLoading ? (
            <>
              <LoaderCircle className="animate-spin" size={20} aria-hidden="true" />
              Анализируем…
            </>
          ) : (
            <>
              <Sparkles size={20} aria-hidden="true" />
              Проверить текст
              <ArrowRight
                size={20}
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </>
          )}
        </motion.button>

        <p id="text-helper" className="text-[11px] leading-[1.45] text-[#77859a] sm:max-w-[230px] sm:text-[12px]">
          Поддерживаются тексты на русском языке
          <br className="hidden sm:block" /> до 5000 символов.
        </p>
      </div>
    </motion.article>
  );
}
