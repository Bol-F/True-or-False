"use client";

import { Check, ClipboardCopy, ExternalLink, MessageSquareText, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { copyText } from "@/lib/copy-text";

const GITHUB_ISSUE_URL = "https://github.com/Bol-F/True-or-False/issues/new";
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 600;

interface FeedbackContextInfo {
  source?: "header" | "footer" | "result";
  summary?: string;
}

interface FeedbackContextValue {
  openFeedback: (info?: FeedbackContextInfo) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

function buildIssueUrl(category: string, message: string, summary: string) {
  const title = `[Обратная связь] ${category}`;
  const body = [
    "## Сообщение",
    message.trim(),
    summary ? `\n## Контекст результата\n${summary}` : "",
    "\n---\nИсходный анализируемый текст не добавлен автоматически.",
  ]
    .filter(Boolean)
    .join("\n");
  const params = new URLSearchParams({ title, body });
  return `${GITHUB_ISSUE_URL}?${params.toString()}`;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState("Предложение");
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState("");
  const [copySucceeded, setCopySucceeded] = useState(false);

  const closeFeedback = useCallback(() => setIsOpen(false), []);
  const openFeedback = useCallback((info: FeedbackContextInfo = {}) => {
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSummary(info.summary ?? "");
    setMessage("");
    setCopySucceeded(false);
    setIsOpen(true);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
      window.requestAnimationFrame(() => messageRef.current?.focus());
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const issueUrl = useMemo(
    () => buildIssueUrl(category, message, summary),
    [category, message, summary],
  );
  const contextValue = useMemo(() => ({ openFeedback }), [openFeedback]);
  const isReady = message.trim().length >= MIN_MESSAGE_LENGTH;

  async function handleCopy() {
    const copied = await copyText(
      `${category}\n\n${message.trim()}${summary ? `\n\n${summary}` : ""}`,
    );
    setCopySucceeded(copied);
  }

  function handleNativeClose() {
    setIsOpen(false);
    window.requestAnimationFrame(() => returnFocusRef.current?.focus());
  }

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
      <dialog
        ref={dialogRef}
        aria-labelledby="feedback-title"
        aria-describedby="feedback-description"
        onCancel={(event) => {
          event.preventDefault();
          closeFeedback();
        }}
        onClose={handleNativeClose}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) closeFeedback();
        }}
        className="fixed inset-0 m-0 hidden h-[100dvh] max-h-none w-screen max-w-none items-center justify-center bg-transparent p-4 text-ink open:flex backdrop:bg-[#10283d]/45 backdrop:backdrop-blur-[2px]"
      >
        <section className="w-full max-w-[560px] rounded-[22px] border border-[#dedbd4] bg-[#fbfaf6] p-5 shadow-[0_24px_70px_rgba(16,35,52,0.22)] sm:p-7">
          <header className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#e3edf2] text-[#315e7b]">
                <MessageSquareText size={20} strokeWidth={1.9} aria-hidden="true" />
              </span>
              <div>
                <h2 id="feedback-title" className="font-serif text-[25px] font-semibold tracking-[-0.03em] text-ink">
                  Обратная связь
                </h2>
                <p id="feedback-description" className="mt-1 text-[11px] leading-[1.5] text-[#6d7b88]">
                  Опишите проблему или идею. Исходный текст проверки не добавляется.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeFeedback}
              className="focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-[#d9d9d3] bg-white/70 text-[#52677a] hover:bg-white"
              aria-label="Закрыть обратную связь"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <div className="mt-5 grid gap-4">
            <label className="grid gap-1.5 text-[11px] font-extrabold text-[#365269]">
              Тема
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="focus-ring min-h-11 rounded-xl border border-[#d5d9da] bg-white px-3 text-[13px] font-medium text-[#334b5f]"
              >
                <option>Предложение</option>
                <option>Ошибка интерфейса</option>
                <option>Ошибка результата</option>
                <option>Вопрос о модели</option>
              </select>
            </label>

            <label className="grid gap-1.5 text-[11px] font-extrabold text-[#365269]">
              Сообщение
              <textarea
                ref={messageRef}
                value={message}
                maxLength={MAX_MESSAGE_LENGTH}
                rows={6}
                onChange={(event) => {
                  setMessage(event.target.value);
                  setCopySucceeded(false);
                }}
                placeholder="Например: кнопка не сработала или объяснение было непонятным…"
                className="focus-ring resize-none rounded-xl border border-[#d5d9da] bg-white px-3 py-3 text-[13px] leading-[1.55] text-[#334b5f]"
              />
              <span className="text-right text-[9.5px] font-medium tabular-nums text-[#83909a]">
                {message.length} / {MAX_MESSAGE_LENGTH}
              </span>
            </label>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <a
              href={issueUrl}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!isReady}
              onClick={(event) => {
                if (!isReady) event.preventDefault();
              }}
              className={`focus-ring inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-[12px] font-extrabold ${
                isReady
                  ? "bg-ink-deep text-white shadow-[0_8px_20px_rgba(10,41,73,0.16)]"
                  : "cursor-not-allowed bg-[#e4e5e2] text-[#8b9398]"
              }`}
            >
              Открыть форму на GitHub
              <ExternalLink size={15} aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!isReady}
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d4d9dc] bg-white px-4 text-[11px] font-extrabold text-[#3c5870] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {copySucceeded ? <Check size={15} aria-hidden="true" /> : <ClipboardCopy size={15} aria-hidden="true" />}
              {copySucceeded ? "Скопировано" : "Скопировать"}
            </button>
          </div>

          <p className="mt-3 text-[9.5px] leading-[1.5] text-[#7c8994]" role="status">
            {copySucceeded
              ? "Сообщение скопировано в буфер обмена."
              : "GitHub откроет публичную форму. Проверьте содержимое перед отправкой."}
          </p>
        </section>
      </dialog>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("useFeedback must be used inside FeedbackProvider");
  return context;
}
