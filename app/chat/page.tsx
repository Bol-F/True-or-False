import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AiChat } from "@/components/AiChat";

export const metadata: Metadata = { title: "RuFact · AI chat", description: "Ask questions about news, claims and sources in Uzbek, Russian or English." };
export default function ChatPage() {
  return <div className="paper-shell"><Header /><main><AiChat /></main><Footer /></div>;
}
