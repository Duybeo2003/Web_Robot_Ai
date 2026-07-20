import { test, expect } from '@playwright/test';

test.describe('E-commerce Shopping Flow', () => {
  test('should load products from database and open Cart Sheet when adding to cart', async ({ page }) => {
    // 1. Navigate to the shop page
    await page.goto('http://localhost:3000/shop');

    // Wait for the page to load and ensure products are displayed
    await expect(page.locator('h1')).toHaveText('Tất Cả Sản Phẩm');

    // 2. Assert that products are loaded
    const productCards = page.locator('.bg-white.group');
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });
    
    // 3. Click "Add to Cart" on the first product card
    const firstProductCard = productCards.first();
    const productTitle = await firstProductCard.locator('h3').innerText();
    const addToCartBtn = firstProductCard.locator('button').last(); // Assuming it's the last button in the card
    
    await addToCartBtn.click();

    // 4. Assert that the CartSheet opens and displays the correct item
    // The CartSheet has a title "Giỏ hàng của bạn"
    const cartSheetTitle = page.locator('h2', { hasText: 'Giỏ hàng của bạn' });
    await expect(cartSheetTitle).toBeVisible();

    // Check if the product title appears inside the Cart Sheet
    const cartItemTitle = page.locator('.sm\\:max-w-md a', { hasText: productTitle });
    await expect(cartItemTitle).toBeVisible();

    // Check if the quantity is correctly displayed as 1
    const quantityText = page.locator('.sm\\:max-w-md span', { hasText: '1' }).first();
    await expect(quantityText).toBeVisible();
  });
});
