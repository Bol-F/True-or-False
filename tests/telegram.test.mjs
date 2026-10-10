import assert from "node:assert/strict";
import test from "node:test";
import { botCopy, formatTelegramAssessment, formatTelegramChat, handleTelegramMessage, parseTelegramUpdate, verifyTelegramSecret } from "../lib/server/telegram-core.ts";
import { telegramKeyboard, telegramNotice } from "../lib/server/telegram-ui.ts";

const message = { updateId: 1, chatId: 123, messageId: 42, text: "Ўзбекистон пойтахти Тошкент.", language: "uz" };
const assessment = {
  status: "complete", provider: "gemini", label: "REAL", certainty: "high",
  explanation: "Manba tasdiqlaydi.", warningSigns: [], claims: [],
  sources: [{ id: "s1", title: "Official source", url: "https://example.org/source" }],
  externalSourcesChecked: true, searchQueries: [], model: "test", promptVersion: "misinfo-tavily-v3",
};

function harness() {
  const values = new Map();
  const sent = [];
  const assessed = [];
  const limits = [];
  const deps = {
    store: {
      get: async key => values.get(key) ?? null,
      set: async (key, value) => { values.set(key, value); },
      remove: async key => { values.delete(key); },
      claim: async (key, value) => { if (values.has(key)) return false; values.set(key, value); return true; },
      release: async (key, value) => { if (values.get(key) === value) values.delete(key); },
    },
    userKey: id => `hashed-${id}`,
    lockToken: () => "lease-owner",
    limit: async (id, internet) => { limits.push({ id, internet }); return { allowed: true, configured: true }; },
    assess: async (text, locale) => { assessed.push({ text, locale }); return assessment; },
    send: async (incoming, text, locale) => { sent.push({ incoming, text, locale }); },
  };
  return { deps, values, sent, assessed, limits };
}

test("webhook requires a strong exact shared secret", () => {
  const secret = "telegram-test-secret-at-least-32-chars";
  assert.equal(verifyTelegramSecret(secret, secret), true);
  assert.equal(verifyTelegramSecret(secret + "x", secret), false);
  assert.equal(verifyTelegramSecret(null, secret), false);
  assert.equal(verifyTelegramSecret("short", "short"), false);
  assert.equal(verifyTelegramSecret(" "+secret, secret), false);
});

test("only valid private human messages are accepted; captions and forwarded text work", () => {
  const raw = { update_id: 1, message: { message_id: 42, chat: { id: 123, type: "private" }, from: { id: 123, is_bot: false, language_code: "uz" }, text: message.text, forward_origin: { type: "channel" } } };
  assert.deepEqual(parseTelegramUpdate(raw), message);
  assert.equal(parseTelegramUpdate({ ...raw, message: { ...raw.message, chat: { id: 123, type: "group" } } }), null);
  assert.equal(parseTelegramUpdate({ ...raw, message: { ...raw.message, from: { id: 999, is_bot: false } } }), null);
  assert.equal(parseTelegramUpdate({ ...raw, update_id: "1" }), null);
  assert.equal(parseTelegramUpdate({ ...raw, message: { ...raw.message, from: { id: 123, is_bot: true } } }), null);
  assert.equal(parseTelegramUpdate({ ...raw, message: { ...raw.message, text: undefined, caption: "Photo caption" } }).text, "Photo caption");
});

test("source checking handles Uzbek Cyrillic and completed deliveries are deduplicated", async () => {
  const { deps, sent, assessed, limits, values } = harness();
  assert.equal(await handleTelegramMessage(message, deps), "done");
  assert.deepEqual(assessed, [{ text: message.text, locale: "uz" }]);
  assert.match(sent[0].text, /https:\/\/example.org\/source/);
  assert.equal(limits.filter(limit => limit.internet).length, 1);
  assert.equal(await handleTelegramMessage(message, deps), "duplicate");
  assert.equal(sent.length, 1);
  assert.equal(assessed.length, 1);
  assert.equal(values.has("update:1:reply"), false);
});

test("language commands persist without consuming the internet budget", async () => {
  const { deps, assessed, sent, limits } = harness();
  await handleTelegramMessage({ ...message, text: "/en" }, deps);
  await handleTelegramMessage({ ...message, updateId: 2, text: "/check Tashkent is the capital of Uzbekistan." }, deps);
  assert.equal(sent[0].locale, "en");
  assert.deepEqual(assessed, [{ text: "Tashkent is the capital of Uzbekistan.", locale: "en" }]);
  assert.equal(limits.filter(limit => limit.internet).length, 1);
});

test("forget deletes language settings and help, invalid lengths and media never search", async () => {
  const { deps, values, assessed } = harness();
  await handleTelegramMessage({ ...message, text: "/ru" }, deps);
  await handleTelegramMessage({ ...message, updateId: 2, text: "/forget" }, deps);
  assert.equal(values.has("language:hashed-123"), false);
  for (const [index, text] of ["/help", "/privacy", "", "a".repeat(5001)].entries()) {
    await handleTelegramMessage({ ...message, updateId: index + 3, text }, deps);
  }
  assert.equal(assessed.length, 0);
});

