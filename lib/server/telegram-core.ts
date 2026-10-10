import { timingSafeEqual } from "node:crypto";
import type { AppLocale } from "../i18n";
import type { GeminiAssessment } from "./gemini-review-core";
import { escapeTelegramHtml, telegramButtonCommand, telegramNotice, telegramUi } from "./telegram-ui.ts";

export interface TelegramMessage {
  updateId: number;
  chatId: number;
  messageId: number;
  text: string;
  language: AppLocale;
}

export const botCopy = {
  uz: {
    welcome: "RuFact — matn va manbalarni tekshirish.\n\nMatn yuboring yoki xabarni shu yerga forward qiling (5000 belgigacha). O‘zbek lotin va kirill, rus va ingliz tillari qo‘llanadi.\n\n/uz /ru /en — javob tili\n/help — yordam\n/privacy — maxfiylik\n\nTekshirish uchun matn Tavily va Google Gemini xizmatlariga yuboriladi. Shaxsiy yoki maxfiy ma’lumot yubormang.",
    selected: "Javob tili: O‘zbekcha. Matn yuboring (lotin yoki kirill).",
    privacy: "Tekshirishda matn Tavily va Google Gemini’ga yuboriladi. Bot matnlaringiz tarixini yaratmaydi. Til sozlamasi 30 kun, takroriy xabarlarni aniqlash va yetkazish holati 48 soatgacha Redis’da saqlanadi. Javobni qayta yetkazish uchun qisqa natija ham vaqtincha saqlanishi mumkin. /forget — botdagi saqlangan tilni o‘chirish. Telegram o‘z qoidalariga ko‘ra xabarlarni saqlaydi.",
    forgotten: "Saqlangan til sozlamasi o‘chirildi.",
    unsupported: "Matn yuboring yoki matnli xabarni forward qiling. Fayl yuklash uchun saytni oching.",
    tooLong: "Matn 5000 belgidan oshmasligi kerak. Uni qismlarga bo‘lib yuboring.",
    limited: "So‘rovlar limiti tugadi. Birozdan keyin qayta urinib ko‘ring.",
    unavailable: "Manbalarni hozir tekshirib bo‘lmadi. Bu matn rost yoki yolg‘on degani emas. Keyinroq qayta urinib ko‘ring.",
    sources: "Manbalar", claims: "Da’volar", title: "RuFact · Manbalar bo‘yicha tekshiruv", open: "RuFact saytini ochish",
    disclaimer: "Baho topilgan manbalarga asoslanadi. Muhim da’volarni asl manbada tekshiring.",
    labels: { REAL: "Manbalar tasdiqlaydi", FAKE: "Manbalar qarshi dalil ko‘rsatadi", UNSURE: "Dalil yetarli emas / aralash" },
  },
  ru: {
    welcome: "RuFact — проверка текста по источникам.\n\nПришлите текст или перешлите сообщение (до 5000 символов). Поддерживаются узбекский (латиница и кириллица), русский и английский.\n\n/uz /ru /en — язык ответа\n/help — помощь\n/privacy — конфиденциальность\n\nДля проверки текст отправляется Tavily и Google Gemini. Не отправляйте личные или секретные данные.",
    selected: "Язык ответа: Русский. Пришлите текст для проверки.",
    privacy: "Текст для проверки отправляется Tavily и Google Gemini. Бот не создаёт историю ваших текстов. Язык хранится 30 дней; идентификаторы повторов и состояние доставки — до 48 часов в Redis. Краткий результат может временно храниться для повторной доставки. /forget удаляет сохранённый язык. Telegram хранит сообщения по своим правилам.",
    forgotten: "Сохранённая настройка языка удалена.",
    unsupported: "Пришлите текст или перешлите текстовое сообщение. Для загрузки файла откройте сайт.",
    tooLong: "Максимум 5000 символов. Отправьте текст частями.",
    limited: "Лимит запросов исчерпан. Повторите попытку позже.",
    unavailable: "Сейчас не удалось проверить источники. Это не означает, что текст правдивый или ложный. Попробуйте позже.",
    sources: "Источники", claims: "Утверждения", title: "RuFact · Проверка по источникам", open: "Открыть сайт RuFact",
    disclaimer: "Оценка основана на найденных источниках. Важные утверждения проверяйте в первоисточниках.",
    labels: { REAL: "Источники подтверждают", FAKE: "Источники показывают противоречия", UNSURE: "Недостаточно / смешанные данные" },
  },
  en: {
    welcome: "RuFact — check text against sources.\n\nSend text or forward a message (up to 5000 characters). Uzbek (Latin and Cyrillic), Russian and English are supported.\n\n/uz /ru /en — response language\n/help — help\n/privacy — privacy\n\nChecks send text to Tavily and Google Gemini. Do not send personal or confidential information.",
    selected: "Response language: English. Send a text to check.",
    privacy: "Checks send text to Tavily and Google Gemini. The bot does not create a history of your texts. Language preferences expire after 30 days; duplicate identifiers and delivery state expire after 48 hours in Redis. A short result may also be stored temporarily for delivery retries. /forget removes your saved language. Telegram retains messages under its own policies.",
    forgotten: "Your saved language preference was removed.",
    unsupported: "Send text or forward a text message. Open the website to upload a file.",
    tooLong: "Maximum 5000 characters. Send the text in smaller parts.",
    limited: "The request limit has been reached. Try again later.",
    unavailable: "Sources could not be checked right now. This does not mean the text is true or false. Please try later.",
    sources: "Sources", claims: "Claims", title: "RuFact · Source check", open: "Open RuFact website",
    disclaimer: "This assessment uses the sources found. Check important claims in the original sources.",
    labels: { REAL: "Supported by sources", FAKE: "Contradicted by sources", UNSURE: "Insufficient / mixed evidence" },
  },
};

