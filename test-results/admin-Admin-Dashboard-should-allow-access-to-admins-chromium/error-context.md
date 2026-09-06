# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> Admin Dashboard >> should allow access to admins
- Location: tests\admin.spec.ts:48:7

# Error details

```
Error: expect(locator).toBeEnabled() failed

Locator:  locator('button').filter({ hasText: 'Xác nhận' })
Expected: enabled
Received: disabled
Timeout:  10000ms

Call log:
  - Expect "toBeEnabled" with timeout 10000ms
  - waiting for locator('button').filter({ hasText: 'Xác nhận' })
    12 × locator resolved to <button disabled tabindex="0" type="submit" data-disabled="" data-slot="button" class="group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:bord…>Xác nhận</button>
       - unexpected value "disabled"

```

```yaml
- button "Xác nhận" [disabled]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { PrismaClient } from "@prisma/client";
  3  | 
  4  | const prisma = new PrismaClient();
  5  | 
  6  | test.describe("Admin Dashboard", () => {
  7  |   test.describe.configure({ mode: "serial" });
  8  | 
  9  |   const adminPhone = "+84999999888";
  10 | 
  11 |   test.beforeAll(async () => {
  12 |     // Ensure admin user exists
  13 |     let adminUser = await prisma.user.findUnique({
  14 |       where: { phoneNumber: adminPhone },
  15 |     });
  16 |     if (!adminUser) {
  17 |       adminUser = await prisma.user.create({
  18 |         data: {
  19 |           phoneNumber: adminPhone,
  20 |           name: "Test Admin",
  21 |           role: "ADMIN",
  22 |         },
  23 |       });
  24 |     } else if (adminUser.role !== "ADMIN") {
  25 |       adminUser = await prisma.user.update({
  26 |         where: { phoneNumber: adminPhone },
  27 |         data: { role: "ADMIN" },
  28 |       });
  29 |     }
  30 |   });
  31 | 
  32 |   test.afterAll(async () => {
  33 |     // Clean up
  34 |     await prisma.user.deleteMany({ where: { phoneNumber: adminPhone } });
  35 |   });
  36 | 
  37 |   test("should restrict access to non-admins", async ({ page }) => {
  38 |     // Log out first (clear cookies)
  39 |     await page.context().clearCookies();
  40 | 
  41 |     // Attempt to access admin page
  42 |     await page.goto("/admin");
  43 | 
  44 |     // Should be redirected to home page
  45 |     await expect(page).toHaveURL(/.*localhost:3000\/$/);
  46 |   });
  47 | 
  48 |   test("should allow access to admins", async ({ page }) => {
  49 |     // Log in as admin
  50 |     await page.goto("/");
  51 |     await page.locator('button[title="Đăng nhập"]').click();
  52 | 
  53 |     // Switch to OTP login method
  54 |     const otpSwitchBtn = page.locator("button", {
  55 |       hasText: "Đăng nhập bằng OTP (SĐT)",
  56 |     });
  57 |     await expect(otpSwitchBtn).toBeVisible({ timeout: 5000 });
  58 |     await otpSwitchBtn.click();
  59 | 
  60 |     await page.locator('input[type="tel"]').fill("0999999888");
  61 |     await page.locator("button", { hasText: "Tiếp tục bằng SĐT" }).click();
  62 | 
  63 |     await page.waitForTimeout(1000); // Wait for modal animation
  64 |     const otpInputs = page.locator("input");
  65 |     await otpInputs.last().pressSequentially("123456");
  66 | 
  67 |     const verifyBtn = page.locator("button", { hasText: "Xác nhận" });
> 68 |     await expect(verifyBtn).toBeEnabled({ timeout: 10000 });
     |                             ^ Error: expect(locator).toBeEnabled() failed
  69 |     await Promise.all([page.waitForNavigation(), verifyBtn.click()]);
  70 | 
  71 |     // Wait for login to complete (modal closes or user is authenticated)
  72 |     await expect(page.locator('button[title="Tài khoản"]')).toBeVisible({
  73 |       timeout: 10000,
  74 |     });
  75 | 
  76 |     // Go to admin page
  77 |     await page.goto("/admin");
  78 |     await expect(page.locator("h2", { hasText: "Tổng quan" })).toBeVisible({
  79 |       timeout: 10000,
  80 |     });
  81 | 
  82 |     // Go to orders page
  83 |     await page.locator("a", { hasText: "Đơn hàng" }).click();
  84 |     await expect(page.locator("h2", { hasText: "Đơn hàng" })).toBeVisible();
  85 |   });
  86 | });
  87 | 
```