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
  await expect(page.getByText("Бета-версия", { exact: true })).toHaveCount(0);

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

test("result actions and feedback dialog work", async ({ page, context }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("desktop"), "Desktop-only check");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
  });

  await page.goto("/");
  const actions = page.getByRole("region", { name: "Действия с результатом" });

  await actions.getByRole("button", { name: "Копировать отчёт" }).click();
  await expect(actions.getByRole("status")).toContainText("Отчёт скопирован");

  const downloadPromise = page.waitForEvent("download");
  await actions.getByRole("button", { name: "Скачать .txt" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^rufact-\d{4}-\d{2}-\d{2}\.txt$/u);
  await expect(actions.getByRole("status")).toContainText("сохранён на устройство");

  await actions.getByRole("button", { name: "Поделиться" }).click();
  await expect(actions.getByRole("status")).toContainText(
    "Системное меню недоступно — отчёт скопирован",
  );

  await page.getByRole("button", { name: "Обратная связь" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Обратная связь" });
  await expect(dialog).toBeVisible();
  const githubLink = dialog.getByRole("link", { name: /Открыть форму на GitHub/u });
  await expect(githubLink).toHaveAttribute("aria-disabled", "true");
  await dialog.getByLabel("Сообщение").fill(
    "Кнопка работает, но я хочу предложить улучшение интерфейса.",
  );
  await expect(githubLink).toHaveAttribute("href", /github\.com\/Bol-F\/True-or-False\/issues\/new/u);
  await dialog.getByRole("button", { name: "Скопировать" }).click();
  await expect(dialog.getByRole("status")).toContainText("Сообщение скопировано");

  if (process.env.CAPTURE_QA === "1") {
    await page.screenshot({
      path: join(tmpdir(), "rufact-feedback-desktop.png"),
      fullPage: false,
    });
  }

  await dialog.getByRole("button", { name: "Закрыть обратную связь" }).click();
  await expect(dialog).toBeHidden();

  await actions.getByRole("button", { name: "Сообщить об ошибке" }).click();
  await expect(dialog).toBeVisible();
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
  await expect(page.getByText("Бета-версия", { exact: true })).toHaveCount(0);
  await mobileNavigation.getByRole("button", { name: "Обратная связь" }).click();
  const feedbackDialog = page.getByRole("dialog", { name: "Обратная связь" });
  await expect(feedbackDialog).toBeVisible();
  await feedbackDialog.getByRole("button", { name: "Закрыть обратную связь" }).click();

  await page.getByRole("button", { name: "Открыть меню" }).click();
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
  await expect(
    page.getByRole("heading", { name: "Accuracy на внешней выборке: 81%" }),
  ).toBeVisible();
  await expect(page.getByText(/tfidf-word-char-logreg-ru-v2/u)).toBeVisible();
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
