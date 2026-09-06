# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: checkout.spec.ts >> E-commerce Checkout Flow >> should complete the checkout flow using BANK_TRANSFER
- Location: tests\checkout.spec.ts:10:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/checkout/
Received string:  "http://localhost:3000/shop"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    13 × unexpected value "http://localhost:3000/shop"

```

```yaml
- banner:
  - link "RoboEQ":
    - /url: /
  - textbox "Tìm kiếm robot, kit STEM, đồ chơi logic..."
  - button
  - text: 0385.333.111
  - link "Zalo Tư Vấn":
    - /url: https://zalo.me/0385333111
    - img
    - text: Zalo Tư Vấn
  - button
  - button "Đăng nhập"
  - button "1"
  - text: SẢN PHẨM GIÁO DỤC
  - navigation:
    - link "Robot Giáo Dục":
      - /url: /shop?type=ROBOT_STEM
    - link "Đồ Chơi Tư Duy Logic":
      - /url: /shop?type=DO_CHOI_LOGIC
    - link "Blog & Kiến Thức":
      - /url: /blog
    - link "Hướng Dẫn Sử Dụng":
      - /url: /huong-dan
    - link "Tra Cứu Bảo Hành":
      - /url: /bao-hanh
    - link "Sự Kiện":
      - /url: /events
    - link "⚡ FLASH SALE":
      - /url: /shop?flashsale=true
