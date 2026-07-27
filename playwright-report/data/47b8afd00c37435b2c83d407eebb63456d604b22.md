# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> Admin Dashboard >> should restrict access to non-admins
- Location: tests\admin.spec.ts:39:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*localhost:3000\/$/
Received string:  "https://roboeq.com.vn/"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    13 × unexpected value "https://roboeq.com.vn/"

```

```yaml
- banner:
  - link "ROBOT THÔNG MINH":
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
  - button "Giỏ hàng"
  - text: DANH MỤC
  - navigation:
    - link "Robot AI Giáo Dục":
      - /url: /shop?type=ROBOT_STEM
    - link "Kit Tự Học Arduino":
      - /url: /shop?type=KIT_ARDUINO
    - link "Đồ Chơi Tư Duy Logic":
      - /url: /shop?type=DO_CHOI_LOGIC
    - link "Hướng Dẫn Sử Dụng":
      - /url: /huong-dan
    - link "Tra Cứu Bảo Hành":
      - /url: /bao-hanh
    - link "Blog & Kiến Thức":
      - /url: /blog
    - link "🔥 KHUYẾN MÃI HOT":
      - /url: /shop?sale=true
- main:
  - region:
    - group:
      - img "Mừng Khai Trương Robot Thông Minh"
      - text: Khai trương hồng phát
      - heading "ROBOT GIÁO DỤC SỐ 1 VIỆT NAM" [level=2]
      - paragraph: Giảm giá lên đến 50% cho tất cả các bộ Kit STEM và Robot Lập Trình.
      - button "MUA NGAY"
    - group:
      - img "Đồ chơi Logic Thông Minh"
      - text: Mới ra mắt
      - heading "PHÁT TRIỂN TƯ DUY LOGIC" [level=2]
      - paragraph: Bộ sưu tập đồ chơi trí tuệ xếp hình 3D cao cấp.
      - button "KHÁM PHÁ"
    - button "Previous slide"
    - button "Next slide"
  - img
  - heading "Sản phẩm chính hãng" [level=3]
  - paragraph: Cam kết chất lượng 100%
  - img
  - heading "Đổi trả dễ dàng" [level=3]
  - paragraph: Trong vòng 7 ngày miễn phí
  - img
  - heading "Giao hàng hỏa tốc" [level=3]
  - paragraph: Freeship toàn quốc từ 500k
  - img
  - heading "Bảo mật thông tin" [level=3]
  - paragraph: An toàn tuyệt đối 100%
  - heading "⚡ FLASH SALE" [level=2]
  - text: Gọi
  - strong: 0385.333.111
  - text: hoặc
  - strong: nhắn tin Zalo
  - text: để nhận tư vấn khuyến mại
  - region:
    - group:
      - text: Giảm 20% Có giảm thêm
      - button "Yêu thích"
      - link "Xe Tank Robot Chiến Đấu Bắn Bi Nước":
        - /url: /shop/xe-tank-robot-ban-bi
        - img "Xe Tank Robot Chiến Đấu Bắn Bi Nước"
      - text: Nhắn tin | Giảm giá thêm
      - link "Xe Tank Robot Chiến Đấu Bắn Bi Nước":
        - /url: /shop/xe-tank-robot-ban-bi
        - heading "Xe Tank Robot Chiến Đấu Bắn Bi Nước" [level=3]
      - paragraph: 2.737.500 ₫
      - paragraph: 2.190.000 ₫
      - link "Miễn phí giao hàng":
        - /url: /shop/xe-tank-robot-ban-bi
    - group:
      - text: Giảm 20% Có giảm thêm
      - button "Yêu thích"
      - link "Robot Vẽ Tranh Tự Động DrawBot":
        - /url: /shop/robot-ve-tranh-drawbot
        - img "Robot Vẽ Tranh Tự Động DrawBot"
      - text: Nhắn tin | Giảm giá thêm
      - link "Robot Vẽ Tranh Tự Động DrawBot":
        - /url: /shop/robot-ve-tranh-drawbot
        - heading "Robot Vẽ Tranh Tự Động DrawBot" [level=3]
      - paragraph: 1.437.500 ₫
      - paragraph: 1.150.000 ₫
      - link "Miễn phí giao hàng":
        - /url: /shop/robot-ve-tranh-drawbot
    - group:
      - text: Giảm 20% Có giảm thêm
      - button "Yêu thích"
      - link "Tay Cầm Cánh Tay Robot 4 Trục":
        - /url: /shop/canh-tay-robot-4-truc
        - img "Tay Cầm Cánh Tay Robot 4 Trục"
      - text: Nhắn tin | Giảm giá thêm
      - link "Tay Cầm Cánh Tay Robot 4 Trục":
        - /url: /shop/canh-tay-robot-4-truc
        - heading "Tay Cầm Cánh Tay Robot 4 Trục" [level=3]
      - paragraph: 1.937.500 ₫
      - paragraph: 1.550.000 ₫
      - link "Miễn phí giao hàng":
        - /url: /shop/canh-tay-robot-4-truc
    - group:
      - text: Giảm 20% Có giảm thêm
      - button "Yêu thích"
      - link "Bộ Cảm Biến Arduino Nâng Cao 37 In 1":
        - /url: /shop/bo-cam-bien-37-in-1
        - img "Bộ Cảm Biến Arduino Nâng Cao 37 In 1"
      - text: Nhắn tin | Giảm giá thêm
      - link "Bộ Cảm Biến Arduino Nâng Cao 37 In 1":
        - /url: /shop/bo-cam-bien-37-in-1
        - heading "Bộ Cảm Biến Arduino Nâng Cao 37 In 1" [level=3]
      - paragraph: 987.500 ₫
      - paragraph: 790.000 ₫
      - link "Miễn phí giao hàng":
        - /url: /shop/bo-cam-bien-37-in-1
    - group:
      - text: Giảm 20% Có giảm thêm
      - button "Yêu thích"
      - link "Thang Máy Bằng Gỗ Tự Động STEM":
        - /url: /shop/thang-may-go-stem
        - img "Thang Máy Bằng Gỗ Tự Động STEM"
      - text: Nhắn tin | Giảm giá thêm
      - link "Thang Máy Bằng Gỗ Tự Động STEM":
        - /url: /shop/thang-may-go-stem
        - heading "Thang Máy Bằng Gỗ Tự Động STEM" [level=3]
      - paragraph: 312.500 ₫
      - paragraph: 250.000 ₫
      - link "Miễn phí giao hàng":
        - /url: /shop/thang-may-go-stem
    - group:
      - text: Giảm 20% Có giảm thêm
      - button "Yêu thích"
      - link "Bộ Puzzle Mô Hình Địa Cầu Gỗ 3D":
        - /url: /shop/puzzle-dia-cau-go-3d
        - img "Bộ Puzzle Mô Hình Địa Cầu Gỗ 3D"
      - text: Nhắn tin | Giảm giá thêm
      - link "Bộ Puzzle Mô Hình Địa Cầu Gỗ 3D":
        - /url: /shop/puzzle-dia-cau-go-3d
        - heading "Bộ Puzzle Mô Hình Địa Cầu Gỗ 3D" [level=3]
      - paragraph: 812.500 ₫
      - paragraph: 650.000 ₫
      - link "Miễn phí giao hàng":
        - /url: /shop/puzzle-dia-cau-go-3d
    - button "Previous slide"
    - button "Next slide"
  - heading "ROBOT AI GIÁO DỤC" [level=2]
  - link "Robot mBot":
    - /url: /shop?type=ROBOT_STEM
  - link "Xem tất cả":
    - /url: /shop?type=ROBOT_STEM
  - region:
    - group:
      - text: Giảm 20% Có giảm thêm
      - button "Yêu thích"
      - link "Xe Tank Robot Chiến Đấu Bắn Bi Nước":
        - /url: /shop/xe-tank-robot-ban-bi
        - img "Xe Tank Robot Chiến Đấu Bắn Bi Nước"
      - text: Nhắn tin | Giảm giá thêm
      - link "Xe Tank Robot Chiến Đấu Bắn Bi Nước":
        - /url: /shop/xe-tank-robot-ban-bi
        - heading "Xe Tank Robot Chiến Đấu Bắn Bi Nước" [level=3]
      - paragraph: 2.737.500 ₫
      - paragraph: 2.190.000 ₫
      - link "Miễn phí giao hàng":
        - /url: /shop/xe-tank-robot-ban-bi
    - group:
      - text: Giảm 20% Có giảm thêm
      - button "Yêu thích"
      - link "Robot Vẽ Tranh Tự Động DrawBot":
        - /url: /shop/robot-ve-tranh-drawbot
        - img "Robot Vẽ Tranh Tự Động DrawBot"
      - text: Nhắn tin | Giảm giá thêm
      - link "Robot Vẽ Tranh Tự Động DrawBot":
        - /url: /shop/robot-ve-tranh-drawbot
        - heading "Robot Vẽ Tranh Tự Động DrawBot" [level=3]
      - paragraph: 1.437.500 ₫
      - paragraph: 1.150.000 ₫
      - link "Miễn phí giao hàng":
        - /url: /shop/robot-ve-tranh-drawbot
    - group:
      - text: Giảm 20% Có giảm thêm
      - button "Yêu thích"
      - link "Robot Dò Đường Line Follower":
        - /url: /shop/robot-do-duong
        - img "Robot Dò Đường Line Follower"
      - text: Nhắn tin | Giảm giá thêm
      - link "Robot Dò Đường Line Follower":
        - /url: /shop/robot-do-duong
        - heading "Robot Dò Đường Line Follower" [level=3]
      - paragraph: 1.112.500 ₫
      - paragraph: 890.000 ₫
      - link "Miễn phí giao hàng":
        - /url: /shop/robot-do-duong
    - group:
      - text: Giảm 20% Có giảm thêm
      - button "Yêu thích"
      - link "Bộ Lắp Ráp Robot Nhện 6 Chân Hexapod":
        - /url: /shop/robot-nhen-hexapod
        - img "Bộ Lắp Ráp Robot Nhện 6 Chân Hexapod"
      - text: Nhắn tin | Giảm giá thêm
      - link "Bộ Lắp Ráp Robot Nhện 6 Chân Hexapod":
        - /url: /shop/robot-nhen-hexapod
        - heading "Bộ Lắp Ráp Robot Nhện 6 Chân Hexapod" [level=3]
      - paragraph: 1.562.500 ₫
      - paragraph: 1.250.000 ₫
      - link "Miễn phí giao hàng":
        - /url: /shop/robot-nhen-hexapod
    - group:
      - text: Giảm 20% Có giảm thêm
      - button "Yêu thích"
      - link "Robot Chó Thông Minh - Robot Dog X1":
        - /url: /shop/robot-cho-thong-minh-x1
        - img "Robot Chó Thông Minh - Robot Dog X1"
      - text: Nhắn tin | Giảm giá thêm
      - link "Robot Chó Thông Minh - Robot Dog X1":
        - /url: /shop/robot-cho-thong-minh-x1
        - heading "Robot Chó Thông Minh - Robot Dog X1" [level=3]
      - paragraph: 5.362.500 ₫
      - paragraph: 4.290.000 ₫
      - link "Miễn phí giao hàng":
        - /url: /shop/robot-cho-thong-minh-x1
    - group:
      - text: Giảm 20% Có giảm thêm
      - button "Yêu thích"
      - link "Robot Alpha Mini - Lập trình AI thông minh":
        - /url: /shop/robot-alpha-mini-ai
        - img "Robot Alpha Mini - Lập trình AI thông minh"
      - text: Nhắn tin | Giảm giá thêm
      - link "Robot Alpha Mini - Lập trình AI thông minh":
        - /url: /shop/robot-alpha-mini-ai
        - heading "Robot Alpha Mini - Lập trình AI thông minh" [level=3]
      - paragraph: 4.487.500 ₫
      - paragraph: 3.590.000 ₫
      - link "Miễn phí giao hàng":
        - /url: /shop/robot-alpha-mini-ai
    - button "Previous slide" [disabled]
    - button "Next slide"
  - heading "KIT TỰ HỌC ARDUINO" [level=2]
  - link "Arduino Uno":
    - /url: /shop?type=KIT_ARDUINO
  - link "Xem tất cả":
    - /url: /shop?type=KIT_ARDUINO
  - region:
    - group:
      - text: Giảm 20% Có giảm thêm
      - button "Yêu thích"
      - link "Tay Cầm Cánh Tay Robot 4 Trục":
        - /url: /shop/canh-tay-robot-4-truc
        - img "Tay Cầm Cánh Tay Robot 4 Trục"
      - text: Nhắn tin | Giảm giá thêm
      - link "Tay Cầm Cánh Tay Robot 4 Trục":
        - /url: /shop/canh-tay-robot-4-truc
        - heading "Tay Cầm Cánh Tay Robot 4 Trục" [level=3]
      - paragraph: 1.937.500 ₫
      - paragraph: 1.550.000 ₫
      - link "Miễn phí giao hàng":
        - /url: /shop/canh-tay-robot-4-truc
    - group:
      - text: Giảm 20% Có giảm thêm
      - button "Yêu thích"
      - link "Bộ Cảm Biến Arduino Nâng Cao 37 In 1":
        - /url: /shop/bo-cam-bien-37-in-1
        - img "Bộ Cảm Biến Arduino Nâng Cao 37 In 1"
      - text: Nhắn tin | Giảm giá thêm
      - link "Bộ Cảm Biến Arduino Nâng Cao 37 In 1":
        - /url: /shop/bo-cam-bien-37-in-1
        - heading "Bộ Cảm Biến Arduino Nâng Cao 37 In 1" [level=3]
      - paragraph: 987.500 ₫
      - paragraph: 790.000 ₫
      - link "Miễn phí giao hàng":
        - /url: /shop/bo-cam-bien-37-in-1
    - group:
      - text: Giảm 20% Có giảm thêm
      - button "Yêu thích"
      - link "Mạch Arduino Mega 2560 Pro Chuyên Sâu":
        - /url: /shop/arduino-mega-2560-pro
        - img "Mạch Arduino Mega 2560 Pro Chuyên Sâu"
      - text: Nhắn tin | Giảm giá thêm
      - link "Mạch Arduino Mega 2560 Pro Chuyên Sâu":
        - /url: /shop/arduino-mega-2560-pro
        - heading "Mạch Arduino Mega 2560 Pro Chuyên Sâu" [level=3]
      - paragraph: 737.500 ₫
      - paragraph: 590.000 ₫
      - link "Miễn phí giao hàng":
        - /url: /shop/arduino-mega-2560-pro
    - group:
      - text: Giảm 20% Có giảm thêm
      - button "Yêu thích"
      - link "Mô Hình Trồng Cây Tự Động Tưới Nước":
        - /url: /shop/mo-hinh-tuoi-cay-tu-dong
        - img "Mô Hình Trồng Cây Tự Động Tưới Nước"
      - text: Nhắn tin | Giảm giá thêm
      - link "Mô Hình Trồng Cây Tự Động Tưới Nước":
        - /url: /shop/mo-hinh-tuoi-cay-tu-dong
        - heading "Mô Hình Trồng Cây Tự Động Tưới Nước" [level=3]
      - paragraph: 812.500 ₫
      - paragraph: 650.000 ₫
      - link "Miễn phí giao hàng":
        - /url: /shop/mo-hinh-tuoi-cay-tu-dong
    - group:
      - text: Giảm 20% Có giảm thêm
      - button "Yêu thích"
      - link "Bộ Kit Smart Home IoT với Arduino":
        - /url: /shop/kit-smart-home-iot
        - img "Bộ Kit Smart Home IoT với Arduino"
      - text: Nhắn tin | Giảm giá thêm
      - link "Bộ Kit Smart Home IoT với Arduino":
        - /url: /shop/kit-smart-home-iot
        - heading "Bộ Kit Smart Home IoT với Arduino" [level=3]
      - paragraph: 2.312.500 ₫
      - paragraph: 1.850.000 ₫
      - link "Miễn phí giao hàng":
        - /url: /shop/kit-smart-home-iot
    - group:
      - text: Giảm 20% Có giảm thêm
      - button "Yêu thích"
      - link "Bộ Kit Tự Học Arduino UNO R3 Cơ Bản":
        - /url: /shop/kit-arduino-uno-co-ban
        - img "Bộ Kit Tự Học Arduino UNO R3 Cơ Bản"
      - text: Nhắn tin | Giảm giá thêm
      - link "Bộ Kit Tự Học Arduino UNO R3 Cơ Bản":
        - /url: /shop/kit-arduino-uno-co-ban
        - heading "Bộ Kit Tự Học Arduino UNO R3 Cơ Bản" [level=3]
      - paragraph: 562.500 ₫
      - paragraph: 450.000 ₫
      - link "Miễn phí giao hàng":
        - /url: /shop/kit-arduino-uno-co-ban
    - button "Previous slide" [disabled]
    - button "Next slide"
  - heading "ĐỒ CHƠI TƯ DUY LOGIC" [level=2]
  - link "Rubik & Xếp Hình":
    - /url: /shop?type=DO_CHOI_LOGIC
  - link "Xem tất cả":
    - /url: /shop?type=DO_CHOI_LOGIC
  - region:
    - group:
      - text: Giảm 20% Có giảm thêm
      - button "Yêu thích"
      - link "Thang Máy Bằng Gỗ Tự Động STEM":
        - /url: /shop/thang-may-go-stem
        - img "Thang Máy Bằng Gỗ Tự Động STEM"
      - text: Nhắn tin | Giảm giá thêm
      - link "Thang Máy Bằng Gỗ Tự Động STEM":
        - /url: /shop/thang-may-go-stem
        - heading "Thang Máy Bằng Gỗ Tự Động STEM" [level=3]
      - paragraph: 312.500 ₫
      - paragraph: 250.000 ₫
      - link "Miễn phí giao hàng":
        - /url: /shop/thang-may-go-stem
    - group:
      - text: Giảm 20% Có giảm thêm
      - button "Yêu thích"
      - link "Bộ Puzzle Mô Hình Địa Cầu Gỗ 3D":
        - /url: /shop/puzzle-dia-cau-go-3d
        - img "Bộ Puzzle Mô Hình Địa Cầu Gỗ 3D"
      - text: Nhắn tin | Giảm giá thêm
      - link "Bộ Puzzle Mô Hình Địa Cầu Gỗ 3D":
        - /url: /shop/puzzle-dia-cau-go-3d
        - heading "Bộ Puzzle Mô Hình Địa Cầu Gỗ 3D" [level=3]
      - paragraph: 812.500 ₫
      - paragraph: 650.000 ₫
      - link "Miễn phí giao hàng":
        - /url: /shop/puzzle-dia-cau-go-3d
    - group:
      - text: Giảm 20% Có giảm thêm
      - button "Yêu thích"
      - link "Khối Rubik 3x3 Thông Minh Bluetooth":
        - /url: /shop/rubik-thong-minh-bluetooth
        - img "Khối Rubik 3x3 Thông Minh Bluetooth"
      - text: Nhắn tin | Giảm giá thêm
      - link "Khối Rubik 3x3 Thông Minh Bluetooth":
        - /url: /shop/rubik-thong-minh-bluetooth
        - heading "Khối Rubik 3x3 Thông Minh Bluetooth" [level=3]
      - paragraph: 1.112.500 ₫
      - paragraph: 890.000 ₫
      - link "Miễn phí giao hàng":
        - /url: /shop/rubik-thong-minh-bluetooth
    - group:
      - text: Giảm 20% Có giảm thêm
      - button "Yêu thích"
      - link "Cờ Tướng AI Thông Minh":
        - /url: /shop/co-tuong-ai-thong-minh
        - img "Cờ Tướng AI Thông Minh"
      - text: Nhắn tin | Giảm giá thêm
      - link "Cờ Tướng AI Thông Minh":
        - /url: /shop/co-tuong-ai-thong-minh
        - heading "Cờ Tướng AI Thông Minh" [level=3]
      - paragraph: 1.612.500 ₫
      - paragraph: 1.290.000 ₫
      - link "Miễn phí giao hàng":
        - /url: /shop/co-tuong-ai-thong-minh
    - group:
      - text: Giảm 20% Có giảm thêm
      - button "Yêu thích"
      - link "Bảng Mạch Điện Tử Nối Dây An Toàn":
        - /url: /shop/bang-mach-dien-tu-an-toan
        - img "Bảng Mạch Điện Tử Nối Dây An Toàn"
      - text: Nhắn tin | Giảm giá thêm
      - link "Bảng Mạch Điện Tử Nối Dây An Toàn":
        - /url: /shop/bang-mach-dien-tu-an-toan
        - heading "Bảng Mạch Điện Tử Nối Dây An Toàn" [level=3]
      - paragraph: 437.500 ₫
      - paragraph: 350.000 ₫
      - link "Miễn phí giao hàng":
        - /url: /shop/bang-mach-dien-tu-an-toan
    - group:
      - text: Giảm 20% Có giảm thêm
      - button "Yêu thích"
      - link "Bộ Đồ Chơi Lắp Ráp Gỗ Chuyển Động Gear":
        - /url: /shop/lap-rap-go-chuyen-dong
        - img "Bộ Đồ Chơi Lắp Ráp Gỗ Chuyển Động Gear"
      - text: Nhắn tin | Giảm giá thêm
      - link "Bộ Đồ Chơi Lắp Ráp Gỗ Chuyển Động Gear":
        - /url: /shop/lap-rap-go-chuyen-dong
        - heading "Bộ Đồ Chơi Lắp Ráp Gỗ Chuyển Động Gear" [level=3]
      - paragraph: 612.500 ₫
      - paragraph: 490.000 ₫
      - link "Miễn phí giao hàng":
        - /url: /shop/lap-rap-go-chuyen-dong
    - button "Previous slide" [disabled]
    - button "Next slide"
