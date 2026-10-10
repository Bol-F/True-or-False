import "server-only";
import { generateText } from "ai";
import { createGoogle } from "@ai-sdk/google";
import type { AppLocale } from "../i18n";
import type { ChatMessage, ChatReply } from "../chat";
import { requestAiChat } from "./ai-chat-core";
import { requestTavilyEvidence } from "./tavily-search";
import { configuredModel, isGeminiReviewConfigured } from "./gemini-review";
import { createAbortScope } from "./abort-scope";

export async function getAiChatReply(messages: ChatMessage[], locale: AppLocale, signal?: AbortSignal): Promise<ChatReply> {
  if (!isGeminiReviewConfigured()) return { status: "unavailable", reason: "not-configured" };
  const scope = createAbortScope(signal, 25_000);
  try {
    const google = createGoogle({ apiKey: process.env.GEMINI_API_KEY!.trim() });
    return await requestAiChat(messages, locale, {
      search: (text, language) => requestTavilyEvidence({ text, locale: language, apiKey: process.env.TAVILY_API_KEY!.trim(), signal: scope.signal }),
      generate: async (instructions, history) => {
        const result = await generateText({ model: google(configuredModel()), instructions, messages: history, maxOutputTokens: 1500, maxRetries: 0, abortSignal: scope.signal });
        return result.text;
      },
    });
  } finally { scope.cleanup(); }
}
