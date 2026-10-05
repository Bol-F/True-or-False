import { ChevronDown, HelpCircle } from "lucide-react";
import { MODEL_QUALITY } from "@/lib/model-quality";

const measuredAccuracy = MODEL_QUALITY.metrics.find(
  (metric) => metric.key === "accuracy",
)?.value;

const questions = [
  {
    question: "Что означает процент в результате?",
    answer: `Это уверенность модели в конкретном ответе, а не общая точность RuFact. Измеренная accuracy основной модели на внешней выборке составляет ${((measuredAccuracy ?? 0) * 100).toFixed(2).replace(".", ",")}%.`,
  },
  {
    question: "RuFact проверяет факты в интернете?",
    answer:
      "Основная ML-модель распознаёт только статистические признаки формулировок. Интернет-проверка использует Tavily для поиска, после чего Gemini сопоставляет утверждения с найденными фрагментами и показывает ссылки. Это всё равно не окончательный вердикт: важные источники нужно открыть и проверить в контексте.",
  },
  {
    question: "Зачем нужна проверка Gemini?",
    answer:
      "Она разбивает текст на утверждения и показывает, что найденные источники подтверждают, опровергают или не позволяют установить. Вывод Gemini не меняет процент основной ML-модели и может ошибаться независимо от неё.",
  },
  {
    question: "Где хранится мой текст?",
    answer:
      "По умолчанию история выключена. После явного включения последние проверки сохраняются только в localStorage этого браузера и автоматически удаляются через 30 дней. Загруженный файл на сервере не сохраняется. При включении интернет-проверки извлечённый текст передаётся Google для текущего запроса.",
  },
] as const;

export function Faq() {
  return (
    <section
      id="questions"
      aria-labelledby="faq-title"
      className="content-gutter scroll-mt-20 pb-5 pt-5 sm:pb-10 sm:pt-10"
    >
      <div className="grid gap-4 border-t border-[#d8d4cd] pt-5 sm:gap-7 sm:pt-8 lg:grid-cols-[0.62fr_1.38fr] lg:gap-12">
        <div>
          <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-[#e2ebef] text-[#315f78] sm:h-10 sm:w-10 sm:rounded-[12px]">
            <HelpCircle size={18} strokeWidth={1.9} aria-hidden="true" />
          </span>
          <h2
            id="faq-title"
            className="mt-2.5 font-serif text-[25px] leading-[1.08] font-semibold tracking-[-0.035em] text-ink sm:mt-4 sm:text-[34px]"
          >
            Коротко о главном
          </h2>
          <p className="mt-1.5 max-w-[390px] text-[10.5px] leading-[1.45] text-[#68778a] sm:mt-3 sm:text-[12.5px] sm:leading-[1.6]">
            Ответы помогают не перепутать вероятностную подсказку с профессиональным
            фактчекингом.
          </p>
        </div>

        <div className="divide-y divide-[#d9d7d1] border-y border-[#d9d7d1]">
          {questions.map((item) => (
            <details key={item.question} className="group">
              <summary className="focus-ring flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-lg py-2 marker:hidden sm:min-h-[58px] sm:gap-4 sm:py-3">
                <span className="min-w-0 flex-1 text-[11px] font-extrabold text-[#213e58] sm:text-[14px]">
                  {item.question}
                </span>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-[#ece9e2] text-[#607181] transition-transform group-open:rotate-180 sm:h-8 sm:w-8 sm:rounded-[9px]">
                  <ChevronDown size={16} strokeWidth={2} aria-hidden="true" />
                </span>
              </summary>
              <p className="max-w-[720px] pb-3 pr-8 text-[10px] leading-[1.5] text-[#68778a] sm:pb-4 sm:pr-10 sm:text-[12.5px] sm:leading-[1.65]">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
