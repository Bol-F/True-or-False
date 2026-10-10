import type { AppLocale } from "../i18n";

export const telegramUi = {
  uz: { check: "🔎 Matnni tekshirish", chat: "💬 AI chat", language: "🌐 Til / Language", help: "❔ Yordam", clear: "🧹 Yangi suhbat", choose: "🌐 Javob tilini tanlang", checkMode: "🔎 Tekshirish rejimi\n\nMatn yuboring yoki xabarni forward qiling. Men manbalarni topib, da’volarni solishtiraman.", chatMode: "💬 RuFact AI chat\n\nYangilik, da’vo yoki manbalar haqida savol bering. Davomiy savollarni ham tushunaman. Har bir javob uchun internetdan manbalar qidiriladi.\n\nSuhbat 30 daqiqagacha vaqtincha saqlanadi. Shaxsiy ma’lumot yubormang. /new — suhbatni tozalash; /check — tekshirish rejimi.", cleared: "🧹 Suhbat tozalandi. Yangi savol bering.", typing: "Savolingizni yozing…", chatTitle: "RuFact · AI yordamchi" },
  ru: { check: "🔎 Проверить текст", chat: "💬 AI-чат", language: "🌐 Язык / Language", help: "❔ Помощь", clear: "🧹 Новый разговор", choose: "🌐 Выберите язык ответа", checkMode: "🔎 Режим проверки\n\nПришлите текст или перешлите сообщение. Я найду источники и сопоставлю утверждения.", chatMode: "💬 AI-чат RuFact\n\nЗадавайте вопросы о новостях, утверждениях и источниках, включая уточняющие вопросы. Для каждого ответа ищутся интернет-источники.\n\nСодержание разговора временно хранится до 30 минут. Не отправляйте личные данные. /new — очистить разговор; /check — режим проверки.", cleared: "🧹 Разговор очищен. Задайте новый вопрос.", typing: "Напишите вопрос…", chatTitle: "RuFact · AI-помощник" },
  en: { check: "🔎 Check text", chat: "💬 AI chat", language: "🌐 Language", help: "❔ Help", clear: "🧹 New conversation", choose: "🌐 Choose a response language", checkMode: "🔎 Fact-check mode\n\nSend text or forward a message. I’ll find sources and compare its claims.", chatMode: "💬 RuFact AI chat\n\nAsk about news, claims and sources, including follow-up questions. Each answer searches for internet sources.\n\nConversation content is temporarily stored for up to 30 minutes. Don’t send personal data. /new — clear the conversation; /check — fact-check mode.", cleared: "🧹 Conversation cleared. Ask a new question.", typing: "Type your question…", chatTitle: "RuFact · AI assistant" },
};

export function escapeTelegramHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function telegramNotice(text: string) {
  const [heading, ...body] = text.split("\n");
  return `<b>${escapeTelegramHtml(heading)}</b>${body.length ? `\n${escapeTelegramHtml(body.join("\n"))}` : ""}`;
}

export function telegramButtonCommand(text: string) {
  const languages: Record<string, string> = { "🇺🇿 O‘zbekcha": "/uz", "🇷🇺 Русский": "/ru", "🇬🇧 English": "/en" };
  if (languages[text]) return languages[text];
  for (const copy of Object.values(telegramUi)) {
    if (text === copy.check) return "/check";
    if (text === copy.chat) return "/chat";
    if (text === copy.language) return "/language";
    if (text === copy.help) return "/help";
    if (text === copy.clear) return "/new";
  }
  return text;
}

export function telegramKeyboard(locale: AppLocale, webUrl: string, languages = false) {
  const copy = telegramUi[locale];
  return {
    keyboard: languages ? [[{ text: "🇺🇿 O‘zbekcha" }, { text: "🇷🇺 Русский" }, { text: "🇬🇧 English" }], [{ text: copy.check }, { text: copy.help }]] : [
      [{ text: copy.check }, { text: copy.language }],
      [{ text: copy.help }, { text: "↗ RuFact", web_app: { url: webUrl } }],
    ],
    resize_keyboard: true,
    input_field_placeholder: locale === "ru" ? "Отправьте текст для проверки…" : locale === "en" ? "Send text to check…" : "Tekshirish uchun matn yuboring…",
  };
}
