import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "RuFact — matn va manbalarni tekshirish",
    short_name: "RuFact",
    description:
      "O‘zbek, rus va ingliz tilidagi matnlarni internet manbalari bilan tekshirish.",
    lang: "uz-Latn-UZ",
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
        name: "Matnni tekshirish",
        short_name: "Tekshirish",
        description: "Matn tahlili formasini ochish",
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
        name: "Model haqida",
        short_name: "Model",
        description: "Tizim sifati va cheklovlarini ko‘rish",
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
