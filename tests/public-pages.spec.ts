import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { loadEnvConfig } from "@next/env";
import { hashOtp } from "../src/lib/otp";
import { normalizeVietnamPhone } from "../src/lib/phone";

loadEnvConfig(process.cwd());

test.describe("Public commercial pages", () => {
  test("shows payment terms without hard-coded account details", async ({ page }) => {
    await page.goto("/chinh-sach-thanh-toan");
    await expect(page.getByRole("heading", { name: "Chính sách thanh toán" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "6. Sai lệch và hoàn tiền" }),
    ).toBeVisible();
    await expect(page.getByText("1058744697")).toHaveCount(0);
  });

  test("shows an accessible support form with consent", async ({ page }) => {
    await page.goto("/lien-he");
    await expect(page.getByRole("heading", { name: "Gửi yêu cầu hỗ trợ" })).toBeVisible();
    await expect(page.getByLabel("Họ tên")).toBeVisible();
    await expect(page.getByLabel("Số điện thoại")).toBeVisible();
    await expect(page.getByLabel(/Tôi đồng ý/)).toBeVisible();
  });

  test("publishes the complete legal and warranty navigation", async ({ page }) => {
    await page.goto("/dieu-khoan-su-dung");
    await expect(
      page.getByRole("heading", { name: "Điều khoản sử dụng & mua bán" }),
    ).toBeVisible();
    await expect(page.getByText(/Có hiệu lực từ ngày/)).toBeVisible();

    await page.goto("/chinh-sach-doi-tra");
    await expect(
      page.getByRole("heading", { name: "Chính sách đổi trả & hoàn tiền" }),
    ).toBeVisible();

    await page.goto("/bao-hanh");
    await expect(page.getByRole("heading", { name: "Tra cứu Bảo hành" })).toBeVisible();
    await expect(page.getByLabel("Số serial sản phẩm")).toBeVisible();
  });

  test("redirects legacy blog URLs to the canonical education section", async ({ request }) => {
    const response = await request.get("/blog", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("/giao-duc");
  });

  test("renders an empty cart checkout state without exposing a broken form", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: "Giỏ hàng trống" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Quay lại cửa hàng" })).toBeVisible();
  });

  test("requires policy acceptance and guest phone verification before checkout", async ({ page }) => {
    await page.goto("/shop");
    await page.getByRole("button", { name: "Thêm vào giỏ hàng" }).first().click();
    await page.goto("/cart");
    const checkoutLink = page.getByRole("link", { name: /Tiến hành Thanh toán/ });
    await expect(checkoutLink).toHaveAttribute("href", "/checkout");
    await checkoutLink.click();

    const submit = page.getByRole("button", { name: "ĐẶT HÀNG NGAY" });
    const consent = page.getByRole("checkbox");
    await expect(
      page.getByRole("heading", { name: "Thanh toán", exact: true }),
    ).toBeVisible();
    await expect(submit).toBeDisabled();
    await expect(page.getByRole("link", { name: "điều khoản mua bán" })).toHaveAttribute(
      "href",
      "/dieu-khoan-su-dung",
    );
    await consent.check();
    await expect(submit).toBeDisabled();
    await expect(page.getByRole("button", { name: /OTP$/ })).toBeVisible();
  });

  test("creates a guest COD order with a single-use OTP and canonical totals", async ({
    page,
  }) => {
    const prisma = new PrismaClient();
    const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const productId = `e2e-product-${unique}`;
    const slug = `e2e-checkout-${unique}`;
    const title = `RoboEQ E2E Checkout ${unique}`;
    // Deliberately exceeds the former DECIMAL(10,2) ceiling to guard money capacity.
    const price = 175_000_000;
    const otp = "123456";
    let phone = "";
    let normalizedPhone = "";
    let orderId = "";

    try {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const candidate = `090${Math.floor(Math.random() * 10_000_000)
          .toString()
          .padStart(7, "0")}`;
        const existing = await prisma.user.findUnique({
          where: { phoneNumber: candidate },
          select: { id: true },
        });
        if (!existing) {
          phone = candidate;
          break;
        }
      }
      expect(phone).not.toBe("");
      normalizedPhone = normalizeVietnamPhone(phone) || "";
      expect(normalizedPhone).not.toBe("");

      await prisma.product.create({
        data: {
          id: productId,
          title,
          slug,
          description: "Sản phẩm tạm dùng để kiểm chứng toàn bộ giao dịch checkout.",
          price,
          inventoryCount: 5,
          sku: `E2E-${unique}`,
        },
      });

      await page.goto(`/shop?q=${encodeURIComponent(title)}`);
      await page.getByRole("button", { name: "Thêm vào giỏ hàng" }).click();
      await page.goto("/checkout");

      await page.getByLabel("Họ và tên người nhận").fill("Khách E2E RoboEQ");
      await page.getByLabel("Số điện thoại người nhận").fill(phone);
      await page
        .getByLabel("Địa chỉ nhận hàng chi tiết")
        .fill("123 Đường Kiểm Thử, Phường 1, Thành phố Hồ Chí Minh");
      await page.getByRole("button", { name: "Nhận OTP", exact: true }).click();
      await expect(page.getByRole("button", { name: /Gửi lại \(/ })).toBeVisible();

      const otpUpdated = await prisma.otpCode.updateMany({
        where: { phoneNumber: normalizedPhone },
        data: { code: hashOtp(normalizedPhone, otp) },
      });
      expect(otpUpdated.count).toBe(1);

      await page.getByLabel("Xác thực số điện thoại để đặt hàng").fill(otp);
      await page.getByRole("checkbox").check();
      await page.getByRole("button", { name: "ĐẶT HÀNG NGAY" }).click();
      await expect(
        page.getByRole("heading", { name: "Đặt hàng thành công" }),
      ).toBeVisible();

      const successUrl = new URL(page.url());
      orderId = successUrl.pathname.split("/").at(-1) || "";
      expect(orderId).not.toBe("");
      expect(successUrl.searchParams.get("token")).toBeTruthy();

      const [order, product, remainingOtps] = await Promise.all([
        prisma.order.findUnique({
          where: { id: orderId },
          include: {
            items: true,
            paymentTransactions: true,
            inventoryTransactions: true,
          },
        }),
        prisma.product.findUnique({ where: { id: productId } }),
        prisma.otpCode.count({ where: { phoneNumber: normalizedPhone } }),
      ]);

      expect(order).not.toBeNull();
      expect(Number(order?.subtotal)).toBe(price);
      expect(Number(order?.totalAmount)).toBe(price);
      expect(Number(order?.amountDue)).toBe(price);
      expect(order?.paymentStatus).toBe("UNPAID");
      expect(order?.status).toBe("PENDING");
      expect(order?.termsAcceptedAt).not.toBeNull();
      expect(order?.termsVersion).toBeTruthy();
      expect(order?.guestAccessTokenHash).toBeTruthy();
      expect(order?.guestAccessExpiresAt?.getTime()).toBeGreaterThan(Date.now());
      expect(order?.items).toHaveLength(1);
      expect(Number(order?.items[0]?.priceAtPurchase)).toBe(price);
      expect(order?.paymentTransactions).toHaveLength(1);
      expect(order?.paymentTransactions[0]).toMatchObject({
        provider: "COD",
        status: "PENDING",
      });
      expect(Number(order?.paymentTransactions[0]?.amount)).toBe(price);
      expect(order?.inventoryTransactions).toHaveLength(1);
      expect(order?.inventoryTransactions[0]).toMatchObject({
        productId,
        variantId: null,
        type: "OUT",
        source: "SALE",
        quantity: 1,
      });
      expect(order?.inventoryTransactions[0]?.idempotencyKey).toBeTruthy();
      expect(product?.inventoryCount).toBe(4);
      expect(remainingOtps).toBe(0);

      await prisma.order.update({
        where: { id: orderId },
        data: { guestAccessExpiresAt: new Date(Date.now() - 1_000) },
      });
      const expiredPage = await page.request.get(successUrl.toString());
      expect(expiredPage.status()).toBe(404);
      const expiredPaymentAccess = await page.request.get(
        `/api/vnpay/create_url?orderId=${encodeURIComponent(orderId)}&token=${encodeURIComponent(
          successUrl.searchParams.get("token") || "",
        )}`,
      );
      expect(expiredPaymentAccess.status()).toBe(403);
    } finally {
      await prisma.otpCode.deleteMany({
        where: { phoneNumber: normalizedPhone || "__none__" },
      });
      await prisma.inventoryTransaction.deleteMany({ where: { productId } });
      if (orderId) {
        await prisma.order.deleteMany({ where: { id: orderId } });
      } else {
        await prisma.order.deleteMany({
          where: { items: { some: { productId } } },
        });
      }
      await prisma.product.deleteMany({ where: { id: productId } });
      if (normalizedPhone) {
        await prisma.user.deleteMany({ where: { phoneNumber: normalizedPhone } });
      }
      await prisma.$disconnect();
    }
  });

  test("opens the login dialog from the canonical login URL", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\?login=true$/);
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
