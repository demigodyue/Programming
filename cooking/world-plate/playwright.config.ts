import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;
// A separate database so E2E runs never touch your dev data.
// BASE_PATH="" builds the static export for the URL root (and skips copying it to ../site).
// NEXT_PUBLIC_ACCOUNT_DEMO lets the account specs use the localStorage stand-in backend (lib/account/store.ts).
const env = { DATABASE_URL: "file:db/e2e.db", NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`, BASE_PATH: "", NEXT_PUBLIC_ACCOUNT_DEMO: "1" };

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npm run db:setup && npx next build && node scripts/serve-static.mjs out ${PORT}`,
    url: `http://localhost:${PORT}`,
    env,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
  },
});
