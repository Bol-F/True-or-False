import {
  CheckCircle2,
  Database,
  GitCompareArrows,
  TriangleAlert,
} from "lucide-react";

import { MODEL_QUALITY } from "@/lib/model-quality";

const strengths = [
  "Быстро обрабатывает русскоязычные тексты локальной ML-моделью.",
  "Показывает калиброванную уверенность для конкретного ответа.",
  "Внешняя оценка отделена от завышенной внутренней метрики.",
  "Необязательная проверка Gemini показывает найденные интернет-источники отдельно от ML-оценки.",
];

export function ModelEvaluationDetails() {
  const [[trueReal, falseFake], [falseReal, trueFake]] =
    MODEL_QUALITY.confusionMatrix;

  return (
    <section
      aria-labelledby="evaluation-details-title"
      className="tool-gutter pb-9 pt-2"
    >
      <div className="grid overflow-hidden rounded-[22px] border border-[#d7d8d2] bg-[#faf8f3]/90 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border-b border-[#d7d8d2] px-6 py-7 sm:px-8 lg:border-b-0 lg:border-r lg:py-9">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#e3ebef] text-[#315d78]">
              <GitCompareArrows size={20} strokeWidth={1.9} aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#74828d]">
                157 текстов · внешний тест
              </p>
              <h2
                id="evaluation-details-title"
                className="font-serif text-[25px] leading-tight font-semibold tracking-[-0.03em] text-ink"
              >
                Где модель ошибается
              </h2>
            </div>
          </div>

          <p className="mt-4 text-[12.5px] leading-[1.65] text-[#657486]">
            Матрица показывает не только общий процент, но и два разных типа ошибки.
            Для фактчекинга это важнее одной красивой цифры.
          </p>

          <div className="mt-5 overflow-hidden rounded-[14px] border border-[#d7dcdd] bg-white/65">
            <table className="w-full border-collapse text-center text-[11px]">
              <caption className="sr-only">
                Матрица ошибок для классов REAL и FAKE
              </caption>
              <thead>
                <tr className="text-[#6f7d88]">
                  <th scope="col" className="p-2 text-left font-semibold">
                    Истинный класс
                  </th>
                  <th scope="col" className="p-2 font-semibold">Ответ REAL</th>
                  <th scope="col" className="p-2 font-semibold">Ответ FAKE</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[#e2e3df]">
                  <th scope="row" className="p-2 text-left font-extrabold text-[#315f45]">
                    REAL
                  </th>
                  <td className="bg-[#e5f0e6] p-3 text-[16px] font-extrabold text-[#326c47]">
                    {trueReal}
                  </td>
                  <td className="bg-[#fae8e2] p-3 text-[16px] font-extrabold text-[#a84e39]">
                    {falseFake}
                  </td>
                </tr>
                <tr className="border-t border-[#e2e3df]">
                  <th scope="row" className="p-2 text-left font-extrabold text-[#a14346]">
                    FAKE
                  </th>
                  <td className="bg-[#fae8e2] p-3 text-[16px] font-extrabold text-[#a84e39]">
                    {falseReal}
                  </td>
                  <td className="bg-[#e5f0e6] p-3 text-[16px] font-extrabold text-[#326c47]">
                    {trueFake}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[10.5px] leading-[1.5] text-[#75828e]">
            Модель пропустила {falseReal} из 81 размеченного FAKE-текста и ошибочно
            предупредила о {falseFake} из 76 REAL-текстов.
          </p>
        </div>

        <div className="px-6 py-7 sm:px-8 lg:py-9">
          <div className="grid gap-7 sm:grid-cols-2">
            <div>
              <h3 className="flex items-center gap-2 text-[14px] font-extrabold text-[#284b3a]">
                <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
                Сильные стороны
              </h3>
              <ul className="mt-3 grid gap-2.5">
                {strengths.map((item) => (
                  <li key={item} className="flex gap-2 text-[11.5px] leading-[1.5] text-[#617064]">
                    <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#4c8a60]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="flex items-center gap-2 text-[14px] font-extrabold text-[#87463d]">
                <TriangleAlert size={18} strokeWidth={2} aria-hidden="true" />
                Ограничения
              </h3>
              <ul className="mt-3 grid gap-2.5">
                {MODEL_QUALITY.limitations.map((item) => (
                  <li key={item} className="flex gap-2 text-[11.5px] leading-[1.5] text-[#74635f]">
                    <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#c96a4d]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-7 flex gap-3 border-t border-[#dddcd6] pt-5">
            <Database className="mt-0.5 shrink-0 text-[#637d91]" size={18} aria-hidden="true" />
            <p className="text-[10.5px] leading-[1.55] text-[#71808d]">
              Датасет и протокол воспроизводимы: версия корпуса, удаление дубликатов,
              разбиение, калибровка и контрольные хэши зафиксированы вместе с моделью.
              Это позволяет сравнивать будущие версии на одном и том же честном
              бенчмарке.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
