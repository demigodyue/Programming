import { expect, test } from "@playwright/test";

// These flows are about the site itself; the first-visit intro has its own spec.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("wp-intro", "seen"));
});

test("search for a dish, open it and save it to favorites", async ({ page }) => {
  await page.goto("/recipes");
  await expect(page.getByRole("heading", { level: 1, name: "All recipes" })).toBeVisible();

  // Search (filtered in the browser, mirrored into the URL)
  await page.getByLabel("Search dishes, ingredients or cuisines").fill("momo");
  await expect(page).toHaveURL(/[?&]q=momo/);
  const results = page.getByRole("list").filter({ has: page.getByRole("article") });
  await expect(results.getByRole("article")).toHaveCount(1);

  // Open the recipe
  await results.getByRole("link", { name: "Chicken Momo" }).click();
  await expect(page).toHaveURL(/\/recipes\/chicken-momo\/?$/);
  await expect(page.getByRole("heading", { level: 1, name: "Chicken Momo" })).toBeVisible();

  // Save to favorites (button enables once this browser's saved state has been read)
  const save = page.getByRole("button", { name: "Save recipe" });
  await expect(save).toBeEnabled();
  await save.click();
  await expect(page.getByRole("button", { name: "Saved" })).toHaveAttribute("aria-pressed", "true");

  // It persists in this browser…
  await page.reload();
  await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();

  // …and shows up on the favorites page.
  await page.goto("/favorites");
  await expect(page.getByRole("heading", { level: 1, name: "Your favorites" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Chicken Momo" })).toBeVisible();
});
