import { AnalyzerWorkspace } from "@/components/AnalyzerWorkspace";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { isGeminiReviewConfigured } from "@/lib/server/gemini-review";

export default function Home() {
  return (
    <div className="paper-shell">
      <Header />
      <main>
        <Hero />
        <AnalyzerWorkspace
          geminiConfigured={isGeminiReviewConfigured()}
        />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
