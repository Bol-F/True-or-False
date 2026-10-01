"use client";

import Link from "next/link";

import { Brand } from "./Brand";
import { useFeedback } from "./FeedbackProvider";

export function Footer() {
  const { openFeedback } = useFeedback();

  return (
    <footer className="content-gutter pb-6 pt-2">
      <div className="flex flex-col gap-5 rounded-[18px] bg-[#102f50] px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="[&_span]:text-white">
          <Brand />
          <p className="mt-2 text-[10.5px] leading-[1.5] text-[#b9c8d4]">
            Образовательный инструмент для осознанного чтения новостей.
          </p>
        </div>
        <nav aria-label="Навигация в подвале">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[10.5px] font-bold text-[#dbe4eb]">
            <li>
              <Link className="focus-ring rounded hover:text-white" href="/#analyzer">
                Проверить текст
              </Link>
            </li>
            <li>
              <Link className="focus-ring rounded hover:text-white" href="/model">
                О модели
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() => openFeedback({ source: "footer" })}
                className="focus-ring rounded hover:text-white"
              >
                Обратная связь
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