export function verifyTelegramSecret(received: string | null, expected: string | undefined) {
  if (!expected || !/^[A-Za-z0-9_-]{32,256}$/.test(expected) || !received) return false;
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function parseTelegramUpdate(value: unknown): TelegramMessage | null {
  if (!value || typeof value !== "object") return null;
  const update = value as Record<string, unknown>;
  if (!Number.isSafeInteger(update.update_id) || (update.update_id as number) < 0) return null;
  if (!update.message || typeof update.message !== "object") return null;
  const message = update.message as Record<string, unknown>;
  const chat = message.chat as Record<string, unknown> | undefined;
  const from = message.from as Record<string, unknown> | undefined;
  if (!chat || chat.type !== "private" || !Number.isSafeInteger(chat.id) || (chat.id as number) <= 0 || !from || from.is_bot !== false || from.id !== chat.id) return null;
  if (!Number.isSafeInteger(message.message_id) || (message.message_id as number) <= 0) return null;
  const language = typeof from.language_code === "string" ? from.language_code.split("-", 1)[0] : "uz";
  return {
    updateId: update.update_id as number,
    chatId: chat.id as number,
    messageId: message.message_id as number,
    text: typeof message.text === "string" ? message.text.trim() : typeof message.caption === "string" ? message.caption.trim() : "",
    language: language === "ru" || language === "en" ? language : "uz",
  };
}

function shorten(text: string, length: number) {
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

export function formatTelegramAssessment(result: GeminiAssessment, locale: AppLocale) {
  const copy = botCopy[locale];
  if (result.status !== "complete") return copy.unavailable;
  const claims = result.claims.slice(0, 3).map(claim => `• <b>${escapeTelegramHtml(shorten(claim.quote, 90))}</b>\n${escapeTelegramHtml(shorten(claim.explanation, 130))}`);
  const sources = result.sources.slice(0, 4).flatMap(source => {
    try {
      const url = new URL(source.url);
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.href.length > 450) return [];
      return [`• <a href="${escapeTelegramHtml(url.href)}">${escapeTelegramHtml(shorten(source.title.replace(/[\r\n]/g, " "), 65))}</a>`];
    } catch { return []; }
  });
  const icon = result.label === "REAL" ? "🟢" : result.label === "FAKE" ? "🔴" : "🟡";
  // Escape untrusted content before using Telegram HTML. Never truncate markup.
  const sections = [`<b>🔎 ${escapeTelegramHtml(copy.title)}</b>`, `<b>${icon} ${escapeTelegramHtml(copy.labels[result.label])}</b>`, escapeTelegramHtml(shorten(result.explanation, 500))];
  for (const section of [claims.length ? `<b>📌 ${copy.claims}</b>\n${claims.join("\n\n")}` : "", sources.length ? `<b>🔗 ${copy.sources}</b>\n${sources.join("\n")}` : ""]) {
    if (section && [...sections, section, copy.disclaimer].join("\n\n").length < 4000) sections.push(section);
  }
  return [...sections, `<i>${escapeTelegramHtml(copy.disclaimer)}</i>`].join("\n\n");
}

export interface TelegramStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl: number): Promise<void>;
  remove(key: string): Promise<void>;
  claim(key: string, token: string, ttl: number): Promise<boolean>;
  release(key: string, token: string): Promise<void>;
}

