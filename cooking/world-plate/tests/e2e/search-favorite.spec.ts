import { expect, test } from "@playwright/test";

test("search for a dish, open it and save it to favorites", async ({ page }) => {
  await page.goto("/recipes");
  await expect(page.getByRole("heading", { level: 1, name: "All recipes" })).toBeVisible();

  // Search (filtered in the browser, mirrored into the URL)
  await page.getByLabel("Search dishes, ingredients or countries").fill("chicken momo");
  await expect(page).toHaveURL(/[?&]q=chicken\+momo/);
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

test("searching by country finds that country's dishes, in English or Japanese", async ({ page }) => {
  await page.goto("/recipes");
  const search = page.getByLabel("Search dishes, ingredients or countries");
  const results = page.getByRole("list").filter({ has: page.getByRole("article") });
  await search.fill("Nepal");
  await expect(results.getByRole("article")).toHaveCount(6);
  await expect(results.getByRole("link", { name: "Sel Roti" })).toBeVisible();
  await search.fill("ネパール");
  await expect(results.getByRole("article")).toHaveCount(6);
  // Other names for a country, and the city a dish comes from.
  await search.fill("Lebanon");
  await expect(results.getByRole("link", { name: "Silky Hummus" })).toBeVisible();
  await search.fill("Osaka");
  await expect(results.getByRole("link", { name: "Okonomiyaki" })).toBeVisible();
});

test("the header search box offers a country's whole cuisine page", async ({ page }) => {
  await page.goto("/recipes/croissants");
  await page.getByRole("button", { name: "Search recipes" }).click();
  const box = page.getByRole("combobox", { name: "Search recipes" });
  await box.fill("Japan");
  await expect(page.getByRole("option").first()).toContainText("All Japanese dishes");
  await box.press("ArrowDown");
  await box.press("Enter");
  await expect(page).toHaveURL(/\/cuisine\/japanese\/?$/);
});

test("the header search box finds a dish as you type and opens it", async ({ page }) => {
  await page.goto("/recipes/croissants");
  await page.getByRole("button", { name: "Search recipes" }).click();
  const box = page.getByRole("combobox", { name: "Search recipes" });
  await expect(box).toBeFocused();
  await box.fill("pho");
  await expect(page.getByRole("option")).toHaveCount(1);
  await box.press("ArrowDown");
  await box.press("Enter");
  await expect(page).toHaveURL(/\/recipes\/pho-bo\/?$/);

  // Enter with nothing picked runs the full search on /recipes.
  await page.keyboard.press("Control+k");
  await box.fill("curry");
  await box.press("Enter");
  await expect(page).toHaveURL(/\/recipes\/?\?q=curry/);
});
