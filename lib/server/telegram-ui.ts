import type { AppLocale } from "../i18n";

export const telegramUi = {
  uz: { check: "🔎 Matnni tekshirish", chat: "💬 AI chat", language: "🌐 Til / Language", help: "❔ Yordam", clear: "🧹 Yangi suhbat", stop: "⏹ Chatni tugatish", stopped: "⏹ Chat tugatildi, kontekst o‘chirildi. Endi matnni tekshirish rejimidasiz. /chat — qayta boshlash.", choose: "🌐 Javob tilini tanlang", checkMode: "🔎 Tekshirish rejimi\n\nMatn yuboring yoki xabarni forward qiling. Men manbalarni topib, da’volarni solishtiraman.", chatMode: "💬 RuFact AI chat\n\nSavol bering, keyin davomiy savollarni yozavering — har safar /chat kerak emas. Faktlarga oid savollarga internet manbalari topiladi.\n\nChat siz /stop yoki /check tanlamaguningizcha faol. Oxirgi 3 savol-javob 30 daqiqa harakatsizlikdan keyin o‘chadi, lekin chat rejimi qoladi. /new — yangi suhbat. Shaxsiy ma’lumot yubormang.", cleared: "🧹 Yangi suhbat boshlandi. Savolingizni yozing — chat faol.", typing: "Savol yoki davomiy savol yozing…", chatTitle: "RuFact · AI yordamchi" },
  ru: { check: "🔎 Проверить текст", chat: "💬 AI-чат", language: "🌐 Язык / Language", help: "❔ Помощь", clear: "🧹 Новый разговор", stop: "⏹ Завершить чат", stopped: "⏹ Чат завершён, контекст удалён. Теперь можно прислать текст для проверки. /chat — начать снова.", choose: "🌐 Выберите язык ответа", checkMode: "🔎 Режим проверки\n\nПришлите текст или перешлите сообщение. Я найду источники и сопоставлю утверждения.", chatMode: "💬 AI-чат RuFact\n\nЗадайте вопрос, затем просто пишите уточнения — повторять /chat не нужно. Для фактических вопросов ищу интернет-источники.\n\nЧат активен, пока вы не выберете /stop или /check. Последние 3 пары сообщений удаляются через 30 минут бездействия, но режим чата остаётся. /new — новый разговор. Не отправляйте личные данные.", cleared: "🧹 Начат новый разговор. Напишите вопрос — чат остаётся активным.", typing: "Напишите вопрос или уточнение…", chatTitle: "RuFact · AI-помощник" },
  en: { check: "🔎 Check text", chat: "💬 AI chat", language: "🌐 Language", help: "❔ Help", clear: "🧹 New conversation", stop: "⏹ End chat", stopped: "⏹ Chat ended and context cleared. You’re in fact-check mode. /chat — start again.", choose: "🌐 Choose a response language", checkMode: "🔎 Fact-check mode\n\nSend text or forward a message. I’ll find sources and compare its claims.", chatMode: "💬 RuFact AI chat\n\nAsk a question, then keep sending follow-ups — no need to repeat /chat. Factual questions use web sources.\n\nChat stays active until you select /stop or /check. The last 3 exchanges expire after 30 minutes of inactivity, but chat mode stays on. /new — new conversation. Don’t send personal data.", cleared: "🧹 New conversation started. Send a question — chat is still active.", typing: "Type a question or follow-up…", chatTitle: "RuFact · AI assistant" },
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
    if (text === copy.stop) return "/stop";
  }
  return text;
}

export function telegramKeyboard(locale: AppLocale, webUrl: string, languages = false, chatMode = false) {
  const copy = telegramUi[locale];
  return {
    keyboard: languages ? [[{ text: "🇺🇿 O‘zbekcha" }, { text: "🇷🇺 Русский" }, { text: "🇬🇧 English" }], [{ text: chatMode ? copy.chat : copy.check }, { text: copy.help }]] : chatMode ? [
      [{ text: copy.clear }, { text: copy.stop }],
      [{ text: copy.language }, { text: "↗ RuFact AI", web_app: { url: new URL("/chat", webUrl).href } }],
      [{ text: copy.check }, { text: copy.help }],
    ] : [
      [{ text: copy.check }, { text: copy.chat }],
      [{ text: copy.clear }, { text: copy.language }],
      [{ text: copy.help }, { text: "↗ RuFact", web_app: { url: webUrl } }],
    ],
    resize_keyboard: true,
    is_persistent: true,
    input_field_placeholder: chatMode ? copy.typing : locale === "ru" ? "Отправьте текст для проверки…" : locale === "en" ? "Send text to check…" : "Tekshirish uchun matn yuboring…",
  };
}
