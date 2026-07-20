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
    await page.locator('button[title="Đăng nhập"]').click();
    
    // Switch to OTP login method
    const otpSwitchBtn = page.locator('button', { hasText: 'Đăng nhập bằng OTP (SĐT)' });
    await expect(otpSwitchBtn).toBeVisible({ timeout: 5000 });
    await otpSwitchBtn.click();
    
    await page.locator('input[type="tel"]').fill('0999999888');
    await page.locator('button', { hasText: 'Tiếp tục bằng SĐT' }).click();

    await page.waitForTimeout(1000); // Wait for modal animation
    const otpInputs = page.locator('input');
    await otpInputs.last().pressSequentially('123456');

    const verifyBtn = page.locator('button', { hasText: 'Xác nhận' });
    await expect(verifyBtn).toBeEnabled({ timeout: 10000 });
    await verifyBtn.click();

    // Wait for login to complete (modal closes or user is authenticated)
    await expect(page.locator('button[title="Tài khoản"]')).toBeVisible({ timeout: 10000 });

    // Go to admin page
    await page.goto('/admin');
    await expect(page.locator('h2', { hasText: 'Tổng quan' })).toBeVisible({ timeout: 10000 });
    
    // Go to orders page
    await page.locator('a', { hasText: 'Đơn hàng' }).click();
    await expect(page.locator('h2', { hasText: 'Đơn hàng' })).toBeVisible();
  });
});
