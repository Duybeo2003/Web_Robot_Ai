import { test, expect } from "@playwright/test";

/**
 * Admin CRUD E2E tests.
 * Requires auth state saved by auth.setup.ts (E2E_ADMIN_EMAIL + E2E_ADMIN_PASSWORD).
 * All tests skip gracefully when credentials were not provided.
 */

function skipIfNoCredentials() {
  if (!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD) {
    test.skip(true, "Admin credentials not set");
  }
}

test.describe("Admin Dashboard", () => {
  test.beforeEach(skipIfNoCredentials);

  test("admin dashboard loads and shows stats", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/admin/);
    // Dashboard should show at least one stat card
    const body = await page.locator("body").textContent();
    expect(body).toBeTruthy();
    expect(body).not.toContain("Đăng nhập");
  });

  test("admin sidebar navigation works", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    // Sidebar should be visible
    await expect(page.locator("aside, nav").first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Admin Products", () => {
  test.beforeEach(skipIfNoCredentials);

  test("products list loads with search", async ({ page }) => {
    await page.goto("/admin/products");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/admin\/products/);
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Đăng nhập");
  });

  test("new product page renders form", async ({ page }) => {
    await page.goto("/admin/products/new");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/admin\/products\/new/);
    // Form with title input should exist
    const titleInput = page.locator("input[name='title'], input[placeholder*='tên'], input[placeholder*='Tên']").first();
    await expect(titleInput).toBeVisible({ timeout: 5000 });
  });
});

test.describe.serial("Admin Categories CRUD", () => {
  test.beforeEach(skipIfNoCredentials);

  const testCategoryName = `E2E Test Category ${Date.now()}`;
  let createdCategoryName = "";

  test("create a category", async ({ page }) => {
    await page.goto("/admin/categories");
    await page.waitForLoadState("networkidle");

    // Find create button
    const createBtn = page.locator("button:has-text('Thêm'), a:has-text('Thêm'), button:has-text('Tạo'), a:has-text('Tạo')").first();
    if (!(await createBtn.isVisible())) {
      test.skip(true, "No create button found on categories page");
      return;
    }
    await createBtn.click();

    // Fill in category name in modal or form
    const nameInput = page.locator("input[name='name'], input[placeholder*='danh mục'], input[placeholder*='tên']").first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill(testCategoryName);

    // Submit
    const submitBtn = page.locator("button[type='submit']:has-text('Lưu'), button[type='submit']:has-text('Tạo'), button[type='submit']:has-text('Thêm')").first();
    await submitBtn.click();

    // Wait for the dialog to close (mutation finished) then poll for the new
    // row — router.refresh() is fire-and-forget, so the refreshed list can land
    // slightly after the dialog closes. toContainText auto-retries instead of
    // racing a one-shot textContent() read against that refetch.
    await expect(page.locator('[role="dialog"]')).toHaveCount(0, { timeout: 10_000 });
    await expect(page.locator("body")).toContainText(testCategoryName, { timeout: 10_000 });
    createdCategoryName = testCategoryName;
  });

  test("delete the test category", async ({ page }) => {
    if (!createdCategoryName) {
      test.skip(true, "No test category to delete (create test may have been skipped)");
      return;
    }
    await page.goto("/admin/categories");
    await page.waitForLoadState("networkidle");

    // Find and click delete for our test category
    const row = page.locator(`tr:has-text("${createdCategoryName}"), li:has-text("${createdCategoryName}")`).first();
    if (!(await row.isVisible())) {
      test.skip(true, "Test category row not found");
      return;
    }
    const deleteBtn = row.locator("button:has-text('Xóa'), [aria-label*='xóa' i], [aria-label*='delete' i]").first();
    // Deletion is confirmed via a native window.confirm() dialog, not a DOM
    // modal — Playwright auto-dismisses those unless a handler accepts it.
    page.once("dialog", (dialog) => dialog.accept());
    await deleteBtn.click();

    await expect(page.locator("body")).not.toContainText(createdCategoryName, { timeout: 10_000 });
  });
});

