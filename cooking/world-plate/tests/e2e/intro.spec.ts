import { expect, test } from "@playwright/test";

test("the home page intro waits for the scroll, then opens with it", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  const intro = page.locator(".wp-intro");
  await expect(html).toHaveAttribute("data-intro-lock", "");
  await expect(intro).toBeVisible();

  // Left alone it stays.
  await page.waitForTimeout(3000);
  await expect(intro).toBeVisible();

  // Scrolling steps it open (keys stand in for the wheel so this runs on the mobile project too).
  await page.keyboard.press("PageDown");
  await expect(html).toHaveAttribute("data-intro-lock", "");
  for (let i = 0; i < 3; i++) await page.keyboard.press("PageDown");
  await expect(html).not.toHaveAttribute("data-intro-lock");
  await expect(intro).toBeHidden();
  await expect(page.getByRole("heading", { level: 1, name: /Cook the dishes/ })).toBeVisible();
});

test("other pages and reduced motion skip the intro", async ({ page, browser }) => {
  await page.goto("/recipes");
  await expect(page.locator("html")).not.toHaveAttribute("data-intro-lock");
  await expect(page.locator(".wp-intro")).toBeHidden();

  const context = await browser.newContext({ reducedMotion: "reduce" });
  const reduced = await context.newPage();
  await reduced.goto("/");
  await expect(reduced.locator("html")).not.toHaveAttribute("data-intro-lock");
  await expect(reduced.locator(".wp-intro")).toBeHidden();
  await context.close();
});
