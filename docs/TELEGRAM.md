# RuFact Telegram bot

The bot checks pasted and forwarded text using the same server-side Tavily search and Gemini assessment as the website. It returns a verdict, explanation, claims and source URLs, and offers a separate source-grounded AI chat mode. Uzbek Latin and Cyrillic, Russian and English are supported. It does not present the Russian statistical model's accuracy as multilingual fact-checking accuracy.

## Create the bot

1. Open the official [@BotFather](https://t.me/BotFather) in Telegram, send `/newbot`, choose a display name and an available username ending in `bot`.
2. Save the token in `.env.local` as `TELEGRAM_BOT_TOKEN`. Never paste it into chat or commit it.
3. Generate a separate webhook secret:

   ```bash
   node scripts/setup-telegram.mjs secret
   ```

4. Save it as `TELEGRAM_WEBHOOK_SECRET`. Set `TELEGRAM_WEB_APP_URL=https://rufact.vercel.app` (or your production website origin).

## Deploy and activate

Add the three Telegram variables to the Vercel **Production** environment and redeploy. The app also needs the existing `GEMINI_API_KEY`, `TAVILY_API_KEY`, `GEMINI_REVIEW_ENABLED=true`, Redis REST credentials, and `RATE_LIMIT_HASH_SECRET` (at least 32 characters). Production fails closed without Redis protection. The Telegram source check does not require the ML service to be running.

With the same values in local `.env.local`, run:

```bash
npm run telegram:setup -- register
npm run telegram:setup -- status
```

Registration verifies the deployed secret, creates the command menu and registers `https://rufact.vercel.app/api/telegram/webhook`. It does not discard pending updates. The output includes the bot link. [Telegram's API documentation](https://core.telegram.org/bots/api#setwebhook) explains webhook delivery and secret headers.

## Use

- `/start` or `/help`: instructions and data processing notice.
- `/chat` or **AI chat**: conversational questions with sources. Follow-ups use the last three exchanges; `/new` clears context. `/check` without text returns to fact-check mode. Chat questions are limited to 2000 characters.
- `/uz`, `/ru`, `/en`: save the response language for 30 days. Initially the bot uses Telegram's supported language or Uzbek.
- Send or forward a text message: check it against online sources.
- `/check your text`: explicit text check.
- `/privacy`: explain third-party processing and temporary storage.
- `/forget`: remove language preference, chat mode and conversation context.

Maximum input: 5000 characters (Telegram's own message limit also applies). Captions are analyzed as text; images, voice, and document contents are not extracted by the bot. Each reply links to the website for file uploads. Private chats only; group, bot and unsupported updates are acknowledged without checking content.

## Delivery, limits and storage

Replies use escaped Telegram HTML with verdict markers, section headings and compact links. The reply keyboard offers check/chat modes, language selection, clearing, help and the website. Chat context expires after 30 minutes of inactivity. See [AI_CHAT.md](AI_CHAT.md) for provider limits and privacy details.

The webhook verifies a 32–256-character secret before reading a bounded JSON body. Incoming messages are limited to 10 per minute per hashed Telegram identity. Internet checks use the website's configured per-client limit and **the same shared daily provider budget**, so both entry points together stay within that budget. No public browser endpoint can supply the Telegram identity.

Redis keys use the application namespace and bot-token fingerprint. Atomic 90-second update and conversation leases serialize processing; a completed marker lasts 48 hours. The webhook acknowledges completion after sending the reply. Failed/in-progress deliveries return 503 so Telegram can retry; cached replies avoid another provider call when sending fails. A reply cache is removed after successful delivery or expires after 48 hours. Fact-check inputs are not archived; AI chat temporarily retains up to three exchanges, expiring after 30 minutes of inactivity. Language preferences expire after 30 days.

Transport delivery is at-least-once: a crash after Telegram accepts a reply but before Redis records completion can still produce a duplicate reply. This does not guarantee exactly-once messaging. Slow checks may trigger retries while the lease prevents duplicate searches. The function duration is 60 seconds; source checking has a 25-second deadline and Telegram sending an 8-second deadline. At higher traffic, move processing to a durable queue.

## Verify

```bash
npm run test:telegram
npm run typecheck
npm run build
npm run telegram:setup -- status
```

Then send `/start`, `/uz`, and a short claim to the real bot. Confirm its response includes source links; compare a source manually. Unit tests mock providers and transport, so they do not validate your live token or provider quotas.

If pending updates increase, confirm Vercel environment values, redeploy, run `register` again, and inspect `status`. A quota/provider failure must say verification was unavailable; it must not label the text true by default.
