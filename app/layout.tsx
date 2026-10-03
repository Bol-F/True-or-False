import type { Metadata } from "next";
import { Caveat, Lora, Manrope } from "next/font/google";
import { FeedbackProvider } from "@/components/FeedbackProvider";
import "./globals.css";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["cyrillic", "latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["cyrillic", "latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["cyrillic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rufact.vercel.app"),
  title: "RuFact — проверка русскоязычных текстов",
  description:
    "Образовательный сервис для вероятностной оценки признаков недостоверной информации в русскоязычных текстах.",
  applicationName: "RuFact",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "проверка фактов",
    "анализ текста",
    "недостоверная информация",
    "русский язык",
    "машинное обучение",
  ],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "/",
    siteName: "RuFact",
    title: "RuFact — проверяйте факты осознанно",
    description:
      "ML-анализ русскоязычных текстов: вероятность недостоверности, ключевые признаки и второе мнение Gemini.",
  },
  twitter: {
    card: "summary_large_image",
    title: "RuFact — проверяйте факты осознанно",
    description:
      "Вероятностная оценка русскоязычных текстов с понятным объяснением результата.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body
        className={`${lora.variable} ${manrope.variable} ${caveat.variable}`}
      >
        <FeedbackProvider>{children}</FeedbackProvider>
      </body>
    </html>
  );
}