- contentinfo:
  - heading "ROBOT THÔNG MINH" [level=3]
  - paragraph: CÔNG TY TNHH THƯƠNG MẠI VÀ DỊCH VỤ GTK_REVEILLE
  - list:
    - listitem:
      - strong: "Chi nhánh:"
      - text: Goertek Nam Sơn - Hạp Lĩnh
    - listitem:
      - strong: "Hotline:"
      - text: 0385.333.111
  - link:
    - /url: "#"
    - img
  - link:
    - /url: "#"
    - img
  - link:
    - /url: "#"
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
  - paragraph: © 2026 ROBOT THÔNG MINH. All Rights Reserved.
- region "Notifications alt+T"
- button
- alert
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
  10 |   let adminId: string;
  11 | 
  12 |   test.beforeAll(async () => {
  13 |     // Ensure admin user exists
  14 |     let adminUser = await prisma.user.findUnique({
  15 |       where: { phoneNumber: adminPhone },
  16 |     });
  17 |     if (!adminUser) {
  18 |       adminUser = await prisma.user.create({
  19 |         data: {
  20 |           phoneNumber: adminPhone,
  21 |           name: "Test Admin",
  22 |           role: "ADMIN",
  23 |         },
  24 |       });
  25 |     } else if (adminUser.role !== "ADMIN") {
  26 |       adminUser = await prisma.user.update({
  27 |         where: { phoneNumber: adminPhone },
  28 |         data: { role: "ADMIN" },
  29 |       });
  30 |     }
  31 |     adminId = adminUser.id;
  32 |   });
  33 | 
  34 |   test.afterAll(async () => {
  35 |     // Clean up
  36 |     await prisma.user.deleteMany({ where: { phoneNumber: adminPhone } });
  37 |   });
  38 | 
  39 |   test("should restrict access to non-admins", async ({ page }) => {
  40 |     // Log out first (clear cookies)
  41 |     await page.context().clearCookies();
  42 | 
  43 |     // Attempt to access admin page
  44 |     await page.goto("/admin");
  45 | 
  46 |     // Should be redirected to home page
> 47 |     await expect(page).toHaveURL(/.*localhost:3000\/$/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  48 |   });
  49 | 
  50 |   test("should allow access to admins", async ({ page }) => {
  51 |     // Log in as admin
  52 |     await page.goto("/");
  53 |     await page.locator('button[title="Đăng nhập"]').click();
  54 | 
  55 |     // Switch to OTP login method
  56 |     const otpSwitchBtn = page.locator("button", {
  57 |       hasText: "Đăng nhập bằng OTP (SĐT)",
  58 |     });
  59 |     await expect(otpSwitchBtn).toBeVisible({ timeout: 5000 });
  60 |     await otpSwitchBtn.click();
  61 | 
  62 |     await page.locator('input[type="tel"]').fill("0999999888");
  63 |     await page.locator("button", { hasText: "Tiếp tục bằng SĐT" }).click();
  64 | 
  65 |     await page.waitForTimeout(1000); // Wait for modal animation
  66 |     const otpInputs = page.locator("input");
  67 |     await otpInputs.last().pressSequentially("123456");
  68 | 
  69 |     const verifyBtn = page.locator("button", { hasText: "Xác nhận" });
  70 |     await expect(verifyBtn).toBeEnabled({ timeout: 10000 });
  71 |     await Promise.all([page.waitForNavigation(), verifyBtn.click()]);
  72 | 
  73 |     // Wait for login to complete (modal closes or user is authenticated)
  74 |     await expect(page.locator('button[title="Tài khoản"]')).toBeVisible({
  75 |       timeout: 10000,
  76 |     });
  77 | 
  78 |     // Go to admin page
  79 |     await page.goto("/admin");
  80 |     await expect(page.locator("h2", { hasText: "Tổng quan" })).toBeVisible({
  81 |       timeout: 10000,
  82 |     });
  83 | 
  84 |     // Go to orders page
  85 |     await page.locator("a", { hasText: "Đơn hàng" }).click();
  86 |     await expect(page.locator("h2", { hasText: "Đơn hàng" })).toBeVisible();
  87 |   });
  88 | });
  89 | 
```