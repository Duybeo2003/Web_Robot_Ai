import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('E-commerce Checkout Flow', () => {
  // We use serial mode because we are querying the database and don't want race conditions
  test.describe.configure({ mode: 'serial' });

  test('should complete the checkout flow using BANK_TRANSFER', async ({ page }) => {
    // Clear cookies to ensure unauthenticated state
    await page.context().clearCookies();

    // 1. Navigate to the shop page and add product to cart
    await page.goto('/shop');
    
    // Find first product and add to cart
    const firstProductCard = page.locator('.glass-card').first();
    const addToCartBtn = firstProductCard.locator('button').last(); 
    await addToCartBtn.click();

    // 2. Cart sheet opens. Click checkout.
    // Ensure cart sheet is visible
    const cartSheetTitle = page.locator('h2', { hasText: 'Giỏ hàng của bạn' });
    await expect(cartSheetTitle).toBeVisible();

    const checkoutBtn = page.locator('button', { hasText: 'Tiến hành Thanh toán' });
    await checkoutBtn.click();

    // 3. Since user is not logged in, they should see the login prompt on /checkout
    await expect(page).toHaveURL(/\/checkout/);
    
    // Debug output if needed
    console.log("Body text:", await page.locator('body').innerText());
    
    const loginPrompt = page.locator('h1', { hasText: 'Bạn cần đăng nhập' });
    await expect(loginPrompt).toBeVisible({ timeout: 10000 });

    // 4. Open Login Modal
    const loginBtn = page.locator('button', { hasText: 'Đăng nhập ngay' });
    await loginBtn.click();

    // 5. Fill Phone Number and send OTP
    const testPhone = '+84999999999';
    // Let's clean up any old OTPs or users first just in case
    await prisma.otpCode.deleteMany({ where: { phoneNumber: testPhone } });

    // The modal has an input for phone
    await page.locator('input[type="tel"]').fill(testPhone);
    
    const sendOtpBtn = page.locator('button', { hasText: 'Tiếp tục bằng số điện thoại' });
    await sendOtpBtn.click();

    // Wait a bit for the API to process and save OTP to database
    await page.waitForTimeout(1000);

    // 6. Query the database for the OTP
    const otpRecord = await prisma.otpCode.findFirst({
      where: { phoneNumber: testPhone },
      orderBy: { createdAt: 'desc' }
    });

    expect(otpRecord).not.toBeNull();
    const otpCode = otpRecord!.code;

    // The Shadcn InputOTP renders an invisible input for capturing typing.
    // We can focus the first slot or just use the last input field on the page
    const otpInputs = page.locator('input');
    await otpInputs.last().pressSequentially(otpCode);

    const verifyBtn = page.locator('button', { hasText: 'Xác thực & Đăng nhập' });
    await verifyBtn.click();

    // 8. After login, the page reloads or auth state updates
    try {
      await expect(page.locator('h1', { hasText: 'Thanh toán' })).toBeVisible({ timeout: 10000 });
    } catch (e) {
      console.log("Failed to find Thanh toán. Current URL:", page.url());
      console.log("Body text after reload:", await page.locator('body').innerText());
      const ls = await page.evaluate(() => window.localStorage.getItem('roboed-cart'));
      console.log("LocalStorage roboed-cart:", ls);
      throw e;
    }
    // 9. Fill Checkout Form
    await page.locator('input#receiverPhone').fill('0912345678');
    await page.locator('input#shippingAddress').fill('123 Đường Test, Quận 1, HCM');
    
    // Select Bank Transfer
    await page.locator('label[for="bank"]').click();

    // Submit Order
    const submitOrderBtn = page.locator('button', { hasText: 'Đặt hàng an toàn' });
    await submitOrderBtn.click();

    // 10. Assert Success Page
    await expect(page).toHaveURL(/\/checkout\/success/);
    await expect(page.locator('h1', { hasText: 'Đặt hàng thành công' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'Hướng dẫn chuyển khoản' })).toBeVisible();
    
    // Clean up test user and their relations
    const user = await prisma.user.findUnique({ where: { phoneNumber: testPhone } });
    if (user) {
      await prisma.orderItem.deleteMany({ where: { order: { userId: user.id } } });
      await prisma.order.deleteMany({ where: { userId: user.id } });
      await prisma.cartItem.deleteMany({ where: { cart: { userId: user.id } } });
      await prisma.cart.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
});
