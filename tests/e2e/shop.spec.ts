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
    // First get a product slug from the shop listing
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");

    const productLink = page.locator("a[href^='/shop/']").first();
    const href = await productLink.getAttribute("href").catch(() => null);

    if (href) {
      await page.goto(href);
      await expect(page.locator("body")).not.toBeEmpty();
      await page.waitForLoadState("networkidle");
    } else {
      // No products yet — skip gracefully
      test.skip();
    }
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
    // Chat window should appear
    await expect(page.locator("text=RoboBot")).toBeVisible({ timeout: 3000 });
  });

  test("events page loads", async ({ page }) => {
    await page.goto("/events");
    await expect(page.locator("body")).not.toBeEmpty();
    await page.waitForLoadState("networkidle");
  });

  test("checkout redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");
    // Should redirect to login or show login modal
    const url = page.url();
    const body = await page.locator("body").textContent();
    // Either redirected or shows auth modal/prompt
    expect(url.includes("login") || url.includes("auth") || body?.toLowerCase().includes("đăng nhập")).toBeTruthy();
  });
});
