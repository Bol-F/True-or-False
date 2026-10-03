import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "RuFact — проверка русскоязычных текстов",
    short_name: "RuFact",
    description:
      "Вероятностный анализ признаков недостоверной информации в русскоязычных текстах.",
    lang: "ru",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f0e9",
    theme_color: "#0b2b4b",
    categories: ["education", "utilities"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/pwa-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Проверить текст",
        short_name: "Проверка",
        description: "Открыть форму анализа текста",
        url: "/#analyzer",
        icons: [
          {
            src: "/pwa-icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "О модели",
        short_name: "Модель",
        description: "Посмотреть качество и ограничения ML-модели",
        url: "/model",
        icons: [
          {
            src: "/pwa-icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
  };
}
