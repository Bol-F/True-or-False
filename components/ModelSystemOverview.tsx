import {
  ArrowRight,
  Bot,
  BrainCircuit,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";

import { MODEL_QUALITY } from "@/lib/model-quality";

const accuracy = MODEL_QUALITY.metrics.find(
  (metric) => metric.key === "accuracy",
)?.value;

const stages = [
  {
    number: "01",
    icon: BrainCircuit,
    title: "ML-модель v2",
    badge: `${Math.round((accuracy ?? 0) * 100)}% внешняя accuracy`,
    description:
      "Word + character TF-IDF и логистическая регрессия оценивают языковые признаки текста. Модель возвращает REAL или FAKE и калиброванную уверенность.",
    detail: `${MODEL_QUALITY.dataset.samples} текстов во внешней OOF-оценке`,
    tone: "blue",
  },
  {
    number: "02",
    icon: SearchCheck,
    title: "Поиск Tavily",
    badge: "до 6 HTTPS-источников",
    description:
      "Tavily формирует поисковый запрос и находит актуальные страницы в интернете. Ссылки берутся из поиска, а не придумываются языковой моделью.",
    detail: "Basic Search · один запрос на проверку",
    tone: "orange",
  },
  {
    number: "03",
    icon: Bot,
    title: "Анализ Gemini",
    badge: "сопоставление с источниками",
    description:
      "Gemini Flash Lite выделяет точные утверждения и сравнивает их только с найденными фрагментами: подтверждено, опровергнуто, частично или не проверено.",
    detail: "Результат показывается отдельно от ML-процента",
    tone: "green",
  },
] as const;

const toneClasses = {
  blue: {
    icon: "bg-[#dceaf3] text-[#285e7d]",
    badge: "bg-[#e6eff5] text-[#446b82]",
    line: "bg-[#7ca5bd]",
  },
  orange: {
    icon: "bg-[#f6e1d1] text-[#b15432]",
    badge: "bg-[#f7e9de] text-[#8d5c45]",
    line: "bg-[#dc8a5d]",
  },
  green: {
    icon: "bg-[#dcebdc] text-[#37724d]",
    badge: "bg-[#e5f0e5] text-[#52705b]",
    line: "bg-[#6b9c78]",
  },
} as const;

export function ModelSystemOverview() {
  return (
    <section
      aria-labelledby="system-overview-heading"
      className="tool-gutter pb-7 pt-1"
    >
      <div className="overflow-hidden rounded-[22px] border border-[#d3d9d8] bg-[#fbfaf6]/90 shadow-[0_14px_34px_rgba(24,41,55,0.045)]">
        <div className="border-b border-[#dddeda] px-6 py-6 sm:px-8 sm:py-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#8a5b42]">
                Текущая архитектура
              </p>
              <h2
                id="system-overview-heading"
                className="mt-2 font-serif text-[29px] leading-[1.08] font-semibold tracking-[-0.035em] text-ink sm:text-[36px]"
              >
                Как RuFact проверяет текст сейчас
              </h2>
            </div>
            <p className="max-w-[430px] text-[12.5px] leading-[1.6] text-[#647487] sm:text-right">
              Итог состоит из двух независимых сигналов: статистической оценки текста и
              проверки фактов по найденным интернет-источникам.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const tone = toneClasses[stage.tone];

            return (
              <article
                key={stage.number}
                className="relative border-b border-[#dddeda] px-6 py-7 last:border-b-0 sm:px-8 lg:border-b-0 lg:border-r lg:last:border-r-0"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className={`grid h-11 w-11 place-items-center rounded-[13px] ${tone.icon}`}>
                    <Icon size={22} strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  <span className="font-serif text-[25px] font-semibold text-[#ccd2d2]">
                    {stage.number}
                  </span>
                </div>
                <div className={`mt-5 h-0.5 w-10 rounded-full ${tone.line}`} aria-hidden="true" />
                <h3 className="mt-4 text-[17px] font-extrabold tracking-[-0.02em] text-[#173b59]">
                  {stage.title}
                </h3>
                <span className={`mt-2 inline-flex rounded-md px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.06em] ${tone.badge}`}>
                  {stage.badge}
                </span>
                <p className="mt-3 text-[12px] leading-[1.6] text-[#667586]">
                  {stage.description}
                </p>
                <p className="mt-4 text-[10px] font-bold leading-[1.45] text-[#82909b]">
                  {stage.detail}
                </p>

                {index < stages.length - 1 ? (
                  <span className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 place-items-center rounded-full border border-[#d6dcda] bg-[#fbfaf6] text-[#7b8a91] lg:grid">
                    <ArrowRight size={13} strokeWidth={2} aria-hidden="true" />
                  </span>
                ) : null}
              </article>
            );
          })}
        </div>

        <div className="flex gap-3 border-t border-[#dddeda] bg-[#edf3f1] px-6 py-4 sm:px-8">
          <ShieldCheck className="mt-0.5 shrink-0 text-[#397156]" size={19} aria-hidden="true" />
          <p className="text-[11px] leading-[1.55] text-[#577065]">
            <strong className="font-extrabold text-[#315e49]">Что изменилось:</strong>{" "}
            раньше блок «Как проверить источники» предлагал только ручной поиск. Теперь при
            включённой проверке Tavily действительно находит страницы, а RuFact показывает
            кликабельные ссылки и вывод Gemini рядом с отдельной оценкой ML-модели.
          </p>
        </div>
      </div>
    </section>
  );
}
