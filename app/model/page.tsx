import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { InfoCards } from "@/components/InfoCards";
import { ModelEvaluationDetails } from "@/components/ModelEvaluationDetails";
import { ModelTransparency } from "@/components/ModelTransparency";

export const metadata: Metadata = {
  title: "О модели — RuFact",
  description:
    "Метрики, устройство и ограничения модели RuFact для анализа русскоязычных текстов.",
};

export default function ModelPage() {
  return (
    <div className="paper-shell">
      <Header />
      <main>
        <section
          aria-labelledby="model-page-heading"
          className="content-gutter pb-2 pt-4 sm:pb-3 sm:pt-7"
        >
          <Link
            href="/#analyzer"
            className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#d7d8d3] bg-[#fbfaf6]/80 px-3.5 text-[12px] font-bold text-[#486177] transition-colors hover:bg-white hover:text-ink"
          >
            <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
            К проверке текста
          </Link>

          <div className="mt-5 max-w-[760px] sm:mt-7">
            <h1
              id="model-page-heading"
              className="font-serif text-[38px] leading-[1.02] font-semibold tracking-[-0.045em] text-ink sm:text-[50px]"
            >
              О модели RuFact
            </h1>
            <p className="mt-3 text-[14px] leading-[1.65] text-[#607087] sm:max-w-[700px] sm:text-[16px]">
              Здесь собраны устройство модели, честная внешняя оценка качества и ограничения,
              которые важно учитывать при чтении результата.
            </p>
          </div>
        </section>

        <InfoCards />
        <ModelTransparency />
        <ModelEvaluationDetails />
      </main>
      <Footer />
    </div>
  );
}
