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
import { useLanguage } from "./LanguageProvider";

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

function buildIssueUrl(category: string, message: string, summary: string, labels: { issue: string; message: string; context: string; privacy: string }) {
  const title = `[${labels.issue}] ${category}`;
  const body = [
    `## ${labels.message}`,
    message.trim(),
    summary ? `\n## ${labels.context}\n${summary}` : "",
    `\n---\n${labels.privacy}`,
  ]
    .filter(Boolean)
    .join("\n");
  const params = new URLSearchParams({ title, body });
  return `${GITHUB_ISSUE_URL}?${params.toString()}`;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { locale } = useLanguage();
  const labels = useMemo(() => locale === "uz"
    ? { issue: "Fikr-mulohaza", messageHeading: "Fikr bildirish", description: "Muammo yoki taklifni yozing. Tekshirilgan asl matn avtomatik qo‘shilmaydi.", close: "Fikr bildirish oynasini yopish", topic: "Mavzu", message: "Xabar", placeholder: "Masalan: tugma ishlamadi yoki izoh tushunarsiz bo‘ldi…", github: "GitHub formasini ochish", copied: "Nusxalandi", copy: "Nusxalash", copiedStatus: "Xabar buferga nusxalandi.", publicStatus: "GitHub ommaviy formani ochadi. Yuborishdan oldin mazmunini tekshiring.", context: "Natija konteksti", privacy: "Tahlil qilinayotgan asl matn avtomatik qo‘shilmadi.", categories: { suggestion: "Taklif", interface: "Interfeys xatosi", result: "Natija xatosi", model: "Model haqida savol" } }
    : locale === "en"
      ? { issue: "Feedback", messageHeading: "Feedback", description: "Describe a problem or idea. The original checked text is not added automatically.", close: "Close feedback", topic: "Topic", message: "Message", placeholder: "For example: a button did not work or an explanation was unclear…", github: "Open GitHub form", copied: "Copied", copy: "Copy", copiedStatus: "The message was copied to the clipboard.", publicStatus: "GitHub will open a public form. Review the content before submitting.", context: "Result context", privacy: "The original analyzed text was not added automatically.", categories: { suggestion: "Suggestion", interface: "Interface issue", result: "Result issue", model: "Question about the model" } }
      : { issue: "Обратная связь", messageHeading: "Обратная связь", description: "Опишите проблему или идею. Исходный текст проверки не добавляется.", close: "Закрыть обратную связь", topic: "Тема", message: "Сообщение", placeholder: "Например: кнопка не сработала или объяснение было непонятным…", github: "Открыть форму на GitHub", copied: "Скопировано", copy: "Скопировать", copiedStatus: "Сообщение скопировано в буфер обмена.", publicStatus: "GitHub откроет публичную форму. Проверьте содержимое перед отправкой.", context: "Контекст результата", privacy: "Исходный анализируемый текст не добавлен автоматически.", categories: { suggestion: "Предложение", interface: "Ошибка интерфейса", result: "Ошибка результата", model: "Вопрос о модели" } }, [locale]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<keyof typeof labels.categories>("suggestion");
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
    () => buildIssueUrl(labels.categories[category], message, summary, {
      issue: labels.issue,
      message: labels.message,
      context: labels.context,
      privacy: labels.privacy,
    }),
    [category, labels, message, summary],
  );
  const contextValue = useMemo(() => ({ openFeedback }), [openFeedback]);
  const isReady = message.trim().length >= MIN_MESSAGE_LENGTH;

  async function handleCopy() {
    const copied = await copyText(
      `${labels.categories[category]}\n\n${message.trim()}${summary ? `\n\n${summary}` : ""}`,
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
                <h2 id="feedback-title" className="font-serif text-[1.5625rem] font-semibold tracking-[-0.03em] text-ink">
                  {labels.messageHeading}
                </h2>
                <p id="feedback-description" className="mt-1 text-[0.6875rem] leading-[1.5] text-[#6d7b88]">
                  {labels.description}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeFeedback}
              className="focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-[#d9d9d3] bg-white/70 text-[#52677a] hover:bg-white"
              aria-label={labels.close}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <div className="mt-5 grid gap-4">
            <label className="grid gap-1.5 text-[0.6875rem] font-extrabold text-[#365269]">
              {labels.topic}
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as keyof typeof labels.categories)}
                className="focus-ring min-h-11 rounded-xl border border-[#d5d9da] bg-white px-3 text-[0.8125rem] font-medium text-[#334b5f]"
              >
                {Object.entries(labels.categories).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-[0.6875rem] font-extrabold text-[#365269]">
              {labels.message}
              <textarea
                ref={messageRef}
                value={message}
                maxLength={MAX_MESSAGE_LENGTH}
                rows={6}
                onChange={(event) => {
                  setMessage(event.target.value);
                  setCopySucceeded(false);
                }}
                placeholder={labels.placeholder}
                className="focus-ring resize-none rounded-xl border border-[#d5d9da] bg-white px-3 py-3 text-[0.8125rem] leading-[1.55] text-[#334b5f]"
              />
              <span className="text-right text-[0.59375rem] font-medium tabular-nums text-[#83909a]">
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
              className={`focus-ring inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-[0.75rem] font-extrabold ${
                isReady
                  ? "bg-ink-deep text-white shadow-[0_8px_20px_rgba(10,41,73,0.16)]"
                  : "cursor-not-allowed bg-[#e4e5e2] text-[#8b9398]"
              }`}
            >
              {labels.github}
              <ExternalLink size={15} aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!isReady}
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d4d9dc] bg-white px-4 text-[0.6875rem] font-extrabold text-[#3c5870] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {copySucceeded ? <Check size={15} aria-hidden="true" /> : <ClipboardCopy size={15} aria-hidden="true" />}
              {copySucceeded ? labels.copied : labels.copy}
            </button>
          </div>

          <p className="mt-3 text-[0.59375rem] leading-[1.5] text-[#7c8994]" role="status">
            {copySucceeded
              ? labels.copiedStatus
              : labels.publicStatus}
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
