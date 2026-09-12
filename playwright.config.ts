import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    // 1. Saves admin auth state — runs when E2E_ADMIN_EMAIL/PASSWORD are set
    {
      name: "admin-setup",
      testMatch: "**/auth.setup.ts",
    },
    // 2. Standard tests (access control, static pages, shop, auth modal)
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: ["**/auth.setup.ts", "**/admin-crud.spec.ts"],
    },
    // 3. Admin CRUD tests — use auth state saved by admin-setup
    {
      name: "admin-crud",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/admin.json",
      },
      testMatch: "**/admin-crud.spec.ts",
      dependencies: ["admin-setup"],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
