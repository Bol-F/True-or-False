"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Info, ScanSearch } from "lucide-react";

export function LoadingState() {
  const prefersReducedMotion = useReducedMotion();
  const pulseAnimation = prefersReducedMotion
    ? undefined
    : { opacity: [0.38, 0.72, 0.38] };
  const pulseTransition = {
    duration: 1.65,
    repeat: prefersReducedMotion ? 0 : Number.POSITIVE_INFINITY,
    ease: "easeInOut" as const,
  };

  return (
    <motion.section
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Идёт анализ текста"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
      className="w-full"
    >
      <div className="mt-4 flex min-h-[158px] items-center justify-between gap-4 rounded-[15px] border border-[#f0dfda] bg-[linear-gradient(112deg,#fff6f3_0%,#fbedeb_100%)] px-5 py-5 sm:px-6">
        <div className="max-w-[310px]">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/70 text-[#c84b43] shadow-[0_5px_14px_rgba(115,47,40,0.08)]">
              <ScanSearch size={22} strokeWidth={2} aria-hidden="true" />
            </span>
            <p className="text-[18px] font-extrabold tracking-[-0.025em] text-ink sm:text-[21px]">
              Анализируем текст
            </p>
          </div>
          <p className="mt-3 text-[12px] leading-[1.5] text-[#68768b] sm:text-[13px]">
            Сопоставляем формулировки, источники и контекст. Обычно это занимает
            несколько секунд.
          </p>
        </div>

        <div className="relative grid h-24 w-24 shrink-0 place-items-center sm:h-28 sm:w-28" aria-hidden="true">
          <div className="absolute inset-0 rounded-full border-[9px] border-[#f2ceca]" />
          <motion.div
            className="absolute inset-0 rounded-full border-[9px] border-transparent border-r-[#d84a4c] border-t-[#d84a4c]"
            animate={{ rotate: prefersReducedMotion ? 38 : 398 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 1.35,
              repeat: prefersReducedMotion ? 0 : Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
          <div className="h-3 w-3 rounded-full bg-[#d84a4c] shadow-[0_0_0_7px_rgba(216,74,76,0.10)]" />
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[#e5efe3] text-[#3c7e50]">
          <ScanSearch size={17} strokeWidth={2} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 pt-1" aria-hidden="true">
          <motion.div className="h-3 w-28 rounded-full bg-[#dfe2df]" animate={pulseAnimation} transition={pulseTransition} />
          <div className="mt-3 grid gap-2.5">
            <motion.div className="h-2.5 w-full rounded-full bg-[#e5e2dc]" animate={pulseAnimation} transition={pulseTransition} />
            <motion.div className="h-2.5 w-[88%] rounded-full bg-[#e5e2dc]" animate={pulseAnimation} transition={{ ...pulseTransition, delay: 0.1 }} />
            <motion.div className="h-2.5 w-[67%] rounded-full bg-[#e5e2dc]" animate={pulseAnimation} transition={{ ...pulseTransition, delay: 0.2 }} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-[13px] bg-[#e8effa] px-4 py-3.5 text-[#50719f]">
        <Info size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p className="text-[11px] leading-[1.45] sm:text-xs">
          Не закрывайте страницу — результат появится здесь сразу после завершения
          анализа.
        </p>
      </div>

      <span className="sr-only">
        Модель анализирует введённый текст. Пожалуйста, подождите.
      </span>
    </motion.section>
  );
}
