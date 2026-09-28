"use client";

import { BookOpen, Cpu, ShieldCheck } from "lucide-react";
import { InfoCard } from "./InfoCard";

const cards = [
  {
    variant: "language" as const,
    icon: BookOpen,
    title: "Русский язык",
    description:
      "Оптимизировано для анализа русскоязычных новостных текстов, постов и сообщений.",
    annotation: "Для русскоязычного пространства",
  },
  {
    variant: "model" as const,
    icon: Cpu,
    title: "Готово к RuBERT",
    description:
      "API-слой подготовлен для подключения обученной модели. Сейчас интерфейс честно помечает демонстрационные ответы.",
    annotation: "Технологии на службе здравого смысла",
    action: {
      label: "Подробнее о модели",
      href: "#model-quality",
    },
  },
  {
    variant: "responsibility" as const,
    icon: ShieldCheck,
    title: "Ответственное использование",
    description:
      "Сервис создан для повышения информационной грамотности. Не используйте его для травли или необоснованных обвинений.",
    annotation: "Больше осознанности в цифровом пространстве",
  },
];

export function InfoCards() {
  return (
    <section id="principles" aria-labelledby="info-cards-heading" className="tool-gutter pb-6 pt-[22px]">
      <h2 id="info-cards-heading" className="sr-only">
        Возможности и принципы RuFact
      </h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1.04fr_1fr_1.04fr]">
        {cards.map((card) => (
          <InfoCard
            key={card.variant}
            variant={card.variant}
            icon={card.icon}
            title={card.title}
            description={card.description}
            annotation={card.annotation}
            action={card.action}
            className={card.variant === "responsibility" ? "md:col-span-2 lg:col-span-1" : ""}
          />
        ))}
      </div>
    </section>
  );
}
