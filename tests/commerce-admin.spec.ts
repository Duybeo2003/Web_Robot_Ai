import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { loadEnvConfig } from "@next/env";
import bcrypt from "bcryptjs";

loadEnvConfig(process.cwd());

test("an admin cancels a paid order and records one refund without restoring points twice", async ({
  page,
}) => {
  const prisma = new PrismaClient();
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const adminId = `e2e-admin-${unique}`;
  const customerId = `e2e-customer-${unique}`;
  const affiliateId = `e2e-affiliate-${unique}`;
  const productId = `e2e-refund-product-${unique}`;
  const variantId = `e2e-refund-variant-${unique}`;
  const couponId = `e2e-coupon-${unique}`;
  const couponCode = `E2E${unique.replaceAll("-", "").slice(-16)}`.toUpperCase();
  const orderId = `e2e-paid-order-${unique}`;
  const adminEmail = `e2e-admin-${unique}@example.test`;
  const password = "E2e-Commercial-Password-123!";
  const refundReference = `REFUND-${unique}`;
  const productPrice = 277_800_000;
  const orderAmount = 250_000_000;
  const pointsUsed = 20;

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.createMany({
      data: [
        {
          id: adminId,
          name: "Admin E2E",
          email: adminEmail,
          password: passwordHash,
          role: "ADMIN",
        },
        { id: customerId, name: "Khách hoàn tiền E2E", points: 80 },
        { id: affiliateId, name: "Đối tác E2E" },
      ],
    });
    await prisma.product.create({
      data: {
        id: productId,
        title: `Sản phẩm hoàn tiền E2E ${unique}`,
        slug: `e2e-refund-${unique}`,
        sku: `E2E-REFUND-${unique}`,
        description: "Sản phẩm tạm để kiểm chứng huỷ đơn và hoàn tiền.",
        price: productPrice,
        inventoryCount: 0,
        variants: {
          create: {
            id: variantId,
            attributes: { "Màu sắc": "Cam E2E" },
            sku: `E2E-REFUND-VARIANT-${unique}`,
            price: productPrice,
            inventoryCount: 4,
          },
        },
      },
    });
    await prisma.coupon.create({
      data: {
        id: couponId,
        code: couponCode,
        discountPercent: 10,
        usageLimit: 100,
        usageCount: 1,
      },
    });
    await prisma.order.create({
      data: {
        id: orderId,
        userId: customerId,
        customerName: "Khách hoàn tiền E2E",
        totalAmount: orderAmount,
        depositAmount: orderAmount,
        subtotal: productPrice,
        couponDiscount: 27_780_000,
        pointDiscount: 20_000,
        discountAmount: 27_800_000,
        amountPaid: orderAmount,
        amountDue: 0,
        paymentMethod: "BANK_TRANSFER",
        paymentStatus: "PAID",
        status: "PROCESSING",
        couponCode,
        pointsUsed,
        idempotencyKey: `e2e-refund:${unique}`,
        shippingAddress: "123 Đường Kiểm Thử, Thành phố Hồ Chí Minh",
        receiverPhone: "+84900000001",
        items: {
          create: {
            productId,
            variantId,
            quantity: 1,
            priceAtPurchase: productPrice,
          },
        },
        paymentTransactions: {
          create: {
            provider: "BANK_TRANSFER",
            status: "SUCCEEDED",
            amount: orderAmount,
            idempotencyKey: `e2e-paid:${unique}`,
            providerTransactionId: `PAID-${unique}`,
            processedAt: new Date(),
          },
        },
        commissions: {
          create: {
            affiliateUserId: affiliateId,
            amount: 25_000_000,
            status: "PENDING",
          },
        },
        inventoryTransactions: {
          create: {
            productId,
            variantId,
            type: "OUT",
            source: "SALE",
            quantity: 1,
            reference: orderId,
            idempotencyKey: `e2e-inventory-sale:${unique}`,
          },
        },
      },
    });

    await page.goto("/");
    await page.getByTitle("Đăng nhập").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByLabel("Email hoặc Số điện thoại").fill(adminEmail);
    await page.getByLabel("Mật khẩu").fill(password);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect
      .poll(
        async () => {
          const response = await page.request.get("/api/auth/session");
          const session = await response.json();
          return session?.user?.role;
        },
        { timeout: 15_000 },
      )
      .toBe("ADMIN");

    await page.goto(`/admin/orders?q=${encodeURIComponent(orderId)}`);
    await expect(page.getByRole("heading", { name: "Đơn hàng" })).toBeVisible();
    await page.getByRole("button", { name: "Xem chi tiết" }).click();
    const statusSelect = page.getByRole("combobox").first();
    await statusSelect.click();
    await page.getByRole("option", { name: "Đã hủy", exact: true }).click();
    await expect(page.getByText("Đã cập nhật đơn hàng.")).toBeVisible();

    await expect
      .poll(async () => {
        const [order, variant, customer, coupon, commission, movements] = await Promise.all([
          prisma.order.findUnique({ where: { id: orderId } }),
          prisma.productVariant.findUnique({ where: { id: variantId } }),
          prisma.user.findUnique({ where: { id: customerId } }),
          prisma.coupon.findUnique({ where: { id: couponId } }),
          prisma.commission.findFirst({ where: { orderId } }),
          prisma.inventoryTransaction.findMany({
            where: { orderId },
            orderBy: { createdAt: "asc" },
          }),
        ]);
        return {
          orderStatus: order?.status,
          paymentStatus: order?.paymentStatus,
          pointsRestored: Boolean(order?.pointsRestoredAt),
          inventoryCount: variant?.inventoryCount,
          customerPoints: customer?.points,
          couponUsage: coupon?.usageCount,
          commissionStatus: commission?.status,
          movements: movements.map((movement) => ({
            type: movement.type,
            source: movement.source,
            quantity: movement.quantity,
            variantId: movement.variantId,
          })),
        };
      })
      .toEqual({
        orderStatus: "CANCELLED",
        paymentStatus: "PAID",
        pointsRestored: true,
        inventoryCount: 5,
        customerPoints: 100,
        couponUsage: 0,
        commissionStatus: "CANCELLED",
        movements: [
          { type: "OUT", source: "SALE", quantity: 1, variantId },
          { type: "IN", source: "CANCELLATION", quantity: 1, variantId },
        ],
      });

    await page.reload();
    await page.getByRole("button", { name: "Xem chi tiết" }).click();
    await page.getByPlaceholder("Mã đối soát hoàn tiền").fill(refundReference);
    await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
    await expect(page.getByText("Đã ghi nhận hoàn tiền.")).toBeVisible();

    await expect
      .poll(async () => {
        const [order, customer, refunds] = await Promise.all([
          prisma.order.findUnique({ where: { id: orderId } }),
          prisma.user.findUnique({ where: { id: customerId } }),
          prisma.paymentTransaction.findMany({
            where: { orderId, status: "REFUNDED" },
          }),
        ]);
        return {
          paymentStatus: order?.paymentStatus,
          amountPaid: Number(order?.amountPaid),
          amountDue: Number(order?.amountDue),
          customerPoints: customer?.points,
          refundCount: refunds.length,
          refundAmount: Number(refunds[0]?.amount),
          refundReference: refunds[0]?.providerTransactionId,
        };
      })
      .toEqual({
        paymentStatus: "REFUNDED",
        amountPaid: 0,
        amountDue: 0,
        customerPoints: 100,
        refundCount: 1,
        refundAmount: orderAmount,
        refundReference,
      });
  } finally {
    await prisma.auditLog.deleteMany({
      where: {
        OR: [{ userId: adminId }, { recordId: orderId }],
      },
    });
    await prisma.commission.deleteMany({ where: { orderId } });
    await prisma.inventoryTransaction.deleteMany({ where: { orderId } });
    await prisma.order.deleteMany({ where: { id: orderId } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.coupon.deleteMany({ where: { id: couponId } });
    await prisma.user.deleteMany({
      where: { id: { in: [adminId, customerId, affiliateId] } },
    });
    await prisma.$disconnect();
  }
});
