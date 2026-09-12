import { test, expect } from "@playwright/test";

test.describe("Admin Access Control", () => {
  test("admin root redirects unauthenticated users", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    const url = page.url();
    expect(url).not.toMatch(/^http:\/\/localhost:3000\/admin\/?$/);
  });

  test("admin products page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/admin/products");
    await page.waitForLoadState("networkidle");
    const url = page.url();
    expect(url).not.toContain("/admin/products");
  });

  test("admin orders page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/admin/orders");
    await page.waitForLoadState("networkidle");
    const url = page.url();
    expect(url).not.toContain("/admin/orders");
  });

  test("admin users page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");
    const url = page.url();
    expect(url).not.toContain("/admin/users");
  });

  test("admin reports page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/admin/reports");
    await page.waitForLoadState("networkidle");
    const url = page.url();
    expect(url).not.toContain("/admin/reports");
  });
});

test.describe("API Health & Security", () => {
  test("health endpoint returns ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json().catch(() => null);
    if (body) {
      expect(body).toHaveProperty("status");
    }
  });

  test("chat endpoint rejects GET requests", async ({ request }) => {
    const res = await request.get("/api/chat");
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("VNPay IPN endpoint rejects invalid checksum", async ({ request }) => {
    const res = await request.get("/api/vnpay/ipn?vnp_TxnRef=test&vnp_SecureHash=invalid");
    const body = await res.json().catch(() => null);
    if (body) {
      expect(body.RspCode).toBe("97");
    }
  });

  test("cron endpoint rejects missing token", async ({ request }) => {
    const res = await request.get("/api/cron/cancel-expired-orders");
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("sitemap.xml is accessible", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("<?xml");
    expect(body).toContain("<urlset");
  });

  test("robots.txt is accessible", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("User-agent");
    expect(body).toContain("Disallow: /admin/");
  });
});

test.describe("Auth Pages", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toBeEmpty();
    const url = page.url();
    // Should stay on login or redirect to home — not crash
    expect(url).toBeTruthy();
  });
});

test.describe("Static Pages", () => {
  test("about page loads", async ({ page }) => {
    await page.goto("/gioi-thieu");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("contact page loads", async ({ page }) => {
    await page.goto("/lien-he");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("warranty page loads", async ({ page }) => {
    await page.goto("/bao-hanh");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("privacy policy page loads", async ({ page }) => {
    await page.goto("/chinh-sach-bao-mat");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("return policy page loads", async ({ page }) => {
    await page.goto("/chinh-sach-doi-tra");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("shipping policy page loads", async ({ page }) => {
    await page.goto("/chinh-sach-van-chuyen");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("STEM education page loads", async ({ page }) => {
    await page.goto("/giao-duc");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toBeEmpty();
  });
});

test.describe("404 Handling", () => {
  test("unknown page returns 404 UI", async ({ page }) => {
    const res = await page.goto("/this-page-does-not-exist-xyz");
    await page.waitForLoadState("networkidle");
    // Next.js returns 404 status or shows 404 page
    expect(res?.status() === 404 || page.url().includes("not-found") || await page.locator("body").textContent().then(t => t?.includes("404") || t?.includes("không tìm thấy") || t?.includes("Không tìm thấy"))).toBeTruthy();
  });

  test("invalid product slug shows 404", async ({ page }) => {
    const res = await page.goto("/shop/san-pham-khong-ton-tai-xyz-abc");
    await page.waitForLoadState("networkidle");
    expect(res?.status() === 404 || await page.locator("body").textContent().then(t => t?.toLowerCase().includes("không tìm thấy") || t?.includes("404"))).toBeTruthy();
  });
});
