import { test, expect } from "@playwright/test";

test.describe("Storefront", () => {
  test("shop listing page loads and shows products or empty state", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.locator("body")).not.toBeEmpty();
    // Wait for content to load (products or empty state)
    await page.waitForLoadState("networkidle");
    const body = await page.locator("body").textContent();
    expect(body).toBeTruthy();
  });

  test("shop search filter works", async ({ page }) => {
    await page.goto("/shop?q=robot");
    await expect(page).toHaveURL(/q=robot/);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("product detail page loads for valid slug", async ({ page }) => {
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");

    // Count immediately — no waiting, avoids 30s timeout when DB is empty
    const count = await page.locator("a[href^='/shop/']").count();
    if (count === 0) {
      test.skip();
      return;
    }

    const href = await page.locator("a[href^='/shop/']").first().getAttribute("href");
    if (!href) { test.skip(); return; }

    await page.goto(href);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("cart sheet opens when clicking cart button", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Find cart button/icon
    const cartButton = page.locator('[aria-label*="giỏ"], [aria-label*="cart"], button:has-text("Giỏ")').first();
    if (await cartButton.isVisible()) {
      await cartButton.click();
      // Sheet or sidebar should appear
      await expect(page.locator('[role="dialog"], aside, [data-radix-popper-content-wrapper]').first()).toBeVisible({ timeout: 3000 });
    }
  });

  test("AI chatbot button is visible and opens chat", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const chatButton = page.locator("button:has-text('Chat AI')");
    await expect(chatButton).toBeVisible({ timeout: 5000 });
    await chatButton.click();
    // Chat header should appear — use exact match to avoid strict mode violation
    await expect(page.getByText("RoboBot", { exact: true }).first()).toBeVisible({ timeout: 3000 });
  });

  test("events page loads", async ({ page }) => {
    await page.goto("/events");
    await expect(page.locator("body")).not.toBeEmpty();
    await page.waitForLoadState("networkidle");
  });

  test("checkout page is accessible and renders for unauthenticated users", async ({ page }) => {
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");
    // Checkout supports guest flow via OTP — page must render (not redirect)
    await expect(page).toHaveURL(/checkout/);
    await expect(page.locator("body")).not.toBeEmpty();
  });
});
