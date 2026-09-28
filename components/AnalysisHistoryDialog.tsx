"use client";

import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  History,
  LockKeyhole,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { HistoryItem } from "@/lib/analysis-history";
import { HISTORY_DIALOG_ID, HISTORY_TRIGGER_ID } from "./HistoryTrigger";

const HISTORY_LIMIT = 20;
const HISTORY_RETENTION_DAYS = 30;
const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type ConfirmationKind = "clear" | "disable";

export interface AnalysisHistoryDialogProps {
  isOpen: boolean;
  enabled: boolean;
  items: HistoryItem[];
  errorMessage: string | null;
  onClose: () => void;
  onEnable: () => void;
  onDisable: () => void;
  onClear: () => void;
  onDelete: (id: HistoryItem["id"]) => void;
  onRestore: (item: HistoryItem) => void;
  dialogId?: string;
  triggerId?: string;
}

function formatAnalyzedAt(value: HistoryItem["analyzedAt"]) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "Дата не указана" : dateFormatter.format(date);
}

function formatConfidence(value: number) {
  const normalized = value <= 1 ? value * 100 : value;
  return `${Math.round(Math.min(100, Math.max(0, normalized)))}%`;
}

function makeExcerpt(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

interface ConfirmationPanelProps {
  kind: ConfirmationKind;
  cancelButtonRef: React.RefObject<HTMLButtonElement | null>;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmationPanel({
  kind,
  cancelButtonRef,
  onCancel,
  onConfirm,
}: ConfirmationPanelProps) {
  const isDisable = kind === "disable";
  const title = isDisable ? "Отключить историю?" : "Очистить всю историю?";
  const description = isDisable
    ? "Сохранённые проверки будут удалены с этого устройства. Это действие нельзя отменить."
    : "Все сохранённые проверки будут удалены с этого устройства. Это действие нельзя отменить.";
  const titleId = `history-${kind}-confirmation-title`;
  const descriptionId = `history-${kind}-confirmation-description`;

  return (
    <section
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="rounded-[15px] border border-[#e5bdb2] bg-[#fff2ee] p-4"
    >
      <p
        id={titleId}
        className="text-[13px] font-extrabold text-[#963b2f]"
      >
        {title}
      </p>
      <p id={descriptionId} className="mt-1 text-[11.5px] leading-[1.5] text-[#765e5b]">
        {description}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          ref={cancelButtonRef}
          type="button"
          onClick={onCancel}
          className="focus-ring min-h-9 rounded-lg border border-[#d8c8c3] bg-white px-3 text-[11px] font-bold text-[#40556a]"
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="focus-ring min-h-9 rounded-lg bg-[#a63e35] px-3 text-[11px] font-bold text-white shadow-[0_5px_12px_rgba(166,62,53,0.18)]"
        >
          {isDisable ? "Отключить и удалить" : "Удалить всё"}
        </button>
      </div>
    </section>
  );
}

export function AnalysisHistoryDialog({
  isOpen,
  enabled,
  items,
  errorMessage,
  onClose,
  onEnable,
  onDisable,
  onClear,
  onDelete,
  onRestore,
  dialogId = HISTORY_DIALOG_ID,
  triggerId = HISTORY_TRIGGER_ID,
}: AnalysisHistoryDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const confirmationCancelRef = useRef<HTMLButtonElement>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationKind | null>(null);
  const [announcement, setAnnouncement] = useState<{ id: number; message: string } | null>(
    null,
  );

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (isOpen && !dialog.open) {
      const trigger = document.getElementById(triggerId);
      returnFocusRef.current =
        trigger instanceof HTMLElement
          ? trigger
          : document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen, triggerId]);

  useEffect(() => {
    if (confirmation) confirmationCancelRef.current?.focus();
  }, [confirmation]);

  function announce(message: string) {
    setAnnouncement((current) => ({ id: (current?.id ?? 0) + 1, message }));
  }

  function requestClose() {
    setConfirmation(null);
    onClose();
  }

  function handleNativeClose() {
    setConfirmation(null);
    if (isOpen) onClose();

    window.requestAnimationFrame(() => {
      returnFocusRef.current?.focus();
      returnFocusRef.current = null;
    });
  }

  function handleEnable() {
    onEnable();
  }

  function handleDelete(item: HistoryItem) {
    onDelete(item.id);
    announce("Запись удалена из истории.");
  }

  function handleRestore(item: HistoryItem) {
    onRestore(item);
    announce("Текст восстановлен для повторной проверки.");
  }

  function handleConfirm() {
    if (confirmation === "disable") {
      onDisable();
      announce("История отключена, сохранённые записи удалены.");
    } else if (confirmation === "clear") {
      onClear();
      announce("История проверок очищена.");
    }

    setConfirmation(null);
  }

  const headingId = `${dialogId}-heading`;
  const descriptionId = `${dialogId}-description`;

  return (
    <dialog
      ref={dialogRef}
      id={dialogId}
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClose={handleNativeClose}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
      className="fixed inset-0 m-0 hidden h-[100dvh] max-h-none w-screen max-w-none items-end justify-end overflow-hidden bg-transparent p-0 text-ink open:flex backdrop:bg-[#10283d]/45 backdrop:backdrop-blur-[2px] sm:items-stretch"
    >
      <section className="mt-auto flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-[26px] border border-[#e1ded7] bg-[#fbfaf6] shadow-[0_-18px_50px_rgba(16,35,52,0.16)] sm:mt-0 sm:h-full sm:max-h-none sm:w-[min(32rem,calc(100vw-2rem))] sm:rounded-l-[26px] sm:rounded-r-none sm:border-y-0 sm:border-r-0 sm:shadow-[-20px_0_55px_rgba(16,35,52,0.18)]">
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[#c9c8c2] sm:hidden" aria-hidden="true" />

        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#e1ded7] px-5 pb-5 pt-4 sm:px-7 sm:pb-6 sm:pt-7">
          <div className="flex min-w-0 gap-3.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#e4edf2] text-[#2c5c7d]">
              <History size={21} strokeWidth={2} aria-hidden="true" />
            </span>
            <div>
              <h2
                id={headingId}
                className="font-serif text-[24px] leading-tight font-semibold tracking-[-0.03em] text-ink sm:text-[27px]"
              >
                История проверок
              </h2>
              <p id={descriptionId} className="mt-1 text-[11.5px] leading-[1.45] text-[#718092]">
                Управляйте сохранёнными результатами на этом устройстве.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#d9d9d3] bg-white/70 text-[#52677a] transition-colors hover:bg-white hover:text-ink"
            aria-label="Закрыть историю"
          >
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6">
          {errorMessage ? (
            <div
              role="alert"
              className="mb-4 rounded-[13px] border border-[#e7bdb6] bg-[#fff0ed] px-4 py-3 text-[11.5px] leading-[1.5] text-[#8a4038]"
            >
              {errorMessage}
            </div>
          ) : null}

          {!enabled ? (
            <div className="flex min-h-[390px] flex-col items-center justify-center py-8 text-center">
              <span className="relative grid h-20 w-20 place-items-center rounded-[24px] bg-[#e8eef0] text-[#315d70] shadow-[inset_0_0_0_1px_rgba(49,93,112,0.06)]">
                <LockKeyhole size={34} strokeWidth={1.65} aria-hidden="true" />
                <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-[10px] bg-[#dfeadf] text-[#35744b] ring-4 ring-[#fbfaf6]">
                  <ShieldCheck size={18} strokeWidth={2} aria-hidden="true" />
                </span>
              </span>
              <h3 className="mt-6 font-serif text-[23px] font-semibold tracking-[-0.025em] text-ink">
                История выключена
              </h3>
              <p className="mt-3 max-w-[350px] text-[12.5px] leading-[1.65] text-[#66778a]">
                RuFact сохранит до {HISTORY_LIMIT} последних проверок только в этом браузере.
                Записи автоматически удаляются через {HISTORY_RETENTION_DAYS} дней.
              </p>
              <button
                type="button"
                onClick={handleEnable}
                className="focus-ring mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink-deep px-5 text-[12.5px] font-bold text-white shadow-[0_9px_22px_rgba(10,41,73,0.18)] transition-transform hover:-translate-y-0.5"
              >
                <CheckCircle2 size={17} strokeWidth={2} aria-hidden="true" />
                Включить локальную историю
              </button>
              <p className="mt-4 max-w-[330px] text-[10.5px] leading-[1.5] text-[#89939e]">
                История не включается без вашего согласия. Её можно отключить и удалить в любой момент.
              </p>
              <p className="mt-2 max-w-[330px] text-[10.5px] leading-[1.5] font-semibold text-[#8b6659]">
                На общем устройстве лучше не включать сохранение текстов.
              </p>
            </div>
          ) : (
            <>
              <aside className="flex gap-3 rounded-[14px] border border-[#cfdee3] bg-[#eaf2f4] px-4 py-3.5 text-[#3f6376]">
                <ShieldCheck className="mt-0.5 shrink-0" size={19} strokeWidth={2} aria-hidden="true" />
                <p className="text-[11.5px] leading-[1.55]">
                  Хранится только в этом браузере: не более {HISTORY_LIMIT} проверок и не дольше{" "}
                  {HISTORY_RETENTION_DAYS} дней. Текст из истории не отправляется повторно.
                </p>
              </aside>

              <div className="my-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#7c8895]">
                  {items.length} из {HISTORY_LIMIT} записей
                </p>
                <div className="flex items-center gap-3">
                  {items.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setConfirmation("clear")}
                      className="focus-ring rounded-md text-[11px] font-bold text-[#9a4b3f] underline decoration-[#d4a99f] underline-offset-4 hover:text-[#7e312b]"
                    >
                      Очистить
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setConfirmation("disable")}
                    className="focus-ring rounded-md text-[11px] font-bold text-[#667686] underline decoration-[#bec4c8] underline-offset-4 hover:text-[#344b5f]"
                  >
                    Отключить
                  </button>
                </div>
              </div>

              {confirmation ? (
                <div className="mb-5">
                  <ConfirmationPanel
                    kind={confirmation}
                    cancelButtonRef={confirmationCancelRef}
                    onCancel={() => setConfirmation(null)}
                    onConfirm={handleConfirm}
                  />
                </div>
              ) : null}

              {items.length > 0 ? (
                <ol className="grid gap-3" aria-label="Сохранённые проверки">
                  {items.map((item) => {
                    const isFake = item.label === "FAKE";
                    const excerpt = makeExcerpt(item.text);

                    return (
                      <li key={item.id}>
                        <article className="rounded-[16px] border border-[#deded8] bg-white/70 p-4 shadow-[0_8px_22px_rgba(29,44,57,0.045)] transition-colors hover:border-[#c9d2d7] hover:bg-white">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <span
                                className={`rounded-lg px-2.5 py-1 text-[10px] font-extrabold tracking-[0.06em] ${
                                  isFake
                                    ? "bg-[#f8dddd] text-[#b5363c]"
                                    : "bg-[#dcecdf] text-[#357047]"
                                }`}
                              >
                                {item.label}
                              </span>
                              <span className="text-[12px] font-extrabold tabular-nums text-[#29465f]">
                                {formatConfidence(item.confidence)}
                              </span>
                            </div>
                            <time
                              dateTime={String(item.analyzedAt)}
                              className="inline-flex shrink-0 items-center gap-1.5 text-[9.5px] font-semibold text-[#89939d]"
                            >
                              <Clock3 size={12} strokeWidth={2} aria-hidden="true" />
                              {formatAnalyzedAt(item.analyzedAt)}
                            </time>
                          </div>

                          <p className="mt-3 line-clamp-2 text-[12px] leading-[1.55] text-[#53667a]">
                            {excerpt || "Текст отсутствует"}
                          </p>

                          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#ebe9e3] pt-3">
                            <button
                              type="button"
                              onClick={() => handleRestore(item)}
                              className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#e7eef4] px-3 text-[11px] font-extrabold text-[#315b7b] transition-colors hover:bg-[#dbe7ef]"
                            >
                              Открыть
                              <ExternalLink size={14} strokeWidth={2} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              className="focus-ring grid h-9 w-9 place-items-center rounded-lg text-[#9b6d65] transition-colors hover:bg-[#fae8e4] hover:text-[#a13f35]"
                              aria-label={`Удалить запись: ${excerpt.slice(0, 70) || "без текста"}`}
                            >
                              <Trash2 size={16} strokeWidth={1.9} aria-hidden="true" />
                            </button>
                          </div>
                        </article>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className="flex min-h-[250px] flex-col items-center justify-center rounded-[18px] border border-dashed border-[#ced3d4] bg-[#f6f5f1] px-6 py-9 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-[15px] bg-[#e7ebeb] text-[#71818c]">
                    <History size={23} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-[14px] font-extrabold text-[#29455e]">Пока пусто</h3>
                  <p className="mt-1.5 max-w-[270px] text-[11.5px] leading-[1.55] text-[#7a8793]">
                    Следующий результат анализа появится здесь автоматически.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <footer className="shrink-0 border-t border-[#e5e2dc] bg-[#f6f4ef] px-5 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-3.5 sm:px-7 sm:pb-3.5">
          <p className="flex items-center gap-2 text-[10.5px] leading-[1.4] text-[#788592]">
            <LockKeyhole size={14} strokeWidth={1.9} aria-hidden="true" />
            История не отправляется на сервер RuFact.
          </p>
        </footer>
      </section>

      <p key={announcement?.id} className="sr-only" role="status" aria-live="polite">
        {announcement?.message ?? ""}
      </p>
    </dialog>
  );
}
