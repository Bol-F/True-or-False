"use client";

import { ArrowUp, ExternalLink, Globe2, LoaderCircle, MessageCircle, ShieldCheck, Square, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLanguage } from "./LanguageProvider";
import { chatCopy } from "@/lib/chat-copy";
import { CHAT_MESSAGE_LIMIT, recentChatMessages, safeChatSources, type ChatMessage, type ChatReply } from "@/lib/chat";
import type { AppLocale } from "@/lib/i18n";

type Turn = { question: string; reply?: Extract<ChatReply, { status: "complete" }> };

export function AiChat() {
  const { locale } = useLanguage();
  return <ChatWorkspace key={locale} locale={locale} />;
}

function ChatWorkspace({ locale }: { locale: AppLocale }) {
  const copy = chatCopy[locale];
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const thread = useRef<HTMLDivElement>(null);
  const latestReply = useRef<HTMLElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    const container = thread.current;
    if (!turns.length || !container) return;
    const reply = latestReply.current;
    const top = turns.at(-1)?.reply && reply
      ? reply.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 16
      : container.scrollHeight;
    container.scrollTo({ top, behavior: "smooth" });
  }, [turns, busy]);

  async function ask(question: string, retry = false) {
    if (controller.current || !question.trim() || question.trim().length > CHAT_MESSAGE_LIMIT) return;
    const completed = retry ? turns.slice(0, -1) : turns;
    const history: ChatMessage[] = completed.flatMap(turn => turn.reply ? [{ role: "user", content: turn.question }, { role: "assistant", content: turn.reply.text }] : []);
    const messages = recentChatMessages([...history, { role: "user", content: question.trim() }]);
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true); setError(""); setDraft("");
    setTurns([...completed, { question: question.trim() }].slice(-10));
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages, locale }), signal: AbortSignal.any([abort.signal, AbortSignal.timeout(35_000)]) });
      const reply = await response.json() as ChatReply;
      if (controller.current !== abort) return;
      if (!response.ok || reply.status !== "complete") {
        setError(reply.status === "unavailable" && reply.reason === "limited" ? copy.limited : reply.status === "unavailable" && reply.reason === "not-configured" ? copy.notConfigured : copy.unavailable);
      } else if (typeof reply.text === "string" && Array.isArray(reply.sources)) {
        setTurns(current => current.map((turn, index) => index === current.length - 1 ? { ...turn, reply: { ...reply, sources: safeChatSources(reply.sources) } } : turn));
      } else setError(copy.unavailable);
    } catch {
      if (controller.current !== abort) return;
      if (!abort.signal.aborted) setError(copy.unavailable);
      else { setDraft(question); setTurns(current => current.slice(0, -1)); }
    }
    finally { if (controller.current === abort) { controller.current = null; setBusy(false); } }
  }

  function submit(event: FormEvent) { event.preventDefault(); void ask(draft); }
  function cancel() {
    const active = controller.current;
    if (!active) return;
    controller.current = null;
    active.abort();
    setBusy(false); setError(""); setDraft(turns.at(-1)?.question ?? "");
    setTurns(current => current.slice(0, -1));
  }
  const retryQuestion = turns.at(-1)?.reply ? null : turns.at(-1)?.question;

  return (
    <section className="content-gutter pb-10 pt-6 sm:pb-14 sm:pt-9">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-accent">{copy.eyebrow}</p><h1 className="font-serif text-[2rem] leading-tight sm:text-[2.65rem]">{copy.title}</h1></div>
          <Link href="/#analyzer" className="focus-ring rounded-xl border border-[#d8ddd9] bg-white/60 px-4 py-3 text-sm font-semibold">{copy.check} ↗</Link>
        </div>
        <p className="mb-6 max-w-2xl text-base leading-relaxed text-muted">{copy.description}</p>
        <div className="overflow-hidden rounded-[22px] border border-[#d5ddd9] bg-[#fffdf9] shadow-[0_12px_45px_rgba(16,47,80,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7e2] bg-[#edf3f3] px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white"><Sparkles size={21} /></div><div><h2 className="text-base font-bold">{copy.assistant}</h2><p className="mt-0.5 text-xs text-muted">{copy.badge} · {copy.retention}</p></div></div>
            <button type="button" disabled={busy || !turns.length} onClick={() => { setTurns([]); setError(""); setDraft(""); input.current?.focus(); }} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#d5deda] bg-white px-3 text-sm font-semibold disabled:opacity-40"><RotateCcw size={15} />{copy.clear}</button>
          </div>
          <div ref={thread} role="log" aria-label={copy.assistant} aria-live="polite" className="max-h-[55dvh] min-h-[300px] overflow-y-auto overscroll-contain px-4 py-6 sm:max-h-[65dvh] sm:min-h-[360px] sm:px-6">
{!turns.length ? <div className="mx-auto max-w-xl py-4 text-center sm:py-8"><MessageCircle className="mx-auto mb-4 text-[#729398]" size={32} /><h3 className="text-lg font-bold">{copy.emptyTitle}</h3><p className="mx-auto mb-6 mt-2 max-w-md text-sm leading-relaxed text-muted">{copy.emptyText}</p><div className="grid gap-2">{copy.prompts.map(prompt => <button key={prompt} type="button" onClick={() => { setDraft(prompt); input.current?.focus(); }} className="focus-ring rounded-xl border border-[#e0e5df] bg-[#f7f8f3] px-4 py-3 text-left text-sm transition-colors hover:bg-[#edf2ed]">{prompt} <span aria-hidden="true" className="float-right">↗</span></button>)}</div></div> : <div className="space-y-6">{turns.map((turn, index) => <div key={index} className="space-y-4"><div className="ml-auto max-w-[90%] rounded-[18px] rounded-br-md bg-ink px-4 py-3 text-white sm:max-w-[80%]"><p className="mb-1 text-xs font-bold text-white/65">{copy.you}</p><p className="whitespace-pre-wrap break-words text-base leading-relaxed">{turn.question}</p></div>{turn.reply ? <article ref={index === turns.length - 1 ? latestReply : undefined} className="max-w-[95%] rounded-[18px] rounded-tl-md border border-[#e5e6dd] bg-[#f7f8f3] p-4 sm:max-w-[90%] sm:p-5"><p className="mb-3 flex items-center gap-2 text-xs font-bold text-[#46716a]"><Sparkles size={14} />RuFact</p><p className="whitespace-pre-wrap break-words text-base leading-relaxed">{turn.reply.text}</p><div className="mt-4 border-t border-[#dfe4d9] pt-3"><h3 className="mb-2 flex items-center gap-2 text-xs font-bold text-muted"><Globe2 size={13} />{copy.sources}</h3><div className="grid gap-2 sm:grid-cols-2">{turn.reply.sources.map((source, number) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="focus-ring flex min-w-0 items-center gap-2 rounded-xl border border-[#dce2d6] bg-white px-3 py-2.5 text-xs"><span className="font-bold text-accent">[{number + 1}]</span><span className="min-w-0 flex-1 truncate">{source.title}</span><ExternalLink size={13} className="shrink-0" /></a>)}</div></div></article> : null}</div>)}</div>}
            {busy ? <p role="status" className="mt-5 flex items-center gap-2 text-sm text-muted"><LoaderCircle className="animate-spin shrink-0" size={17} />{copy.thinking}</p> : null}
            {error ? <div role="alert" className="mt-5 rounded-xl border border-[#edd6c8] bg-[#fff1e7] p-4 text-sm leading-relaxed"><p>{error}</p>{retryQuestion ? <button type="button" onClick={() => void ask(retryQuestion, true)} className="focus-ring mt-2 min-h-11 rounded-lg px-3 font-bold underline">{copy.retry}</button> : null}</div> : null}
          </div>
          <form onSubmit={submit} className="border-t border-[#e2e6df] bg-[#fffdf9] p-4 sm:p-6">
<div className="flex items-end gap-2 rounded-2xl border border-[#cbd8d0] bg-white p-2 shadow-sm focus-within:ring-2 focus-within:ring-[#6d9186]/30"><textarea ref={input} aria-label={copy.input} placeholder={copy.placeholder} value={draft} maxLength={CHAT_MESSAGE_LIMIT} rows={2} disabled={busy} onChange={event => setDraft(event.target.value)} className="min-h-[68px] min-w-0 flex-1 resize-y rounded-xl px-2 py-2 text-base leading-relaxed outline-none disabled:opacity-60" />{busy ? <button key="stop" type="button" aria-label={copy.stop} onClick={cancel} className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-white"><Square size={17} /></button> : <button key="send" type="submit" aria-label={copy.send} disabled={!draft.trim()} className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-white disabled:opacity-40"><ArrowUp size={21} /></button>}</div>
            <p className="mt-2 text-right text-xs text-muted">{draft.length} / {CHAT_MESSAGE_LIMIT} {copy.remaining}</p>
          </form>
        </div>
        <div className="mt-4 grid gap-3 text-xs leading-relaxed text-muted sm:grid-cols-2"><p className="flex gap-2"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#46716a]" />{copy.privacy}</p><p>{copy.caution} {copy.resetLanguage}</p></div>
        <a href="https://t.me/RuFact_bot" target="_blank" rel="noopener noreferrer" className="focus-ring mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-semibold"><MessageCircle size={16} />{copy.telegram}<ExternalLink size={14} /></a>
      </div>
    </section>
  );
}
