import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Admin Dashboard', () => {
  test.describe.configure({ mode: 'serial' });

  const adminPhone = '+84999999888';
  let adminId: string;

  test.beforeAll(async () => {
    // Ensure admin user exists
    let adminUser = await prisma.user.findUnique({ where: { phoneNumber: adminPhone } });
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          phoneNumber: adminPhone,
          name: 'Test Admin',
          role: 'ADMIN',
        }
      });
    } else if (adminUser.role !== 'ADMIN') {
      adminUser = await prisma.user.update({
        where: { phoneNumber: adminPhone },
        data: { role: 'ADMIN' }
      });
    }
    adminId = adminUser.id;
  });

  test.afterAll(async () => {
    // Clean up
    await prisma.user.deleteMany({ where: { phoneNumber: adminPhone } });
  });

  test('should restrict access to non-admins', async ({ page }) => {
    // Log out first (clear cookies)
    await page.context().clearCookies();
    
    // Attempt to access admin page
    await page.goto('/admin');
    
    // Should be redirected to home page
    await expect(page).toHaveURL(/.*localhost:3000\/$/);
  });

  test('should allow access to admins', async ({ page }) => {
    // Log in as admin
    await page.goto('/');
    await page.locator('button', { hasText: 'Đăng nhập' }).click();
    await page.locator('input[placeholder="+84..."]').fill('0999999888');
    await page.locator('button', { hasText: 'Tiếp tục' }).click();

    await page.waitForTimeout(1000); // Wait for modal animation
    const otpInputs = page.locator('input');
    await otpInputs.last().pressSequentially('123456');

    const verifyBtn = page.locator('button', { hasText: 'Xác thực & Đăng nhập' });
    await expect(verifyBtn).toBeEnabled({ timeout: 10000 });
    await verifyBtn.click();

    // Wait for login to complete (modal closes or user is authenticated)
    await expect(page.locator('button', { hasText: 'Đăng xuất' })).toBeVisible({ timeout: 10000 });

    // Go to admin page
    await page.goto('/admin');
    try {
      await expect(page.locator('h1', { hasText: 'Bảng điều khiển' })).toBeVisible();
    } catch (e) {
      console.log("Current URL:", page.url());
      console.log("Body text:", await page.locator('body').innerText());
      throw e;
    }
    await expect(page.locator('h2', { hasText: 'Tổng quan' })).toBeVisible();
    
    // Go to orders page
    await page.locator('a', { hasText: 'Đơn hàng' }).click();
    await expect(page.locator('h2', { hasText: 'Đơn hàng' })).toBeVisible();
  });
});
