"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ListChecks, SearchCheck } from "lucide-react";
import { useState } from "react";
import type { AnalysisLabel } from "@/lib/api";

const content = {
  FAKE: {
    explanation:
      "Текст содержит типичные признаки недостоверной информации: неподтверждённые заявления, ссылки на несуществующие исследования, чрезмерные и универсальные утверждения о пользе, а также отсутствие конкретных источников.",
    signals: [
      "Отсутствуют конкретные источники",
      "Слишком категоричные утверждения",
      "Ссылка на неопределённых «учёных»",
      "Медицинские утверждения без доказательств",
    ],
  },
  REAL: {
    explanation:
      "В тексте не обнаружены выраженные языковые признаки манипуляции: формулировки сдержанные, утверждения допускают проверку, а источники описаны конкретнее. Это не подтверждает факты автоматически.",
    signals: [
      "Сдержанные и проверяемые формулировки",
      "Нет обещаний гарантированного результата",
      "Указан источник или контекст",
      "Факты отделены от оценочных суждений",
    ],
  },
} satisfies Record<AnalysisLabel, { explanation: string; signals: string[] }>;

interface ResultExplanationProps {
  label: AnalysisLabel;
}

export function ResultExplanation({ label }: ResultExplanationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const resultContent = content[label];

  return (
    <div>
      <section
        id="questions"
        aria-labelledby="explanation-title"
        className="mt-3 flex scroll-mt-24 gap-3"
      >
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#dcecdf] text-[#2f7950]">
          <SearchCheck size={18} strokeWidth={2} aria-hidden="true" />
        </span>
        <div>
          <h3 id="explanation-title" className="text-[15px] font-extrabold text-[#173451]">
            Почему так?
          </h3>
          <p className="mt-2 text-[12.5px] leading-[1.55] text-[#69778c] sm:text-[13px]">
            {resultContent.explanation}
          </p>
        </div>
      </section>

      <div className="mt-3 overflow-hidden rounded-[12px] border border-[#ead5ce] bg-white/25">
        <button
          type="button"
          className="focus-ring flex min-h-11 w-full items-center gap-3 rounded-[11px] px-3 text-left text-[13px] font-semibold text-[#243b55] transition-colors hover:bg-white/35"
          aria-expanded={isOpen}
          aria-controls="result-signals"
          onClick={() => setIsOpen((value) => !value)}
        >
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#fae0d6] text-[#d45c39]">
            <ListChecks size={16} strokeWidth={2} aria-hidden="true" />
          </span>
          <span className="flex-1">Ключевые признаки в тексте</span>
          <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={17} aria-hidden="true" />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {isOpen ? (
            <motion.div
              id="result-signals"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <ul className="grid gap-2 border-t border-[#eadbd5] px-4 py-3 text-[12px] leading-[1.45] text-[#657287]">
                {resultContent.signals.map((signal) => (
                  <li key={signal} className="flex gap-2">
                    <span className="mt-[0.48rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#d66749]" />
                    {signal}
                  </li>
                ))}
              </ul>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
