import type { Metadata, Viewport } from "next";
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
  applicationName: "RuFact",
  title: "RuFact — проверка русскоязычных текстов",
  description:
    "Образовательный сервис для вероятностной оценки признаков недостоверной информации в русскоязычных текстах.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RuFact",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#0b2b4b",
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
