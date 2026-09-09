# Cẩm nang quản trị RoboEQ

`RUNBOOK.md` là tài liệu chuẩn cho triển khai, migration, sao lưu, phục hồi, giám sát, cron và xử lý sự cố. Không chạy các script sao chép dữ liệu cũ hoặc chỉnh trực tiếp database production.

## Phát hành phiên bản

1. Tạo pull request và chỉ hợp nhất khi workflow CI đạt đầy đủ.
2. Chọn image theo tag SHA do workflow Docker phát hành và đặt vào `ROBOEQ_IMAGE`.
3. Làm theo mục **Triển khai** trong `RUNBOOK.md`, áp dụng schema rồi kiểm tra `/api/health`.
4. Kiểm tra nhanh đăng nhập, tìm kiếm sản phẩm, checkout, trang quản trị đơn hàng và trang kho trên production.

## Tạo quản trị viên đầu tiên

Chỉ thực hiện sau khi schema đã được áp dụng và khi hệ thống chưa có quản trị viên hoạt động. Nhập bí mật trong phiên shell riêng để mật khẩu không nằm trong lịch sử lệnh:

```bash
read -r -p "Email quản trị: " BOOTSTRAP_ADMIN_EMAIL
read -r -s -p "Mật khẩu quản trị (tối thiểu 16 ký tự): " BOOTSTRAP_ADMIN_PASSWORD
echo
export BOOTSTRAP_ADMIN_EMAIL BOOTSTRAP_ADMIN_PASSWORD
export BOOTSTRAP_ADMIN_CONFIRM=CREATE_INITIAL_ADMIN
docker compose exec \
  -e BOOTSTRAP_ADMIN_EMAIL \
  -e BOOTSTRAP_ADMIN_PASSWORD \
  -e BOOTSTRAP_ADMIN_CONFIRM \
  web npm run bootstrap:admin
unset BOOTSTRAP_ADMIN_EMAIL BOOTSTRAP_ADMIN_PASSWORD BOOTSTRAP_ADMIN_CONFIRM
```

Lệnh tự từ chối khi đã có một admin hoạt động và ghi sự kiện bootstrap vào audit log. Các tài khoản nhân viên tiếp theo phải được tạo trong **Quản trị → Nhân sự quản trị** để giữ đúng phân quyền và lịch sử kiểm toán.

## Công việc hằng ngày

- Đối soát thanh toán, hoàn tiền, hoa hồng, ví Xu và biến động kho theo chứng từ.
- Xử lý yêu cầu hỗ trợ, bảo hành, đổi trả và đánh giá đang chờ.
- Theo dõi cảnh báo health, HTTP 5xx, checkout, IPN, database và Redis.
- Xác nhận bản sao lưu hằng ngày và diễn tập phục hồi theo lịch trong `RUNBOOK.md`.
