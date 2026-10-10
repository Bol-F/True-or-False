# Source-grounded AI chat

Web: `/chat`. Telegram: `/chat` or the localized AI chat keyboard button. Chat explains news, claims and sources; it is not a measured classifier or a guarantee of truth. `/check` and ordinary Telegram messages outside chat mode still perform claim assessment.

## Configuration and quotas

No new provider key is needed. Both surfaces require server-only `GEMINI_API_KEY`, the existing allowlisted `GEMINI_MODEL`, `GEMINI_REVIEW_ENABLED=true`, and `TAVILY_API_KEY`. Production additionally requires Redis REST credentials and `RATE_LIMIT_HASH_SECRET`. Telegram uses its existing token and webhook secret. Never expose secrets with `NEXT_PUBLIC_`.

The installed AI SDK Google adapter uses the configured Gemini key directly; no extra paid service is introduced. Each turn performs one basic Tavily search and one bounded Gemini generation. Chat shares the existing per-client/user limits and global daily provider budget: defaults are 5 internet requests per 5 minutes and 30 daily across website and bot. Provider free-tier quotas also apply independently.

## Data and safety

- Web conversation stays in React memory only. Refreshing, leaving the page, clearing it or changing language starts a new conversation. Only three exchanges plus the current question are sent as context.
- Telegram stores up to three exchanges under hashed identities in Redis, expiring after 30 minutes of inactivity. `/new` removes context; `/forget` also removes saved language and mode. Telegram retains messages under its own policies. Delivery-retry caches can last 48 hours.
- Questions are capped at 2000 characters. Only alternating user/assistant text is accepted, never system messages, tool calls, attachments or provider settings. Total context is capped at 10,000 characters and JSON at 32,000 bytes.
- Tavily receives a short query derived from current and earlier user questions; Gemini receives short context and untrusted retrieved snippets. Do not submit confidential data.
- Source URLs come only from search results and are filtered to credential-free HTTPS links. React renders AI text as text; Telegram uses escaped HTML. Links do not prove that every generated statement is supported.
- Missing evidence or provider errors produce an unavailable response, not a fabricated verdict. Provider exceptions are not logged or returned with secrets. Requests are time-bounded; model retries are disabled to conserve quotas.
- Telegram conversation leases serialize messages. Deduplication and cached replies avoid another generation on normal delivery retries, but crashes can still lead to duplicate transport delivery.

## Verification

```bash
npm run test:chat
npm run test:telegram
npm run typecheck
npm run lint
npm run build
npm run test:e2e -- tests/e2e/chat.spec.ts
```

Browser tests mock replies to verify layout, language, sources, context, escaping, clearing and quota recovery without spending provider quota. Separately test one real question after deployment and inspect its sources. Run `npm run telegram:setup -- register` after deployment to update commands, then test `/chat`, a question, a follow-up, `/new` and `/check` in Telegram.
