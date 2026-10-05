import { NextResponse } from "next/server";

import { MAX_DOCUMENT_BYTES } from "@/lib/document-upload";
import {
  rateLimitExtractRequest,
  rateLimitHeaders,
} from "@/lib/server/rate-limit";

const MAX_MULTIPART_BYTES = MAX_DOCUMENT_BYTES + 256 * 1024;
const MAX_EXTRACTED_CHARACTERS = 5_000;
const MAX_PDF_PAGES = 40;
const PDF_TIMEOUT_MS = 10_000;
const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" } as const;

export const maxDuration = 20;

type DocumentFormat = "text" | "pdf" | "docx";

class ExtractionError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 413 | 415 | 422,
  ) {
    super(message);
  }
}

function jsonResponse(
  payload: unknown,
  status = 200,
  additionalHeaders?: HeadersInit,
) {
  return NextResponse.json(payload, {
    status,
    headers: {
      ...NO_STORE_HEADERS,
      ...Object.fromEntries(new Headers(additionalHeaders)),
    },
  });
}

function isSameOriginRequest(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "same-site") {
    return false;
  }

  const origin = request.headers.get("origin");
  if (!origin) return true;

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function extensionOf(fileName: string) {
  const match = /\.([a-z0-9]+)$/iu.exec(fileName.trim());
  return match?.[1]?.toLowerCase() ?? "";
}

function documentFormat(file: File): DocumentFormat {
  const extension = extensionOf(file.name);
  const mimeType = file.type.toLowerCase();

  if (extension === "pdf" && (!mimeType || mimeType === "application/pdf")) {
    return "pdf";
  }
  if (
    extension === "docx" &&
    (!mimeType ||
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
  ) {
    return "docx";
  }

  const textMimeTypes = new Set([
    "",
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json",
  ]);
  if (["txt", "md", "csv", "json"].includes(extension) && textMimeTypes.has(mimeType)) {
    return "text";
  }

  throw new ExtractionError(
    "Поддерживаются файлы TXT, MD, CSV, JSON, PDF и DOCX.",
    415,
  );
}

function hasPrefix(bytes: Uint8Array, prefix: readonly number[]) {
  return prefix.every((value, index) => bytes[index] === value);
}

function validateSignature(bytes: Uint8Array, format: DocumentFormat) {
  if (format === "pdf" && !hasPrefix(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
    throw new ExtractionError("Файл не похож на корректный PDF.", 422);
  }
  if (format === "docx" && !hasPrefix(bytes, [0x50, 0x4b])) {
    throw new ExtractionError("Файл не похож на корректный DOCX.", 422);
  }
}

function normalizeText(value: string) {
  return value
    .replace(/\r\n?/gu, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/gu, "")
    .replace(/[ \t]+\n/gu, "\n")
    .replace(/\n{4,}/gu, "\n\n\n")
    .trim();
}

function limitText(value: string) {
  if (value.length <= MAX_EXTRACTED_CHARACTERS) {
    return { text: value, truncated: false };
  }

  const candidate = value.slice(0, MAX_EXTRACTED_CHARACTERS);
  const lastBoundary = Math.max(
    candidate.lastIndexOf("\n"),
    candidate.lastIndexOf(". "),
    candidate.lastIndexOf(" "),
  );
  const cutAt = lastBoundary >= 4_500 ? lastBoundary + 1 : candidate.length;
  return { text: candidate.slice(0, cutAt).trimEnd(), truncated: true };
}

async function withTimeout<T>(promise: Promise<T>, milliseconds: number) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new ExtractionError("PDF обрабатывался слишком долго.", 422)),
      milliseconds,
    );
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function readPdf(bytes: Uint8Array) {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(bytes, { maxImageSize: 16_777_216 });
  try {
    if (pdf.numPages > MAX_PDF_PAGES) {
      throw new ExtractionError(
        `В PDF слишком много страниц. Максимум — ${MAX_PDF_PAGES}.`,
        413,
      );
    }
    const result = await withTimeout(
      extractText(pdf, { mergePages: true }),
      PDF_TIMEOUT_MS,
    );
    return { text: String(result.text), pages: result.totalPages };
  } finally {
    const destroy = (pdf as unknown as { destroy?: () => Promise<void> }).destroy;
    if (destroy) await destroy.call(pdf);
  }
}

async function extractFromFile(file: File, format: DocumentFormat) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  validateSignature(bytes, format);

  if (format === "pdf") return readPdf(bytes);
  if (format === "docx") {
    const { default: mammoth } = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return { text: result.value };
  }

  return { text: new TextDecoder("utf-8").decode(bytes) };
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return jsonResponse({ error: "Запрос отклонён." }, 403);
  }

  const rateLimit = await rateLimitExtractRequest(request);
  if (!rateLimit.configured) {
    return jsonResponse(
      { error: "Защита от перегрузки временно недоступна." },
      503,
    );
  }
  if (!rateLimit.allowed) {
    const retryAfter = Math.max(
      1,
      Math.ceil((rateLimit.reset - Date.now()) / 1_000),
    );
    return jsonResponse(
      { error: "Слишком много запросов. Попробуйте немного позже." },
      429,
      {
        ...rateLimitHeaders(rateLimit),
        "Retry-After": String(retryAfter),
      },
    );
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("multipart/form-data;")) {
    return jsonResponse({ error: "Загрузите файл как multipart/form-data." }, 415);
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_MULTIPART_BYTES) {
    return jsonResponse(
      { error: "Файл слишком большой. Максимальный размер — 3 МБ." },
      413,
    );
  }

  try {
    const body = await request.formData();
    const file = body.get("file");
    if (!(file instanceof File)) {
      return jsonResponse({ error: "Добавьте файл в поле file." }, 400);
    }
    if (file.size === 0) {
      return jsonResponse({ error: "Файл пуст." }, 400);
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      return jsonResponse(
        { error: "Файл слишком большой. Максимальный размер — 3 МБ." },
        413,
      );
    }

    const format = documentFormat(file);
    const extracted = await extractFromFile(file, format);
    const normalized = normalizeText(extracted.text);
    if (!normalized) {
      return jsonResponse(
        { error: "В файле не найден текст. Сканированные PDF пока не поддерживаются." },
        422,
      );
    }

    const limited = limitText(normalized);
    return jsonResponse({
      ...limited,
      fileName: file.name.slice(0, 180),
      format,
      originalCharacters: normalized.length,
      ...("pages" in extracted && extracted.pages
        ? { pages: extracted.pages }
        : {}),
    });
  } catch (error) {
    if (error instanceof ExtractionError) {
      return jsonResponse({ error: error.message }, error.status);
    }
    return jsonResponse(
      { error: "Не удалось прочитать файл. Проверьте, что он не повреждён." },
      422,
    );
  }
}
