"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "./Brand";

const navigation = [
  { label: "Как это работает", href: "#how-it-works" },
  { label: "О модели", href: "#model-quality" },
  { label: "Вопросы и ответы", href: "#questions" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header id="top" className="content-gutter relative z-50">
      <div className="flex min-h-[88px] items-center justify-between gap-5 lg:min-h-[98px]">
        <Brand />

        <nav aria-label="Основная навигация" className="hidden lg:block">
          <ul className="flex items-center gap-10 text-[14px] font-medium text-[#173552] xl:gap-12">
            {navigation.map((item) => (
              <li key={item.href}>
                <a
                  className="focus-ring rounded-md transition-colors hover:text-accent"
                  href={item.href}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <span className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#eaebe2] px-4 text-[13px] font-medium text-[#31543b]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#2f8744] shadow-[0_0_0_4px_rgba(47,135,68,0.08)]" />
            Бета-версия
          </span>
          <a
            className="focus-ring inline-flex min-h-11 items-center rounded-[13px] bg-ink-deep px-6 text-[14px] font-semibold text-white shadow-[0_7px_18px_rgba(10,41,73,0.16)] transition-transform hover:-translate-y-0.5"
            href="mailto:hello@rufact.ru"
          >
            Обратная связь
          </a>
        </div>

        <button
          type="button"
          className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#d7d8d3] bg-[#fbfaf6] text-ink md:hidden"
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
          onClick={() => setIsOpen((value) => !value)}
        >
          {isOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen ? (
          <motion.nav
            id="mobile-navigation"
            aria-label="Мобильная навигация"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute left-[18px] right-[18px] top-[78px] rounded-2xl border border-[#dedbd4] bg-[#fbf9f4] p-3 shadow-[0_18px_38px_rgba(21,38,54,0.14)] md:hidden"
          >
            <ul className="grid gap-1 text-[14px] font-semibold">
              {navigation.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="focus-ring block rounded-xl px-4 py-3 hover:bg-[#f0ece4]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-[#e3dfd7] px-3 pt-3">
              <span className="inline-flex items-center gap-2 text-xs font-medium text-[#31543b]">
                <span className="h-2 w-2 rounded-full bg-[#2f8744]" />
                Бета-версия
              </span>
              <a href="mailto:hello@rufact.ru" className="text-xs font-bold text-accent">
                Обратная связь
              </a>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
