import { NextResponse } from "next/server";

import { getMockAnalysis } from "@/lib/api";

const MAX_TEXT_LENGTH = 5_000;
const MOCK_LATENCY_MS = 900;

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

  await wait(MOCK_LATENCY_MS);

  return NextResponse.json(getMockAnalysis(normalizedText));
}
