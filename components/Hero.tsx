"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const enter = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export function Hero() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="hero-heading"
      className="content-gutter relative grid min-h-[310px] gap-5 pb-9 pt-3 lg:min-h-[286px] lg:grid-cols-[minmax(620px,1fr)_minmax(0,1fr)] lg:gap-0 lg:pb-0 lg:pt-0"
    >
      <motion.div
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.08, delayChildren: 0.05 }}
        className="relative z-10 max-w-[655px]"
      >
        <motion.p
          variants={enter}
          transition={{ duration: 0.45 }}
          className="mb-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#718097] sm:text-xs"
        >
          Анализ русскоязычных текстов
        </motion.p>

        <motion.h1
          id="hero-heading"
          variants={enter}
          transition={{ duration: 0.5 }}
          className="max-w-[680px] font-serif text-[39px] leading-[1.03] font-semibold tracking-[-0.045em] text-ink sm:text-[48px] lg:text-[51px] lg:leading-[0.96]"
        >
          Проверьте текст
          <br />
          <span className="sm:whitespace-nowrap">
            на признаки <span className="text-[#c9421e]">недостоверной</span>
          </span>
          <br />
          <span className="text-[#c9421e]">информации</span>
        </motion.h1>

        <motion.p
          variants={enter}
          transition={{ duration: 0.5 }}
          className="mt-3 max-w-[615px] text-[15px] leading-[1.52] text-[#607087] sm:text-[16px]"
        >
          Наш сервис использует ML-модель на основе RuBERT, чтобы помочь оценить,
          насколько текст может быть недостоверным. Это не замена профессиональному
          фактчекингу, а инструмент для более осознанного чтения новостей.
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className="relative -mx-4 min-h-[238px] sm:min-h-[280px] lg:-mr-[46px] lg:-ml-24 lg:min-h-[286px]"
      >
        <div className="absolute inset-x-0 bottom-[-6px] top-[-110px]">
          <Image
            src="/hero-collage.png"
            alt="Редакционный коллаж с московской архитектурой и набережной"
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(max-width: 1024px) 100vw, 58vw"
            className="object-contain object-right-bottom"
          />
        </div>

        <div className="font-hand absolute left-[11%] top-[-2%] hidden -rotate-6 text-[19px] leading-[0.95] text-[#7b879a] xl:block">
          Больше
          <br /> контекста —
          <br /> меньше
          <br /> манипуляций
          <svg
            width="68"
            height="32"
            viewBox="0 0 68 32"
            fill="none"
            className="ml-11 mt-0 rotate-[17deg]"
            aria-hidden="true"
          >
            <path d="M2 25C20 4 39 5 60 18" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M53 11L61 18L51 19" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="font-hand absolute right-[5%] top-[1%] hidden rotate-[-4deg] text-[18px] leading-[1.04] text-[#66758c] xl:block">
          Проверяйте факты.
          <br /> Думайте критически.
          <br /> Делитесь ответственно.
          <span className="mt-2 block h-px w-14 -rotate-6 bg-[#d6693a]" />
        </div>
      </motion.div>
    </section>
  );
}
