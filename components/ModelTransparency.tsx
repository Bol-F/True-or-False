import { ArrowDownRight, FlaskConical, Scale, ShieldAlert } from "lucide-react";
import { MODEL_QUALITY } from "@/lib/model-quality";

function formatMetric(value: number | null) {
  return value === null ? "Не измерено" : `${Math.round(value * 100)}%`;
}

export function ModelTransparency() {
  return (
    <section
      id="model-quality"
      aria-labelledby="model-quality-heading"
      className="tool-gutter scroll-mt-8 pb-7 pt-1"
    >
      <div className="relative isolate overflow-hidden rounded-[22px] border border-[#cfd9df] bg-[linear-gradient(118deg,#eaf2f5_0%,#f7f2e9_48%,#f2e8dc_100%)] shadow-[0_14px_34px_rgba(24,41,55,0.055)]">
        <div
          className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full border-[38px] border-white/30"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-[34%] h-48 w-72 -rotate-12 rounded-[50%] bg-[#d98a58]/12"
          aria-hidden="true"
        />

        <div className="relative grid lg:grid-cols-[0.82fr_1.18fr]">
          <div className="border-b border-[#ccd7dc] px-6 py-7 sm:px-8 lg:border-b-0 lg:border-r lg:px-9 lg:py-9">
            <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.17em] text-[#8a5b42]">
              <FlaskConical size={16} strokeWidth={2} aria-hidden="true" />
              ML-базовая модель · {MODEL_QUALITY.modelVersion}
            </div>
            <h2
              id="model-quality-heading"
              className="mt-3 max-w-[470px] font-serif text-[30px] leading-[1.08] font-semibold tracking-[-0.035em] text-ink sm:text-[37px]"
            >
              Как измеряется качество модели
            </h2>
            <p className="mt-4 max-w-[520px] text-[13px] leading-[1.65] text-[#5d6e81] sm:text-[14px]">
              Процент в результате показывает уверенность классификатора в конкретном
              ответе. Он не означает, что сервис отвечает правильно в таком же проценте
              случаев.
            </p>

            <div className="mt-6 flex items-center gap-4 rounded-[16px] border border-white/60 bg-white/45 px-4 py-4 sm:px-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] bg-[#173b5d] text-white shadow-[0_8px_20px_rgba(23,59,93,0.14)]">
                <Scale size={23} strokeWidth={1.9} aria-hidden="true" />
              </span>
              <p className="text-[14px] leading-[1.35] font-extrabold text-[#173b5d] sm:text-[16px]">
                Уверенность в ответе <span className="px-1 text-[23px] text-[#c7502e]">≠</span>
                точность сервиса
              </p>
            </div>
          </div>

          <div className="px-6 py-7 sm:px-8 lg:px-9 lg:py-9">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#f3d8c8] text-[#b44a2b]">
                <ShieldAlert size={19} strokeWidth={2} aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-[17px] font-extrabold tracking-[-0.02em] text-ink">
                  Accuracy на внешней выборке: 72%
                </h3>
                <p className="mt-1.5 max-w-[620px] text-[12.5px] leading-[1.55] text-[#687689] sm:text-[13px]">
                  {MODEL_QUALITY.dataset.samples} русскоязычных текстов · {MODEL_QUALITY.dataset.split}.
                  95% интервал для accuracy: {Math.round(MODEL_QUALITY.confidenceInterval[0] * 100)}–
                  {Math.round(MODEL_QUALITY.confidenceInterval[1] * 100)}%. Это оценка качества
                  на конкретной выборке, а не гарантия для любого текста.
                </p>
              </div>
            </div>

            <div className="mt-6" role="table" aria-label="Планируемые метрики качества">
              <div className="sr-only" role="row">
                <span role="columnheader">Метрика</span>
                <span role="columnheader">Описание</span>
                <span role="columnheader">Значение</span>
              </div>
              {MODEL_QUALITY.metrics.map((metric) => (
                <div
                  key={metric.key}
                  role="row"
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-t border-[#bdcbd1]/65 py-3 first:border-t-0 first:pt-0"
                >
                  <div className="min-w-0">
                    <p role="cell" className="text-[13px] font-extrabold text-[#203d58]">
                      {metric.label}
                    </p>
                    <p role="cell" className="mt-0.5 text-[11.5px] leading-[1.45] text-[#718092]">
                      {metric.description}
                    </p>
                  </div>
                  <p
                    role="cell"
                    className="self-center whitespace-nowrap rounded-lg bg-[#e1e5e2]/75 px-3 py-1.5 text-[11px] font-bold text-[#68736f]"
                  >
                    {formatMetric(metric.value)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex gap-3 rounded-[13px] bg-[#dfe9f3] px-4 py-3 text-[#3d607f]">
              <ArrowDownRight className="mt-0.5 shrink-0" size={18} strokeWidth={2} aria-hidden="true" />
              <p className="text-[11.5px] leading-[1.5]">
                На похожей внутренней выборке модель получила 99,7%, но этот результат
                завышен различиями между официальными и синтетическими текстами. Поэтому
                выше показана более строгая внешняя оценка.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
