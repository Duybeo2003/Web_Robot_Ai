import { test as setup, expect } from "@playwright/test";
import path from "path";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const authFile = path.join(__dirname, "../../playwright/.auth/admin.json");

/**
 * Logs in as admin and saves auth state for admin-crud tests.
 * Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD environment variables.
 * Skip gracefully if credentials are not provided.
 */
setup("admin login", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;

  if (!email || !password) {
    // Write empty auth state so dependent tests can still be skipped gracefully
    await page.context().storageState({ path: authFile });
    setup.skip(true, "E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD not set — admin CRUD tests skipped");
    return;
  }

  // Open login modal
  await page.goto("/?login=true");
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible({ timeout: 8000 });

  // Default is password tab — fill in credentials
  await dialog.locator("#email").fill(email);
  await dialog.locator("#password").fill(password);
  await dialog.locator("button[type='submit']").click();

  // Wait for modal to close (successful login)
  await expect(dialog).not.toBeVisible({ timeout: 10000 });

  // Verify session by checking for admin link in dropdown
  await page.locator('[title="Tài khoản"]').click();
  await expect(page.getByText("Bảng điều khiển")).toBeVisible({ timeout: 5000 });

  // Save auth state
  await page.context().storageState({ path: authFile });
});
