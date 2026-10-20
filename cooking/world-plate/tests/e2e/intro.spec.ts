import { expect, test } from "@playwright/test";

test("the intro holds the page until it is opened, then stays away for the session", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-intro-lock", "");
  await expect(page.locator(".wp-intro")).toBeVisible();

  // Scrolling opens it (the keyboard stands in for the wheel so this runs on the mobile project too).
  await page.keyboard.press("ArrowDown");
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
