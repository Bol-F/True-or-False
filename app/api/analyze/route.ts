import { NextResponse } from "next/server";

import { getMockAnalysis } from "@/lib/api";

const MAX_TEXT_LENGTH = 5_000;
const MOCK_LATENCY_MS = 900;
const ML_TIMEOUT_MS = 8_000;

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Тело запроса должно содержать JSON." },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object" || !("text" in body)) {
    return NextResponse.json(
      { error: "Добавьте поле text в запрос." },
      { status: 400 },
    );
  }

  const { text } = body as { text?: unknown };

  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json(
      { error: "Введите текст для проверки." },
      { status: 400 },
    );
  }

  const normalizedText = text.trim();

  if (normalizedText.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: "Текст не должен превышать 5000 символов." },
      { status: 400 },
    );
  }

  const mlEndpoint = process.env.ML_API_URL?.trim();

  if (!mlEndpoint) {
    await wait(MOCK_LATENCY_MS);
    return NextResponse.json(getMockAnalysis(normalizedText));
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);

  try {
    const response = await fetch(mlEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: normalizedText }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "ML-сервис вернул ошибку. Попробуйте повторить запрос позже." },
        { status: 502 },
      );
    }

    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object") {
      return NextResponse.json(
        { error: "ML-сервис вернул некорректный ответ." },
        { status: 502 },
      );
    }

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { error: "ML-сервис временно недоступен. Проверьте его состояние и повторите запрос." },
      { status: 503 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