test("delivery retries reuse a cached reply without another search or rate-limit charge", async () => {
  const { deps, assessed, limits, sent, values } = harness();
  const original = deps.send;
  deps.send = async () => { throw new Error("Transport unavailable"); };
  await assert.rejects(handleTelegramMessage(message, deps));
  assert.equal(values.has("update:1:lock"), false);
  assert.equal(values.has("update:1:done"), false);
  deps.send = original;
  await handleTelegramMessage(message, deps);
  assert.equal(assessed.length, 1);
  assert.equal(limits.length, 2);
  assert.equal(sent.length, 1);
});

test("concurrent deliveries wait for the original and do not call providers", async () => {
  const { deps, values, assessed } = harness();
  values.set("update:1:lock", "another-owner");
  assert.equal(await handleTelegramMessage(message, deps), "busy");
  assert.equal(assessed.length, 0);
});

test("quota denial and protection outages never call providers", async () => {
  const { deps, assessed, sent } = harness();
  deps.limit = async () => ({ allowed: false, configured: true });
  await handleTelegramMessage(message, deps);
  assert.equal(sent[0].text, telegramNotice(botCopy.uz.limited));
  deps.limit = async () => ({ allowed: false, configured: false });
  await assert.rejects(handleTelegramMessage({ ...message, updateId: 2 }, deps));
  assert.equal(assessed.length, 0);
});

test("failed checks are never presented as true and unsafe links are omitted", () => {
  assert.equal(formatTelegramAssessment({ status: "unavailable", provider: "gemini", reason: "rate-limited" }, "en"), botCopy.en.unavailable);
  const result = formatTelegramAssessment({ ...assessment, explanation: "<b>Claim</b>", sources: [{ id: "x", title: "Fake", url: "javascript:alert(1)" }], claims: Array.from({ length: 6 }, () => ({ quote: "x".repeat(320), explanation: "y".repeat(500) })) }, "en");
  assert.ok(result.length <= 4096);
  assert.doesNotMatch(result, /javascript:/);
  assert.match(result, /&lt;b&gt;Claim&lt;\/b&gt;/);
});

test("localized navigation buttons select language and mode without searching", async () => {
  const { deps, assessed, sent } = harness();
  for (const [index, text] of ["🌐 Til / Language", "🇬🇧 English", "🔎 Check text"].entries()) {
    await handleTelegramMessage({ ...message, updateId: index + 1, text }, deps);
  }
  assert.equal(assessed.length, 0);
  assert.equal(sent[1].locale, "en");
  assert.match(sent[2].text, /Fact-check mode/);
  assert.equal(telegramKeyboard("en", "https://example.org", true).keyboard[0].length, 3);
});

test("AI chat remembers follow-ups, clears context and preserves fact-check mode", async () => {
  const { deps, values, assessed } = harness();
  const conversations = [];
  deps.chat = async messages => { conversations.push(messages); return { status: "complete", text: "Answer [1]", sources: assessment.sources }; };
  for (const [index, text] of ["💬 AI chat", "First question", "Follow-up", "/new", "New question", "/check", "A claim"].entries()) await handleTelegramMessage({ ...message, updateId: index + 1, text }, deps);
  assert.equal(conversations.length, 3);
  assert.equal(conversations[1].length, 3);
  assert.equal(conversations[2].length, 1);
  assert.equal(assessed.length, 1);
  await handleTelegramMessage({ ...message, updateId: 8, text: "/forget" }, deps);
  assert.equal(values.has("chat:hashed-123"), false);
  assert.equal(values.has("mode:hashed-123"), false);
});

test("AI chat delivery retries do not regenerate an answer", async () => {
  const { deps, sent } = harness(); let calls = 0;
  deps.chat = async () => { calls++; return { status: "complete", text: "Answer [1]", sources: assessment.sources }; };
  await handleTelegramMessage({ ...message, text: "/chat" }, deps);
  const original = deps.send;
  deps.send = async () => { throw new Error("Offline"); };
  const follow = { ...message, updateId: 2, text: "Question" };
  await assert.rejects(handleTelegramMessage(follow, deps)); deps.send = original;
  await handleTelegramMessage(follow, deps);
  assert.equal(calls, 1); assert.equal(sent.length, 2);
});

test("a conversation lease serializes separate updates and HTML cannot be injected", async () => {
  const { deps, values, assessed } = harness();
  values.set("conversation:hashed-123:lock", "another-owner");
  assert.equal(await handleTelegramMessage(message, deps), "busy"); assert.equal(assessed.length, 0);
  const html = formatTelegramChat({ status: "complete", text: "<a href='evil'>Oops</a>".repeat(200), sources: assessment.sources }, "en");
  assert.ok(html.length < 4096); assert.match(html, /&lt;a/); assert.doesNotMatch(html, /<a href='evil'/);
});
