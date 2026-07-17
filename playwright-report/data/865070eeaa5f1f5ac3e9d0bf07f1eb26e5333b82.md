# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> Admin Dashboard >> should allow access to admins
- Location: tests\admin.spec.ts:48:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button').filter({ hasText: 'Đăng nhập' })

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { PrismaClient } from '@prisma/client';
  3  | 
  4  | const prisma = new PrismaClient();
  5  | 
  6  | test.describe('Admin Dashboard', () => {
  7  |   test.describe.configure({ mode: 'serial' });
  8  | 
  9  |   const adminPhone = '+84999999888';
  10 |   let adminId: string;
  11 | 
  12 |   test.beforeAll(async () => {
  13 |     // Ensure admin user exists
  14 |     let adminUser = await prisma.user.findUnique({ where: { phoneNumber: adminPhone } });
  15 |     if (!adminUser) {
  16 |       adminUser = await prisma.user.create({
  17 |         data: {
  18 |           phoneNumber: adminPhone,
  19 |           name: 'Test Admin',
  20 |           role: 'ADMIN',
  21 |         }
  22 |       });
  23 |     } else if (adminUser.role !== 'ADMIN') {
  24 |       adminUser = await prisma.user.update({
  25 |         where: { phoneNumber: adminPhone },
  26 |         data: { role: 'ADMIN' }
  27 |       });
  28 |     }
  29 |     adminId = adminUser.id;
  30 |   });
  31 | 
  32 |   test.afterAll(async () => {
  33 |     // Clean up
  34 |     await prisma.user.deleteMany({ where: { phoneNumber: adminPhone } });
  35 |   });
  36 | 
  37 |   test('should restrict access to non-admins', async ({ page }) => {
  38 |     // Log out first (clear cookies)
  39 |     await page.context().clearCookies();
  40 |     
  41 |     // Attempt to access admin page
  42 |     await page.goto('/admin');
  43 |     
  44 |     // Should be redirected to home page
  45 |     await expect(page).toHaveURL(/.*localhost:3000\/$/);
  46 |   });
  47 | 
  48 |   test('should allow access to admins', async ({ page }) => {
  49 |     // Log in as admin
  50 |     await page.goto('/');
> 51 |     await page.locator('button', { hasText: 'Đăng nhập' }).click();
     |                                                            ^ Error: locator.click: Test timeout of 30000ms exceeded.
  52 |     await page.locator('input[placeholder="+84..."]').fill('0999999888');
  53 |     await page.locator('button', { hasText: 'Tiếp tục' }).click();
  54 | 
  55 |     await page.waitForTimeout(1000); // Wait for modal animation
  56 |     const otpInputs = page.locator('input');
  57 |     await otpInputs.last().pressSequentially('123456');
  58 | 
  59 |     const verifyBtn = page.locator('button', { hasText: 'Xác thực & Đăng nhập' });
  60 |     await expect(verifyBtn).toBeEnabled({ timeout: 10000 });
  61 |     await verifyBtn.click();
  62 | 
  63 |     // Wait for login to complete (modal closes or user is authenticated)
  64 |     await expect(page.locator('button', { hasText: 'Đăng xuất' })).toBeVisible({ timeout: 10000 });
  65 | 
  66 |     // Go to admin page
  67 |     await page.goto('/admin');
  68 |     try {
  69 |       await expect(page.locator('h1', { hasText: 'Bảng điều khiển' })).toBeVisible();
  70 |     } catch (e) {
  71 |       console.log("Current URL:", page.url());
  72 |       console.log("Body text:", await page.locator('body').innerText());
  73 |       throw e;
  74 |     }
  75 |     await expect(page.locator('h2', { hasText: 'Tổng quan' })).toBeVisible();
  76 |     
  77 |     // Go to orders page
  78 |     await page.locator('a', { hasText: 'Đơn hàng' }).click();
  79 |     await expect(page.locator('h2', { hasText: 'Đơn hàng' })).toBeVisible();
  80 |   });
  81 | });
  82 | 
```