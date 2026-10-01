import { AnalyzerWorkspace } from "@/components/AnalyzerWorkspace";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { InfoCards } from "@/components/InfoCards";
import { ModelTransparency } from "@/components/ModelTransparency";
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
        <InfoCards />
        <ModelTransparency />
      </main>
    </div>
  );
}
