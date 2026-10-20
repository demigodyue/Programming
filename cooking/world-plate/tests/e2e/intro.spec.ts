import { expect, test } from "@playwright/test";

test("the intro holds the page until it is opened, then stays away for the session", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-intro-lock", "");
  await expect(page.locator(".wp-intro")).toBeVisible();

  // It only moves with the scroll: left alone it stays shut.
  await page.waitForTimeout(1500);
  await expect(html).toHaveAttribute("data-intro-lock", "");
  // Scrolling steps it open (the keys stand in for the wheel so this runs on the mobile project too).
  await page.keyboard.press("PageDown");
  await expect(page.locator(".wp-intro")).not.toHaveCSS("--q", "0");
  await expect(html).toHaveAttribute("data-intro-lock", "");
  for (let i = 0; i < 3; i++) await page.keyboard.press("PageDown");
  await expect(html).not.toHaveAttribute("data-intro-lock");
  await expect(page.locator(".wp-intro")).toBeHidden();
  await expect(page.getByRole("heading", { level: 1, name: /Cook the dishes/ })).toBeVisible();

  // Seen once: a reload goes straight to the page.
  await page.reload();
  await expect(html).not.toHaveAttribute("data-intro-lock");
  await expect(page.locator(".wp-intro")).toBeHidden();
});

test("reduced motion skips the intro", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveAttribute("data-intro-lock");
  await expect(page.locator(".wp-intro")).toBeHidden();
  await context.close();
});
