import { ChevronDown, HelpCircle } from "lucide-react";

const questions = [
  {
    question: "Что означает процент в результате?",
    answer:
      "Это уверенность модели в конкретном ответе, а не общая точность RuFact. Измеренная accuracy основной модели на внешней выборке составляет 71,97%.",
  },
  {
    question: "RuFact проверяет факты в интернете?",
    answer:
      "Нет. Основная модель распознаёт статистические признаки формулировок. Gemini тоже анализирует только переданный текст. Ссылки «Искать первоисточник» помогают начать самостоятельную проверку, но не считаются автоматическим подтверждением.",
  },
  {
    question: "Зачем нужно второе мнение Gemini?",
    answer:
      "Оно разбивает текст на отдельные утверждения, отделяет факты от мнений и показывает ещё одну осторожную интерпретацию. Ответ Gemini не меняет процент основной ML-модели и может ошибаться независимо от неё.",
  },
  {
    question: "Где хранится мой текст?",
    answer:
      "По умолчанию история выключена. После явного включения последние проверки сохраняются только в localStorage этого браузера и автоматически удаляются через 30 дней. При включении Gemini текст также передаётся Google для текущего запроса.",
  },
] as const;

export function Faq() {
  return (
    <section
      id="questions"
      aria-labelledby="faq-title"
      className="content-gutter scroll-mt-20 pb-8 pt-8 sm:pb-10 sm:pt-10"
    >
      <div className="grid gap-7 border-t border-[#d8d4cd] pt-8 lg:grid-cols-[0.62fr_1.38fr] lg:gap-12">
        <div>
          <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#e2ebef] text-[#315f78]">
            <HelpCircle size={21} strokeWidth={1.9} aria-hidden="true" />
          </span>
          <h2
            id="faq-title"
            className="mt-4 font-serif text-[29px] leading-[1.08] font-semibold tracking-[-0.035em] text-ink sm:text-[34px]"
          >
            Коротко о главном
          </h2>
          <p className="mt-3 max-w-[390px] text-[12.5px] leading-[1.6] text-[#68778a]">
            Ответы помогают не перепутать вероятностную подсказку с профессиональным
            фактчекингом.
          </p>
        </div>

        <div className="divide-y divide-[#d9d7d1] border-y border-[#d9d7d1]">
          {questions.map((item) => (
            <details key={item.question} className="group">
              <summary className="focus-ring flex min-h-[58px] cursor-pointer list-none items-center gap-4 rounded-lg py-3 marker:hidden">
                <span className="min-w-0 flex-1 text-[13px] font-extrabold text-[#213e58] sm:text-[14px]">
                  {item.question}
                </span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-[#ece9e2] text-[#607181] transition-transform group-open:rotate-180">
                  <ChevronDown size={16} strokeWidth={2} aria-hidden="true" />
                </span>
              </summary>
              <p className="max-w-[720px] pb-4 pr-10 text-[11.5px] leading-[1.65] text-[#68778a] sm:text-[12.5px]">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
