import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ModelPageContent } from "@/components/ModelPageContent";

export const metadata: Metadata = {
  title: "RuFact tekshiruv tizimi haqida",
  description: "RuFact ML modeli, Tavily qidiruvi va Gemini tahlilini qanday birlashtirishi haqida.",
};

export default function ModelPage() {
  return (
    <div className="paper-shell">
      <Header />
      <main>
        <ModelPageContent />
      </main>
      <Footer />
    </div>
  );
}
