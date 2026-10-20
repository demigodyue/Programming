import { expect, test, type Page } from "@playwright/test";

// The field's label carries both languages (one hidden), so match the accessible name instead of the label text.
const password = (page: Page) => page.getByRole("textbox", { name: "Password", exact: true });

test("the language button switches the whole page to Japanese and back, and the choice sticks", async ({ page }) => {
  await page.goto("/recipes/katsu-curry");
  await expect(page.getByRole("heading", { level: 1, name: "Katsu Curry" })).toBeVisible();

  await page.getByRole("button", { name: "日本語に切り替え" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.getByRole("heading", { level: 1, name: "カツカレー" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "材料" })).toBeVisible();
  await expect(page.getByText("サラダ油", { exact: false }).first()).toBeVisible();

  // Another page, still Japanese — no flash of English on load (set before first paint).
  await page.goto("/recipes");
  await expect(page.getByRole("heading", { level: 1, name: "すべてのレシピ" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "All recipes" })).toBeHidden();

  // Japanese search works too.
  await page.getByLabel("料理名・材料・国で検索").fill("ラーメン");
  await expect(page.getByRole("list").filter({ has: page.getByRole("article") }).getByRole("article")).toHaveCount(1);

  await page.getByRole("button", { name: "Switch to English" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "All recipes" })).toBeVisible();
});

test("ticking ingredients fills the pot, and a step's timer counts down", async ({ page }) => {
  await page.goto("/recipes/okonomiyaki");
  const boxes = page.locator('[data-ing] input[type="checkbox"]');
  const total = await boxes.count();
  // Click through to React's handler directly: the visible box is a styled span over a screen-reader-only input.
  for (let i = 0; i < total; i++) await boxes.nth(i).evaluate((el: HTMLInputElement) => el.click());
  await expect(page.getByText("Everything's in the pot. Time to cook!")).toBeVisible();
  await expect(page.locator(".mise-pot")).toHaveAttribute("data-full", "true");

  const timer = page.getByRole("button", { name: "Start a timer" }).first();
  await timer.click();
  await expect(page.getByRole("button", { name: /^Pause timer, \d+:\d\d left$/ })).toBeVisible();
});

test("create an account, save a recipe, sign out and find it again after signing in", async ({ page }) => {
  // No Firebase project in tests: the localStorage stand-in backend (lib/account/demo-backend.ts).
  await page.addInitScript(() => localStorage.setItem("wp-account-demo", "1"));
  await page.goto("/account");

  await page.getByRole("radio", { name: "Create account" }).click();
  await page.getByLabel("Your name").fill("Aiko");
  await page.getByLabel("Email").fill("aiko@example.com");
  await password(page).fill("short");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.locator("form [role=alert]")).toContainText("at least 6 characters");

  await password(page).fill("dumplings");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Hello, Aiko" })).toBeVisible();

  await page.goto("/recipes/pho-bo");
  const save = page.getByRole("button", { name: "Save recipe" });
  await expect(save).toBeEnabled();
  await save.click();
  await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();

  await page.goto("/favorites");
  await expect(page.getByText("Saved to your account")).toBeVisible();
  await expect(page.getByRole("link", { name: "Phở Bò" })).toBeVisible();

  // Signing out clears this browser's copy…
  await page.goto("/account");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("radio", { name: "Sign in" })).toBeVisible();
  await page.goto("/favorites");
  await expect(page.getByText("Nothing saved yet.")).toBeVisible();

  // …a wrong password is refused…
  await page.goto("/account");
  await page.getByLabel("Email").fill("aiko@example.com");
  await password(page).fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).last().click();
  await expect(page.locator("form [role=alert]")).toContainText("don't match");

  // …and signing in brings the favourites back from the account.
  await password(page).fill("dumplings");
  await page.getByRole("button", { name: "Sign in" }).last().click();
  await expect(page.getByRole("heading", { name: "Hello, Aiko" })).toBeVisible();
  await page.goto("/favorites");
  await expect(page.getByRole("link", { name: "Phở Bò" })).toBeVisible();
});
