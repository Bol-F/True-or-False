export const DOCUMENT_ACCEPT =
  ".txt,.md,.csv,.json,.pdf,.docx,text/plain,text/markdown,text/csv,application/json,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const MAX_DOCUMENT_BYTES = 3 * 1024 * 1024;

export interface ExtractedDocument {
  text: string;
  fileName: string;
  format: "text" | "pdf" | "docx";
  originalCharacters: number;
  truncated: boolean;
  pages?: number;
}

function isExtractedDocument(value: unknown): value is ExtractedDocument {
  if (!value || typeof value !== "object") return false;

  const payload = value as Record<string, unknown>;
  return (
    typeof payload.text === "string" &&
    payload.text.length > 0 &&
    payload.text.length <= 5_000 &&
    typeof payload.fileName === "string" &&
    payload.fileName.length > 0 &&
    (payload.format === "text" ||
      payload.format === "pdf" ||
      payload.format === "docx") &&
    typeof payload.originalCharacters === "number" &&
    Number.isSafeInteger(payload.originalCharacters) &&
    payload.originalCharacters >= payload.text.length &&
    typeof payload.truncated === "boolean" &&
    (typeof payload.pages === "undefined" ||
      (typeof payload.pages === "number" &&
        Number.isSafeInteger(payload.pages) &&
        payload.pages > 0))
  );
}

export async function extractDocumentText(file: File): Promise<ExtractedDocument> {
  if (file.size <= 0) {
    throw new Error("Файл пуст.");
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new Error("Файл слишком большой. Максимальный размер — 3 МБ.");
  }

  const formData = new FormData();
  formData.set("file", file);

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch("/api/extract", {
      method: "POST",
      body: formData,
      cache: "no-store",
      signal: controller.signal,
    });

    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        payload &&
        typeof payload === "object" &&
        "error" in payload &&
        typeof payload.error === "string"
          ? payload.error
          : "Не удалось прочитать файл.";
      throw new Error(message);
    }

    if (!isExtractedDocument(payload)) {
      throw new Error("Сервис вернул некорректный результат извлечения текста.");
    }

    return payload;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Чтение файла заняло слишком много времени.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
