import type { Metadata, Viewport } from "next";
import { Header } from "@/components/Header";
import { AiChat } from "@/components/AiChat";

export const metadata: Metadata = { title: "RuFact · AI chat", description: "Ask questions about news, claims and sources in Uzbek, Russian or English." };
// Supporting Android browsers resize the layout when the software keyboard opens.
export const viewport: Viewport = { interactiveWidget: "resizes-content" };
export default function ChatPage() {
  return <div className="paper-shell chat-shell"><Header /><main className="flex min-h-0 flex-1 flex-col"><AiChat /></main></div>;
}