- main:
  - heading "Tìm kiếm" [level=2]
  - textbox "Nhập tên sản phẩm..."
  - heading "Danh mục" [level=3]:
    - button "Danh mục"
  - heading "Mức giá" [level=3]:
    - button "Mức giá"
  - heading "Độ tuổi" [level=3]:
    - button "Độ tuổi"
  - heading "Kỹ năng" [level=3]:
    - button "Kỹ năng"
  - heading "Tất Cả Sản Phẩm" [level=1]
  - paragraph: Hiển thị 12 sản phẩm
  - text: "Sắp xếp theo:"
  - combobox:
    - option "Mới nhất" [selected]
    - 'option "Giá: Thấp đến Cao"'
    - 'option "Giá: Cao đến Thấp"'
  - img
  - text: Hàng có sẵn (2-4 ngày) Giảm 25%
  - button "Yêu thích"
  - link "Gói Khám Phá Khoa Học":
    - /url: /shop/goi-kham-pha-khoa-hoc
    - img "Gói Khám Phá Khoa Học"
  - link "Gói Khám Phá Khoa Học":
    - /url: /shop/goi-kham-pha-khoa-hoc
    - heading "Gói Khám Phá Khoa Học" [level=3]
  - paragraph: 2.140.000 ₫
  - paragraph: 1.605.000 ₫
  - button
  - text: Hàng có sẵn (2-4 ngày) Giảm 20%
  - button "Yêu thích"
  - link "Combo Siêu Trí Tuệ":
    - /url: /shop/combo-sieu-tri-tue-v2
    - img "Combo Siêu Trí Tuệ"
  - link "Combo Siêu Trí Tuệ":
    - /url: /shop/combo-sieu-tri-tue-v2
    - heading "Combo Siêu Trí Tuệ" [level=3]
  - paragraph: 7.880.000 ₫
  - paragraph: 6.304.000 ₫
  - button
  - text: Hàng có sẵn (2-4 ngày)
  - button "Yêu thích"
  - link "Combo Học Tiếng Anh Thông Minh":
    - /url: /shop/thang-may-go-stem
    - img "Combo Học Tiếng Anh Thông Minh"
  - link "Combo Học Tiếng Anh Thông Minh":
    - /url: /shop/thang-may-go-stem
    - heading "Combo Học Tiếng Anh Thông Minh" [level=3]
  - paragraph: 500.000 ₫
  - button
  - text: Hàng có sẵn (2-4 ngày) Giảm 20%
  - button "Yêu thích"
  - link "Bộ Puzzle Mô Hình Địa Cầu Gỗ 3D":
    - /url: /shop/puzzle-dia-cau-go-3d
    - img "Bộ Puzzle Mô Hình Địa Cầu Gỗ 3D"
  - link "Bộ Puzzle Mô Hình Địa Cầu Gỗ 3D":
    - /url: /shop/puzzle-dia-cau-go-3d
    - heading "Bộ Puzzle Mô Hình Địa Cầu Gỗ 3D" [level=3]
  - paragraph: 812.500 ₫
  - paragraph: 650.000 ₫
  - button
  - text: Hàng có sẵn (2-4 ngày) Giảm 20%
  - button "Yêu thích"
  - link "Khối Rubik 3x3 Thông Minh Bluetooth":
    - /url: /shop/rubik-thong-minh-bluetooth
    - img "Khối Rubik 3x3 Thông Minh Bluetooth"
  - link "Khối Rubik 3x3 Thông Minh Bluetooth":
    - /url: /shop/rubik-thong-minh-bluetooth
    - heading "Khối Rubik 3x3 Thông Minh Bluetooth" [level=3]
  - paragraph: 1.112.500 ₫
  - paragraph: 890.000 ₫
  - button
  - text: Hàng có sẵn (2-4 ngày) Giảm 20%
  - button "Yêu thích"
  - link "Cờ Tướng AI Thông Minh":
    - /url: /shop/co-tuong-ai-thong-minh
    - img "Cờ Tướng AI Thông Minh"
  - link "Cờ Tướng AI Thông Minh":
    - /url: /shop/co-tuong-ai-thong-minh
    - heading "Cờ Tướng AI Thông Minh" [level=3]
  - paragraph: 1.612.500 ₫
  - paragraph: 1.290.000 ₫
  - button
  - text: Hàng có sẵn (2-4 ngày) Giảm 20%
  - button "Yêu thích"
  - link "Bảng Mạch Điện Tử Nối Dây An Toàn":
    - /url: /shop/bang-mach-dien-tu-an-toan
    - img "Bảng Mạch Điện Tử Nối Dây An Toàn"
  - link "Bảng Mạch Điện Tử Nối Dây An Toàn":
    - /url: /shop/bang-mach-dien-tu-an-toan
    - heading "Bảng Mạch Điện Tử Nối Dây An Toàn" [level=3]
  - paragraph: 437.500 ₫
  - paragraph: 350.000 ₫
  - button
  - text: Hàng có sẵn (2-4 ngày) Giảm 20%
  - button "Yêu thích"
  - link "Bộ Đồ Chơi Lắp Ráp Gỗ Chuyển Động Gear":
    - /url: /shop/lap-rap-go-chuyen-dong
    - img "Bộ Đồ Chơi Lắp Ráp Gỗ Chuyển Động Gear"
  - link "Bộ Đồ Chơi Lắp Ráp Gỗ Chuyển Động Gear":
    - /url: /shop/lap-rap-go-chuyen-dong
    - heading "Bộ Đồ Chơi Lắp Ráp Gỗ Chuyển Động Gear" [level=3]
  - paragraph: 612.500 ₫
  - paragraph: 490.000 ₫
  - button
  - text: Hàng có sẵn (2-4 ngày) Giảm 20%
  - button "Yêu thích"
  - link "Tay Cầm Cánh Tay Robot 4 Trục":
    - /url: /shop/canh-tay-robot-4-truc
    - img "Tay Cầm Cánh Tay Robot 4 Trục"
  - link "Tay Cầm Cánh Tay Robot 4 Trục":
    - /url: /shop/canh-tay-robot-4-truc
    - heading "Tay Cầm Cánh Tay Robot 4 Trục" [level=3]
  - paragraph: 1.937.500 ₫
  - paragraph: 1.550.000 ₫
  - button
  - text: Hàng có sẵn (2-4 ngày) Giảm 20%
  - button "Yêu thích"
  - link "Bộ Cảm Biến Arduino Nâng Cao 37 In 1":
    - /url: /shop/bo-cam-bien-37-in-1
    - img "Bộ Cảm Biến Arduino Nâng Cao 37 In 1"
  - link "Bộ Cảm Biến Arduino Nâng Cao 37 In 1":
    - /url: /shop/bo-cam-bien-37-in-1
    - heading "Bộ Cảm Biến Arduino Nâng Cao 37 In 1" [level=3]
  - paragraph: 987.500 ₫
  - paragraph: 790.000 ₫
  - button
  - text: Hàng có sẵn (2-4 ngày) Giảm 20%
  - button "Yêu thích"
  - link "Mạch Arduino Mega 2560 Pro Chuyên Sâu":
    - /url: /shop/arduino-mega-2560-pro
    - img "Mạch Arduino Mega 2560 Pro Chuyên Sâu"
  - link "Mạch Arduino Mega 2560 Pro Chuyên Sâu":
    - /url: /shop/arduino-mega-2560-pro
    - heading "Mạch Arduino Mega 2560 Pro Chuyên Sâu" [level=3]
  - paragraph: 737.500 ₫
  - paragraph: 590.000 ₫
  - button
  - text: Hàng có sẵn (2-4 ngày) Giảm 20%
  - button "Yêu thích"
  - link "Mô Hình Trồng Cây Tự Động Tưới Nước":
    - /url: /shop/mo-hinh-tuoi-cay-tu-dong
    - img "Mô Hình Trồng Cây Tự Động Tưới Nước"
  - link "Mô Hình Trồng Cây Tự Động Tưới Nước":
    - /url: /shop/mo-hinh-tuoi-cay-tu-dong
    - heading "Mô Hình Trồng Cây Tự Động Tưới Nước" [level=3]
  - paragraph: 812.500 ₫
  - paragraph: 650.000 ₫
  - button
  - link "1":
    - /url: /shop?page=1
  - link "2":
    - /url: /shop?page=2
  - link "Trang sau":
    - /url: /shop?page=2
