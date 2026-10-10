import type { GeminiSource } from "./gemini-review";

export interface ChatMessage { role: "user" | "assistant"; content: string }
export type ChatReply = { status: "complete"; text: string; sources: GeminiSource[] } | { status: "unavailable"; reason: "not-configured" | "limited" | "search-unavailable" | "provider-unavailable" };
export const CHAT_MESSAGE_LIMIT = 2000;
export const CHAT_HISTORY_LIMIT = 7;

// Clients never control system instructions, tool calls or provider settings.
export function parseChatMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value) || !value.length || value.length > CHAT_HISTORY_LIMIT || value.length % 2 === 0) return null;
  const messages: ChatMessage[] = [];
  let length = 0;
  for (const [index, item] of value.entries()) {
    if (!item || typeof item !== "object" || item.role !== (index % 2 ? "assistant" : "user") || typeof item.content !== "string") return null;
    const content = item.content.trim();
    if (!content || content.length > CHAT_MESSAGE_LIMIT) return null;
    length += content.length;
    messages.push({ role: item.role, content });
  }
  return length <= 10_000 ? messages : null;
}

export function safeChatSources(sources: GeminiSource[]) {
  return sources.filter(source => {
    try { const url = new URL(source.url); return url.protocol === "https:" && !url.username && !url.password && url.href.length <= 450; } catch { return false; }
  }).slice(0, 4).map(({ id, title, url }) => ({ id, title: title.slice(0, 100), url }));
}

export function recentChatMessages(messages: ChatMessage[]) {
  // Keep complete user/assistant pairs plus the current question, under the total cap.
  let recent = messages.slice(-CHAT_HISTORY_LIMIT);
  while (recent.length > 1 && recent.reduce((sum, message) => sum + message.content.length, 0) > 10_000) recent = recent.slice(2);
  return recent;
}
