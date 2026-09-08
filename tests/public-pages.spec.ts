import { expect, test } from "@playwright/test";

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

  test("opens the login dialog from the canonical login URL", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\?login=true$/);
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
