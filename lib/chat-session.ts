import { CHAT_MESSAGE_LIMIT, safeChatSources, type ChatReply } from "./chat.ts";

export type ChatTurn = { question: string; reply?: Extract<ChatReply, { status: "complete" }> };
export const CHAT_SESSION_KEY = "rufact.chat.v2";
export const VISIBLE_TURN_LIMIT = 30;

// Browser-only, per-tab persistence; never store provider credentials or raw payloads.
export function parseChatSession(raw: string | null): ChatTurn[] {
  if (!raw || raw.length > 200_000) return [];
  try {
    const value = JSON.parse(raw);
    if (value.version !== 2 || !Array.isArray(value.turns) || value.turns.length > VISIBLE_TURN_LIMIT) return [];
    return value.turns.flatMap((turn: ChatTurn) => {
      if (!turn || typeof turn.question !== "string" || !turn.question.trim() || turn.question.length > CHAT_MESSAGE_LIMIT || turn.reply?.status !== "complete" || typeof turn.reply.text !== "string" || turn.reply.text.length > CHAT_MESSAGE_LIMIT || !turn.reply.text.trim() || !Array.isArray(turn.reply.sources)) return [];
      const sources = turn.reply.sources.filter(source => source && typeof source.id === "string" && typeof source.title === "string" && typeof source.url === "string");
      return [{ question: turn.question, reply: { status: "complete" as const, text: turn.reply.text, sources: safeChatSources(sources) } }];
    });
  } catch { return []; }
}

export function serializeChatSession(turns: ChatTurn[]) {
  return JSON.stringify({ version: 2, turns: turns.filter(turn => turn.reply).slice(-VISIBLE_TURN_LIMIT) });
}
