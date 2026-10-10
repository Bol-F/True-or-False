import { expect, test } from "@playwright/test";
import { join } from "node:path";
import { tmpdir } from "node:os";

test("reading size persists and mobile controls stay usable", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(page).toHaveTitle(/RuFact/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const mobile = testInfo.project.name.startsWith("mobile");
  const input = page.locator("#analysis-text");
  const originalSize = await input.evaluate(element => parseFloat(getComputedStyle(element).fontSize));
  if (mobile) {
    expect(originalSize).toBeGreaterThanOrEqual(16);
    await page.getByRole("button", { name: "Menyuni ochish" }).click();
  }
  await page.getByRole("button", { name: "Matn o‘lchami: Juda katta", exact: true }).first().click();
  await expect.poll(() => input.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThan(originalSize);
  if (mobile) {
    await expect(page.locator("#mobile-navigation").getByRole("button", { name: "Matn o‘lchami: Juda katta", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.screenshot({ path: join(tmpdir(), "rufact-reading-mobile-menu.png") });
    await page.getByRole("button", { name: "Menyuni yopish" }).click();
  }
  await input.fill("O‘zbekiston poytaxti Toshkent. Ўзбекистон пойтахти Тошкент.");
  await expect(input).toHaveValue(/Ўзбекистон/);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-text-size", "larger");
  await expect.poll(() => input.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThan(originalSize);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  if (mobile) {
    expect(await input.evaluate(element => element.getBoundingClientRect().right <= innerWidth)).toBe(true);
  }
  await page.locator("#analysis-text").scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(tmpdir(), `rufact-reading-${testInfo.project.name}.png`) });
  await page.goto("/model");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  if (mobile) {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-text-size", "larger");
    await expect.poll(() => input.evaluate(element => element.getBoundingClientRect().right <= innerWidth)).toBe(true);
    await input.scrollIntoViewIfNeeded();
    expect(await page.locator(".paper-shell").evaluate(element => element.scrollLeft)).toBe(0);
    await page.screenshot({ path: join(tmpdir(), "rufact-reading-narrow-mobile.png") });
  }
  expect(errors).toEqual([]);
});