export interface TelegramDependencies {
  store: TelegramStore;
  userKey: (chatId: number) => string;
  lockToken: () => string;
  limit: (identifier: string, internet: boolean) => Promise<{ allowed: boolean; configured: boolean }>;
  assess: (text: string, locale: AppLocale) => Promise<GeminiAssessment>;
  send: (message: TelegramMessage, text: string, locale: AppLocale) => Promise<void>;
}

// A failed delivery is retried by Telegram; completed updates never consume providers again.
export async function handleTelegramMessage(message: TelegramMessage, deps: TelegramDependencies): Promise<"done" | "busy" | "duplicate"> {
  const updateKey = `update:${message.updateId}`;
  if (await deps.store.get(`${updateKey}:done`)) return "duplicate";
  const token = deps.lockToken();
  if (!await deps.store.claim(`${updateKey}:lock`, token, 90)) return "busy";
  try {
    if (await deps.store.get(`${updateKey}:done`)) return "duplicate";
    const identifier = deps.userKey(message.chatId);
    const languageKey = `language:${identifier}`;
    const saved = await deps.store.get(languageKey);
    let locale: AppLocale = saved === "uz" || saved === "ru" || saved === "en" ? saved : message.language;
    const cached = await deps.store.get(`${updateKey}:reply`);
    let reply = cached;
    if (!reply) {
      const generalLimit = await deps.limit(identifier, false);
      if (!generalLimit.configured) throw new Error("Telegram protection unavailable");
      if (!generalLimit.allowed) {
        reply = botCopy[locale].limited;
      } else {
        const input = telegramButtonCommand(message.text);
        const commandMatch = /^\/(\w+)(?:@[A-Za-z0-9_]+)?(?:\s+([\s\S]*))?$/.exec(input);
        const command = commandMatch?.[1]?.toLowerCase();
        if (command === "uz" || command === "ru" || command === "en") {
          locale = command;
          await deps.store.set(languageKey, locale, 30 * 86_400);
          reply = botCopy[locale].selected;
        } else if (command === "language") {
          reply = telegramUi[locale].choose;
        } else if (command === "check" && !commandMatch?.[2]) {
          reply = telegramUi[locale].checkMode;
        } else if (command === "forget") {
          await deps.store.remove(languageKey);
          reply = botCopy[locale].forgotten;
        } else if (command === "privacy") {
          reply = botCopy[locale].privacy;
        } else if (command && command !== "check") {
          reply = botCopy[locale].welcome;
        } else {
          const text = (command === "check" ? commandMatch?.[2] ?? "" : message.text).trim();
          if (!text) reply = botCopy[locale].unsupported;
          else if (text.length > 5000) reply = botCopy[locale].tooLong;
          else {
            const limit = await deps.limit(identifier, true);
            if (!limit.configured) throw new Error("Telegram protection unavailable");
            reply = limit.allowed ? formatTelegramAssessment(await deps.assess(text, locale), locale) : botCopy[locale].limited;
          }
        }
      }
      if (!reply.startsWith("<b>")) reply = telegramNotice(reply);
      await deps.store.set(`${updateKey}:reply`, reply, 2 * 86_400);
      await deps.store.set(`${updateKey}:format`, "html", 2 * 86_400);
      await deps.store.set(`${updateKey}:locale`, locale, 2 * 86_400);
    } else {
      if (await deps.store.get(`${updateKey}:format`) !== "html") reply = telegramNotice(reply);
      const replyLocale = await deps.store.get(`${updateKey}:locale`);
      if (replyLocale === "uz" || replyLocale === "ru" || replyLocale === "en") locale = replyLocale;
    }
    await deps.send(message, reply, locale);
    await deps.store.set(`${updateKey}:done`, "1", 2 * 86_400);
    await deps.store.remove(`${updateKey}:reply`);
    await deps.store.remove(`${updateKey}:locale`);
    await deps.store.remove(`${updateKey}:format`);
    return "done";
  } finally {
    await deps.store.release(`${updateKey}:lock`, token);
  }
}
