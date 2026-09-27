import { AnalyzerWorkspace } from "@/components/AnalyzerWorkspace";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { InfoCards } from "@/components/InfoCards";

export default function Home() {
  return (
    <div className="paper-shell">
      <Header />
      <main>
        <Hero />
        <AnalyzerWorkspace />
        <InfoCards />
      </main>
    </div>
  );
}