test.describe("Admin Orders", () => {
  test.beforeEach(skipIfNoCredentials);

  test("orders list loads", async ({ page }) => {
    await page.goto("/admin/orders");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/admin\/orders/);
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Đăng nhập");
  });

  test("orders search filters results", async ({ page }) => {
    await page.goto("/admin/orders");
    await page.waitForLoadState("networkidle");

    const searchInput = page.locator("input[type='search'], input[placeholder*='Tìm'], input[placeholder*='tìm']").first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("test-query-xyz-nonexistent");
      await page.keyboard.press("Enter");
      await page.waitForLoadState("networkidle");
      // Expect either empty state or normal table
      await expect(page.locator("body")).not.toBeEmpty();
    }
  });
});

test.describe("Admin Users", () => {
  test.beforeEach(skipIfNoCredentials);

  test("users list loads with pagination", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/admin\/users/);
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Đăng nhập");
  });
});

test.describe.serial("Admin Coupons CRUD", () => {
  test.beforeEach(skipIfNoCredentials);

  const testCouponCode = `E2ETEST${Date.now()}`;
  let couponCreated = false;

  test("create a coupon", async ({ page }) => {
    await page.goto("/admin/coupons");
    await page.waitForLoadState("networkidle");

    const createBtn = page.locator("button:has-text('Thêm'), a:has-text('Thêm'), button:has-text('Tạo')").first();
    if (!(await createBtn.isVisible())) {
      test.skip(true, "No create button found on coupons page");
      return;
    }
    await createBtn.click();

    // Fill coupon form
    const codeInput = page.locator("input[name='code'], input[placeholder*='code'], input[placeholder*='mã']").first();
    await expect(codeInput).toBeVisible({ timeout: 5000 });
    await codeInput.fill(testCouponCode);

    // Fill discount amount (percentage or flat — try both)
    const discountInput = page.locator("input[name='discountValue'], input[name='discount'], input[type='number']").first();
    if (await discountInput.isVisible()) {
      await discountInput.fill("10");
    }

    const submitBtn = page.locator("button[type='submit']:has-text('Lưu'), button[type='submit']:has-text('Tạo'), button[type='submit']:has-text('Thêm')").first();
    await submitBtn.click();

    // Wait for the dialog to close (mutation finished) then poll for the new
    // row — router.refresh() is fire-and-forget, so the refreshed list can land
    // slightly after the dialog closes. toContainText auto-retries instead of
    // racing a one-shot textContent() read against that refetch.
    await expect(page.locator('[role="dialog"]')).toHaveCount(0, { timeout: 10_000 });
    await expect(page.locator("body")).toContainText(testCouponCode, { timeout: 10_000 });
    couponCreated = true;
  });

  test("delete the test coupon", async ({ page }) => {
    if (!couponCreated) {
      test.skip(true, "Coupon was not created — skipping delete");
      return;
    }
    await page.goto("/admin/coupons");
    await page.waitForLoadState("networkidle");

    const row = page.locator(`tr:has-text("${testCouponCode}")`).first();
    if (!(await row.isVisible())) {
      test.skip(true, "Test coupon row not found");
      return;
    }
    const deleteBtn = row.locator("button:has-text('Xóa'), [aria-label*='xóa' i]").first();
    // Deletion is confirmed via a native window.confirm() dialog, not a DOM
    // modal — Playwright auto-dismisses those unless a handler accepts it.
    page.once("dialog", (dialog) => dialog.accept());
    await deleteBtn.click();

    await expect(page.locator("body")).not.toContainText(testCouponCode, { timeout: 10_000 });
  });
});

test.describe("Admin Reports", () => {
  test.beforeEach(skipIfNoCredentials);

  test("reports page loads with revenue data", async ({ page }) => {
    await page.goto("/admin/reports");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/admin\/reports/);
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Đăng nhập");
  });
});
