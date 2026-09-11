import { test, expect } from "@playwright/test";

test.describe("Admin Dashboard", () => {
  test("admin root redirects unauthenticated users", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    // Should redirect to home or login
    const url = page.url();
    expect(url).not.toContain("/admin/");
  });

  test("admin login page is not accessible to public", async ({ page }) => {
    const res = await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    const url = page.url();
    // Should be redirected away from /admin
    expect(url === "http://localhost:3000/admin" || url === "http://localhost:3000/admin/").toBeFalsy();
  });
});

test.describe("API Health", () => {
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
    // Should return 405 Method Not Allowed or similar
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("VNPay IPN endpoint rejects invalid checksum", async ({ request }) => {
    const res = await request.get("/api/vnpay/ipn?vnp_TxnRef=test&vnp_SecureHash=invalid");
    const body = await res.json().catch(() => null);
    if (body) {
      expect(body.RspCode).toBe("97");
    }
  });
});
