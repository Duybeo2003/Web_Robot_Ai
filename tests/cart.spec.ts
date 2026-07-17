import { test, expect } from '@playwright/test';

test.describe('E-commerce Shopping Flow', () => {
  test('should load products from database and open Cart Sheet when adding to cart', async ({ page }) => {
    // 1. Navigate to the shop page
    await page.goto('http://localhost:3000/shop');

    // Wait for the page to load and ensure products are displayed
    await expect(page.locator('h1')).toHaveText('Cửa hàng');

    // 2. Assert that products (Nutrition and Robot AI) are loaded
    // We look for specific product titles based on our seed data
    const robotProduct = page.locator('h3', { hasText: 'Robot AI Desktop Assistant' });
    const nutritionProduct = page.locator('h3', { hasText: 'Bữa ăn thay thế tiện lợi (Vị Cacao)' });
    
    await expect(robotProduct).toBeVisible();
    await expect(nutritionProduct).toBeVisible();

    // 3. Click "Add to Cart" on the first product card
    // Note: In our current UI, the "Add to Cart" button on the Shop page has a ShoppingCart icon.
    // We will target the first "Add to Cart" button in the product grid.
    const firstProductCard = page.locator('.glass-card').first();
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
