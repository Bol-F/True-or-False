import { expect, test } from "@playwright/test";

test("Telegram webhook authenticates and bounds updates before processing", async ({ request }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("desktop"), "Server route check");
  const url = "/api/telegram/webhook";
  const headers = { "Content-Type": "application/json", "X-Telegram-Bot-Api-Secret-Token": "playwright-telegram-webhook-secret-at-least-32-chars" };
  const unauthorized = await request.post(url, { data: {} });
  expect(unauthorized.status()).toBe(401);
  const empty = await request.post(url, { headers, data: {} });
  expect(empty.status()).toBe(200);
  expect(empty.headers()["cache-control"]).toContain("no-store");
  const malformed = await request.post(url, { headers, data: Buffer.from("{") });
  expect(malformed.status()).toBe(400);
  const oversized = await request.post(url, { headers, data: Buffer.from(JSON.stringify({ text: "a".repeat(24001) })) });
  expect(oversized.status()).toBe(413);
  const wrongType = await request.post(url, { headers: { ...headers, "Content-Type": "text/plain" }, data: "{}" });
  expect(wrongType.status()).toBe(415);
  const group = await request.post(url, { headers, data: { update_id: 5, message: { message_id: 1, chat: { id: -123, type: "group" }, from: { id: 123, is_bot: false }, text: "Group content must not trigger any external call" } } });
  expect(group.status()).toBe(200);
  expect(await group.json()).toEqual({ ok: true });
});
