import { expect, test } from "@playwright/test";

test("internal links swing to the next page with a client-side view transition", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /Cook the dishes/ })).toBeVisible();
  // Wait for hydration: the page-swing click handler is attached by then.
  await expect(page.locator("main [data-reveal][data-observed], main [data-reveal][data-in]").first()).toBeAttached();

  // A marker that only survives a client-side navigation (a full page load would wipe it).
  await page.evaluate(() => ((window as unknown as { __swing: boolean }).__swing = true));

  await page.getByRole("link", { name: "Browse recipes" }).first().click();
  // The new page waits for the swing: its load clock is pushed back while the transition runs.
  await expect(page.locator("html")).toHaveAttribute("data-load", "swing");
  await expect(page).toHaveURL(/\/recipes\/?$/);
  await expect(page.getByRole("heading", { level: 1, name: "All recipes" })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __swing?: boolean }).__swing)).toBe(true);
});

test("reduced motion swaps the swing for a crossfade", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("main [data-reveal][data-observed], main [data-reveal][data-in]").first()).toBeAttached();
  await page.getByRole("link", { name: "Browse recipes" }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-load", "fade");
  await expect(page.getByRole("heading", { level: 1, name: "All recipes" })).toBeVisible();
  await context.close();
});
