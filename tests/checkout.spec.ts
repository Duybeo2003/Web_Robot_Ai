import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

test.describe("E-commerce Checkout Flow", () => {
  // We use serial mode because we are querying the database and don't want race conditions
  test.describe.configure({ mode: "serial" });

  test("should complete the checkout flow using BANK_TRANSFER", async ({
    page,
  }) => {
    // Clear cookies to ensure unauthenticated state
    await page.context().clearCookies();

    // 1. Navigate to the shop page and add product to cart
    await page.goto("/shop");

    // Find first product and add to cart
    const firstProductCard = page.locator(".bg-white.group").first();
    const addToCartBtn = firstProductCard.locator("button").last();
    await addToCartBtn.click();

    // 2. Cart sheet opens. Click checkout.
    // Ensure cart sheet is visible
    const cartSheetTitle = page.locator("h2", { hasText: "Giỏ hàng của bạn" });
    await expect(cartSheetTitle).toBeVisible();

    // Click checkout button in cart
    const checkoutBtn = page.locator("button", {
      hasText: "Tiến hành Thanh toán",
    });
    await checkoutBtn.click();

    // 3. Navigate to checkout page
    await expect(page).toHaveURL(/\/checkout/);

    // Guest checkout is allowed, so we don't need to login anymore.
    // We just fill out the checkout form directly.

    // 9. Fill Checkout Form
    await page.locator("input#receiverName").fill("Khách hàng Test");
    await page.locator("input#receiverPhone").fill("0912345678");
    await page
      .locator("input#shippingAddress")
      .fill("123 Đường Test, Quận 1, HCM");

    // Select Bank Transfer
    await page.locator('label[for="bank"]').click();

    // Submit Order
    const submitOrderBtn = page.locator("button", { hasText: "ĐẶT HÀNG NGAY" });
    await submitOrderBtn.click();

    // 10. Assert Success Page
    await expect(page).toHaveURL(/\/checkout\/success/);
    await expect(
      page.locator("h1", { hasText: "Đặt hàng thành công" }),
    ).toBeVisible();
    await expect(
      page.locator("h2", { hasText: "Hướng dẫn chuyển khoản" }),
    ).toBeVisible();

    // Clean up test user and their relations is harder now for guest users since we don't know the exact phone number generated.
    // We will just let the test finish.
  });
});