- contentinfo:
  - heading "RoboEQ" [level=3]
  - paragraph: CÔNG TY TNHH THƯƠNG MẠI VÀ DỊCH VỤ GTK_REVEILLE
  - list:
    - listitem:
      - strong: "Chi nhánh:"
      - text: Quế Võ Hill View, Nam Sơn, Bắc Ninh, Việt Nam
    - listitem:
      - strong: "Hotline:"
      - text: 0385.333.111
  - link "Facebook":
    - /url: https://www.facebook.com/share/1PSifhd4HB/?mibextid=wwXIfr
    - img
  - link "Shopee":
    - /url: https://vn.shp.ee/jYvqVEMj
    - img
  - link:
    - /url: https://zalo.me/0385333111
    - img
  - heading "Về chúng tôi" [level=3]
  - list:
    - listitem:
      - link "› Giới thiệu":
        - /url: /gioi-thieu
    - listitem:
      - link "› Liên hệ":
        - /url: /lien-he
    - listitem:
      - link "› Tin tức":
        - /url: /giao-duc
  - heading "Tài khoản" [level=3]
  - list:
    - listitem:
      - link "› Đơn hàng":
        - /url: /profile/orders
    - listitem:
      - link "› Giỏ hàng":
        - /url: /cart
    - listitem:
      - link "› Thông tin tài khoản":
        - /url: /profile
  - heading "Chính sách" [level=3]
  - list:
    - listitem:
      - link "› Chính sách bảo mật thông tin":
        - /url: /chinh-sach-bao-mat
    - listitem:
      - link "› Chính sách thanh toán":
        - /url: /chinh-sach-thanh-toan
    - listitem:
      - link "› Chính sách vận chuyển":
        - /url: /chinh-sach-van-chuyen
    - listitem:
      - link "› Chính sách bảo hành":
        - /url: /bao-hanh
    - listitem:
      - link "› Chính sách đổi trả":
        - /url: /chinh-sach-doi-tra
  - paragraph: © 2026 RoboEQ. All Rights Reserved. roboeq2026
- region "Notifications alt+T"
- link "Shopee":
  - /url: https://vn.shp.ee/jYvqVEMj
  - img
- link "Facebook":
  - /url: https://www.facebook.com/share/1PSifhd4HB/?mibextid=wwXIfr
  - img
- link "Tiktok":
  - /url: "#"
  - img
- link "Zalo":
  - /url: https://zalo.me/0385333111
  - img
- alert
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { PrismaClient } from "@prisma/client";
  3  | 
  4  | const prisma = new PrismaClient();
  5  | 
  6  | test.describe("E-commerce Checkout Flow", () => {
  7  |   // We use serial mode because we are querying the database and don't want race conditions
  8  |   test.describe.configure({ mode: "serial" });
  9  | 
  10 |   test("should complete the checkout flow using BANK_TRANSFER", async ({
  11 |     page,
  12 |   }) => {
  13 |     // Clear cookies to ensure unauthenticated state
  14 |     await page.context().clearCookies();
  15 | 
  16 |     // 1. Navigate to the shop page and add product to cart
  17 |     await page.goto("/shop");
  18 | 
  19 |     // Find first product and add to cart
  20 |     const firstProductCard = page.locator(".bg-white.group").first();
  21 |     const addToCartBtn = firstProductCard.locator("button").last();
  22 |     await addToCartBtn.click();
  23 | 
  24 |     // 2. Cart sheet opens. Click checkout.
  25 |     // Ensure cart sheet is visible
  26 |     const cartSheetTitle = page.locator("h2", { hasText: "Giỏ hàng của bạn" });
  27 |     await expect(cartSheetTitle).toBeVisible();
  28 | 
  29 |     // Click checkout button in cart
  30 |     const checkoutBtn = page.locator("button", {
  31 |       hasText: "Tiến hành Thanh toán",
  32 |     });
  33 |     await checkoutBtn.click();
  34 | 
  35 |     // 3. Navigate to checkout page
> 36 |     await expect(page).toHaveURL(/\/checkout/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  37 | 
  38 |     // Guest checkout is allowed, so we don't need to login anymore.
  39 |     // We just fill out the checkout form directly.
  40 | 
  41 |     // 9. Fill Checkout Form
  42 |     await page.locator("input#receiverName").fill("Khách hàng Test");
  43 |     await page.locator("input#receiverPhone").fill("0912345678");
  44 |     await page
  45 |       .locator("input#shippingAddress")
  46 |       .fill("123 Đường Test, Quận 1, HCM");
  47 | 
  48 |     // Select Bank Transfer
  49 |     await page.locator('label[for="bank"]').click();
  50 | 
  51 |     // Submit Order
  52 |     const submitOrderBtn = page.locator("button", { hasText: "ĐẶT HÀNG NGAY" });
  53 |     await submitOrderBtn.click();
  54 | 
  55 |     // 10. Assert Success Page
  56 |     await expect(page).toHaveURL(/\/checkout\/success/);
  57 |     await expect(
  58 |       page.locator("h1", { hasText: "Đặt hàng thành công" }),
  59 |     ).toBeVisible();
  60 |     await expect(
  61 |       page.locator("h2", { hasText: "Hướng dẫn chuyển khoản" }),
  62 |     ).toBeVisible();
  63 | 
  64 |     // Clean up test user and their relations is harder now for guest users since we don't know the exact phone number generated.
  65 |     // We will just let the test finish.
  66 |   });
  67 | });
  68 | 
```