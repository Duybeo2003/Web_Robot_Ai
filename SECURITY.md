# Chính sách bảo mật

Không tạo issue công khai cho lỗ hổng có thể làm lộ tài khoản, dữ liệu khách hàng, thanh toán hoặc quyền quản trị. Gửi báo cáo riêng cho chủ dự án với mô tả, bước tái hiện, mức ảnh hưởng và bản vá đề xuất.

## Yêu cầu vận hành

- Bắt buộc HTTPS ở production và đặt reverse proxy tin cậy trước ứng dụng.
- Reverse proxy phải ghi đè `X-Forwarded-For` và `X-Real-IP` bằng địa chỉ kết nối thật; không nối tiếp giá trị do client gửi. Ứng dụng dùng địa chỉ đầu tiên trong các header này cho giới hạn tần suất.
- Không commit secret, `.env`, database dump, log hay ảnh chứa dữ liệu khách hàng.
- Cấp quyền ADMIN, STORE_MANAGER và EDITOR theo nguyên tắc tối thiểu; thu hồi ngay khi nhân sự đổi vai trò.
- Xoay secret sau sự cố và vô hiệu hóa phiên đăng nhập liên quan.
- Cập nhật dependency theo pull request riêng, chạy CI và xem thay đổi breaking trước khi deploy.
- Chỉ callback VNPay có checksum hợp lệ mới được xử lý; IPN là nguồn xác nhận thanh toán chính.

Các log hỗ trợ điều tra không được chứa OTP, mật khẩu, token truy cập, full cookie hoặc secret nhà cung cấp.
