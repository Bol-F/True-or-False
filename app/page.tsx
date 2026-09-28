import { AnalyzerWorkspace } from "@/components/AnalyzerWorkspace";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { InfoCards } from "@/components/InfoCards";
import { ModelTransparency } from "@/components/ModelTransparency";

export default function Home() {
  return (
    <div className="paper-shell">
      <Header />
      <main>
        <Hero />
        <AnalyzerWorkspace />
        <InfoCards />
        <ModelTransparency />
      </main>
    </div>
  );
}
