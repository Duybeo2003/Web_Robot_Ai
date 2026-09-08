import { expect, test } from "@playwright/test";
import { createVnPayUrl, verifyVnPayReturn } from "../src/lib/vnpay";

test.describe("Security boundaries", () => {
  test("redirects anonymous visitors away from admin and profile pages", async ({ request }) => {
    const admin = await request.get("/admin", { maxRedirects: 0 });
    expect(admin.status()).toBe(307);
    expect(admin.headers().location).toBe("/");

    for (const path of ["/admin/audit", "/admin/commissions", "/admin/support"]) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status()).toBe(307);
      expect(response.headers().location).toBe("/");
    }

    const profile = await request.get("/profile/orders", { maxRedirects: 0 });
    expect(profile.status()).toBe(307);
    expect(profile.headers().location).toBe("/?login=true");
  });

  test("rejects unauthenticated mutations before reading their payload", async ({ request }) => {
    const upload = await request.post("/api/upload", {
      multipart: { file: { name: "test.png", mimeType: "image/png", buffer: Buffer.from("not-an-image") } },
    });
    expect(upload.status()).toBe(401);

    const rmaUpload = await request.post("/api/uploads/rma", {
      multipart: {
        file: {
          name: "evidence.png",
          mimeType: "image/png",
          buffer: Buffer.from("not-an-image"),
        },
      },
    });
    expect(rmaUpload.status()).toBe(401);

    const cron = await request.post("/api/cron/release-expired-orders");
    expect(cron.status()).toBe(401);
  });

  test("rejects an unsigned VNPay IPN without touching an order", async ({ request }) => {
    const response = await request.get("/api/vnpay/ipn?vnp_TxnRef=unknown&vnp_Amount=10000");
    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ RspCode: "97" });
  });

  test("sets the baseline browser security headers", async ({ request }) => {
    const response = await request.get("/chinh-sach-bao-mat");
    expect(response.status()).toBe(200);
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["x-frame-options"]).toBe("SAMEORIGIN");
    expect(response.headers()["referrer-policy"]).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(response.headers()["content-security-policy"]).toContain(
      "default-src 'self'",
    );
  });
});

test.describe("VNPay signature contract", () => {
  test("accepts the generated signature and rejects a tampered amount", () => {
    const previous = {
      tmnCode: process.env.VNP_TMN_CODE,
      secret: process.env.VNP_HASH_SECRET,
      url: process.env.VNP_URL,
      returnUrl: process.env.VNP_RETURN_URL,
    };
    process.env.VNP_TMN_CODE = "ROBOEQ01";
    process.env.VNP_HASH_SECRET = "test-signing-secret-that-is-not-used-in-production";
    process.env.VNP_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    process.env.VNP_RETURN_URL = "https://shop.example.test/api/vnpay/vnpay_return";

    try {
      const paymentUrl = createVnPayUrl(
        "payment-reference",
        125000,
        "127.0.0.1",
        "order-reference",
      );
      const params = Object.fromEntries(new URL(paymentUrl).searchParams.entries());
      expect(verifyVnPayReturn(params)).toBe(true);
      expect(verifyVnPayReturn({ ...params, vnp_Amount: "1" })).toBe(false);
    } finally {
      const restore = (name: string, value: string | undefined) => {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      };
      restore("VNP_TMN_CODE", previous.tmnCode);
      restore("VNP_HASH_SECRET", previous.secret);
      restore("VNP_URL", previous.url);
      restore("VNP_RETURN_URL", previous.returnUrl);
    }
  });
});
