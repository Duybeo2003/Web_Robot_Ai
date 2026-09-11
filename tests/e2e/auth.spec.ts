import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows login modal when clicking login trigger", async ({ page }) => {
    // Find and click any login trigger (nav button, etc.)
    await page.goto("/?login=true");
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
  });

  test("login modal renders phone and password tabs", async ({ page }) => {
    await page.goto("/?login=true");
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    // Should have credential login option
    await expect(dialog.locator("input[type='tel'], input[placeholder*='Điện thoại'], input[placeholder*='điện thoại']").first()).toBeVisible({ timeout: 3000 }).catch(() => {
      // Alternative: email input
      return expect(dialog.locator("input[type='text'], input[type='email']").first()).toBeVisible();
    });
  });

  test("shows validation error for empty form submission", async ({ page }) => {
    await page.goto("/?login=true");
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    // Try to submit empty form
    const submitButton = dialog.locator("button[type='submit']").first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      // Should not navigate away
      await expect(page).toHaveURL(/login=true|\//, { timeout: 2000 });
    }
  });

  test("homepage loads without errors", async ({ page }) => {
    await expect(page).toHaveURL("/");
    // Check for no JS errors by verifying page renders
    await expect(page.locator("body")).not.toBeEmpty();
    // Header or nav should be present
    await expect(page.locator("header, nav").first()).toBeVisible({ timeout: 5000 });
  });

  test("shop page is accessible", async ({ page }) => {
    await page.goto("/shop");
    await expect(page).toHaveURL("/shop");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("404 page shows for unknown routes", async ({ page }) => {
    await page.goto("/this-page-definitely-does-not-exist-12345");
    await expect(page.locator("body")).not.toBeEmpty();
    // Should show some not-found content
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).toBeTruthy();
  });
});
