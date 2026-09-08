# Runbook vận hành RoboEQ

## Chuẩn bị lần đầu

1. Cài Docker Engine và Docker Compose.
2. Sao chép `.env.example` thành `.env` trên máy chủ và thay toàn bộ giá trị mẫu. Dùng mật khẩu MySQL chỉ gồm ký tự URL-safe, ví dụ `openssl rand -hex 32`, vì mật khẩu nằm trong `DATABASE_URL`.
3. Đặt `NEXTAUTH_URL`, `AUTH_URL` và `NEXT_PUBLIC_APP_URL` về HTTPS của tên miền thật.
4. Cấu hình VNPay Return URL là `https://<domain>/api/vnpay/vnpay_return` và IPN URL là `https://<domain>/api/vnpay/ipn` trong cổng merchant.
5. Xác minh domain gửi email, sau đó cấu hình `EMAIL_API_KEY`, `EMAIL_FROM` và `ADMIN_EMAIL`.
6. Cấu hình `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` và `CLOUDINARY_API_SECRET`, rồi thử upload ảnh trên staging.
7. Điền đúng thông tin công khai của đơn vị bán hàng: `LEGAL_COMPANY_NAME`, `LEGAL_TAX_CODE`, `LEGAL_ADDRESS`, `SUPPORT_PHONE`, `SUPPORT_EMAIL` và `LEGAL_REGISTRATION_NUMBER` nếu có. Đối chiếu lại các trang điều khoản/chính sách sau khi triển khai.
8. Đặt `ROBOEQ_IMAGE` thành tag SHA đã được pipeline xuất bản. Không triển khai bằng tag `latest`.
9. Chỉ mở cổng 80/443 ra Internet. Web bind ở `127.0.0.1:3000`; MySQL và Redis không được public.
10. Cấu hình reverse proxy ghi đè header địa chỉ khách, ví dụ Nginx dùng `proxy_set_header X-Forwarded-For $remote_addr;` và `proxy_set_header X-Real-IP $remote_addr;`. Đặt giới hạn request body khoảng 31 MB để chặn payload lớn trước khi tới Next.js.

Tạo secret bằng trình quản lý mật khẩu hoặc `openssl rand -base64 48`. `NEXTAUTH_SECRET`, `VNP_HASH_SECRET`, `CRON_SECRET`, mật khẩu DB và token SMS phải khác nhau.

Với volume MySQL đã tồn tại từ bản cũ, biến `MYSQL_USER` không tự tạo lại tài khoản. Trước khi chuyển ứng dụng khỏi tài khoản root, đăng nhập MySQL bằng root, tạo user theo `DB_USER`, cấp quyền trên riêng database `DB_NAME`, rồi kiểm tra kết nối bằng `DATABASE_URL` mới.

## Triển khai

```bash
docker compose pull
docker compose up -d
docker compose exec web npx prisma db push
docker compose ps
curl --fail https://<domain>/api/health
```

Pipeline chỉ xuất bản image sau khi npm audit, Prisma validate, toàn bộ migration trên MySQL sạch, ESLint, TypeScript, Next.js build và Playwright E2E đều đạt. Mỗi image có tag SHA để rollback chính xác.

## Đối soát ví Xu và sự kiện

- Chỉ duyệt yêu cầu nạp Xu sau khi khớp số tiền, nội dung chuyển khoản và người gửi trên sao kê. Mã đối soát ngân hàng là bắt buộc và không được dùng lại.
- Tạo sự kiện ở trạng thái tạm dừng. Với vòng quay, tổng tỷ lệ các ô còn hàng phải bằng 100% trước khi kích hoạt.
- Tạm dừng sự kiện trước khi sửa phần thưởng. Sự kiện đã có lượt chơi phải được giữ lại để bảo toàn lịch sử đối soát.
- Kiểm tra các yêu cầu giao vật phẩm và tồn kho giải thưởng mỗi ngày trong thời gian sự kiện chạy.

## Tác vụ định kỳ

Gọi endpoint sau mỗi 5 phút để trả tồn kho của giao dịch VNPay quá hạn:

```bash
curl --fail --request POST \
  --header "Authorization: Bearer $CRON_SECRET" \
  https://<domain>/api/cron/release-expired-orders
```

Không ghi `CRON_SECRET` vào crontab có thể đọc công khai. Dùng tệp environment có quyền `0600` hoặc secret store của nền tảng.

## Sao lưu và phục hồi

Chạy `scripts/backup.sh` hằng ngày. Script tạo MySQL dump đầy đủ, kiểm tra gzip và mặc định giữ 30 ngày. Đồng bộ bản sao sang một vùng lưu trữ khác máy chủ và mã hóa khi lưu.

Kiểm tra phục hồi ít nhất mỗi tháng trên một database tách biệt:

```bash
gunzip --stdout /var/backups/roboeq/web_robot_ai_<timestamp>.sql.gz \
  | docker compose exec -T -e MYSQL_PWD="$DB_ROOT_PASSWORD" mysql \
      mysql --user=root web_robot_ai_restore
```

Không phục hồi đè production trước khi đã xác minh file và có snapshot gần nhất.

## Giám sát

- Probe `/api/health` mỗi phút; cảnh báo sau 3 lần lỗi liên tiếp.
- Cảnh báo theo tỷ lệ HTTP 5xx, lỗi checkout, lỗi IPN và độ trễ database.
- Log ứng dụng phải được chuyển ra hệ thống tập trung, giới hạn quyền đọc và đặt thời hạn lưu.
- Kiểm tra đơn `PENDING` quá 30 phút và giao dịch `PENDING` quá 20 phút.

## Xử lý sự cố thanh toán

1. Không sửa trực tiếp `amountPaid` hoặc `paymentStatus` trong database.
2. Đối chiếu `PaymentTransaction.providerTransactionId`, số tiền và trạng thái trên VNPay.
3. IPN hợp lệ có thể gửi lại; endpoint xử lý idempotent và trả `RspCode=02` nếu đã ghi nhận.
4. Chỉ ADMIN được đối soát VNPay thủ công từ trang quản trị.
5. Hoàn tiền cần qua quy trình RMA/hoàn tiền và phải lưu bằng chứng nhà cung cấp.

## Rollback

Đổi image của service `web` về tag SHA đã chạy ổn định, chạy `docker compose up -d`, rồi kiểm tra health. Không tự động hạ schema. Nếu thay đổi schema không tương thích, phục hồi theo kế hoạch migration và bản backup đã thử nghiệm.
# Cấu hình tích hợp giao vận

Khai báo `LOGISTICS_API_URL` bằng HTTPS và `LOGISTICS_API_KEY` do cổng tích
hợp cấp. Tạo thử vận đơn trên staging trước khi mở tính năng cho nhân viên kho.
