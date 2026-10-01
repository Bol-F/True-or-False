import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

test("desktop analysis workflow and guidance", async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/");

  await expect(page).toHaveTitle(/RuFact/u);
  await expect(
    page.getByRole("heading", { name: /Проверьте текст/u }),
  ).toBeVisible();
  await expect(page.getByLabel("Русскоязычный текст для анализа")).toBeVisible();
  await expect(page.getByRole("switch", { name: /Второе мнение Gemini/u })).toBeVisible();

  await page.getByRole("button", { name: "Новость", exact: true }).click();
  await expect(page.getByLabel("Русскоязычный текст для анализа")).toHaveValue(
    /Росстата/u,
  );
  await page.getByRole("button", { name: /Проверить текст/u }).click();

  await expect(page.getByText("ML-модель", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("region", { name: /Результат: (?:REAL|FAKE)/u }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Копировать отчёт" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Скачать .txt" })).toBeVisible();

  await page.getByText("Что означает процент в результате?", { exact: true }).click();
  await expect(page.getByText(/Измеренная accuracy/u)).toBeVisible();

  if (process.env.CAPTURE_QA === "1") {
    await page.screenshot({
      path: join(tmpdir(), `rufact-${testInfo.project.name}.png`),
      fullPage: true,
    });
  }

  expect(consoleErrors).toEqual([]);
});

test("mobile layout, menu and FAQ navigation", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"), "Mobile-only check");

  await page.goto("/");
  await expect(page.getByRole("button", { name: "Открыть меню" })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(hasHorizontalOverflow).toBe(false);

  await page.getByRole("button", { name: "Открыть меню" }).click();
  const mobileNavigation = page.getByRole("navigation", {
    name: "Мобильная навигация",
  });
  await expect(mobileNavigation).toBeVisible();
  await mobileNavigation.getByRole("link", { name: "Вопросы и ответы" }).click();
  await expect(page).toHaveURL(/#questions$/u);
  await expect(page.getByRole("heading", { name: "Коротко о главном" })).toBeVisible();

  if (process.env.CAPTURE_QA === "1") {
    await page.screenshot({
      path: join(tmpdir(), `rufact-${testInfo.project.name}.png`),
      fullPage: true,
    });
  }
});

test("model page exposes measured errors and limitations", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("desktop"), "Desktop-only check");

  await page.goto("/model");
  await expect(page.getByRole("heading", { name: "О модели RuFact" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Где модель ошибается" })).toBeVisible();
  await expect(
    page.getByRole("table", { name: "Матрица ошибок для классов REAL и FAKE" }),
  ).toBeVisible();
  await expect(page.getByText("Сильные стороны", { exact: true })).toBeVisible();
  await expect(page.getByText("Ограничения", { exact: true })).toBeVisible();

  if (process.env.CAPTURE_QA === "1") {
    await page.screenshot({
      path: join(tmpdir(), "rufact-model-desktop.png"),
      fullPage: true,
    });
  }
});

test("optional live Gemini review renders validated claims", async ({ page }, testInfo) => {
  test.skip(
    process.env.LIVE_GEMINI_E2E !== "1" ||
      !testInfo.project.name.startsWith("desktop"),
    "Requires explicit live-provider opt-in",
  );
  test.setTimeout(30_000);

  await page.goto("/");
  const geminiSwitch = page.getByRole("switch", { name: /Второе мнение Gemini/u });
  await expect(geminiSwitch).toBeEnabled();
  await geminiSwitch.check();
  await page.getByRole("button", { name: /Проверить текст/u }).click();

  await expect(
    page.getByRole("region", { name: "Второе мнение Gemini", exact: true }),
  ).toBeVisible();
  await page.getByText("Утверждения в тексте", { exact: true }).click();
  const claims = page.getByRole("list", { name: "Утверждения Gemini" });
  await expect(claims).toBeVisible();
  expect(await claims.getByRole("listitem").count()).toBeGreaterThan(0);

  if (process.env.CAPTURE_QA === "1") {
    await page.screenshot({
      path: join(tmpdir(), "rufact-gemini-claims-desktop.png"),
      fullPage: true,
    });
  }
});
