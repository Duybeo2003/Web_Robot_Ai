# Runbook vận hành RoboEQ

## Chuẩn bị lần đầu

1. Cài Docker Engine và Docker Compose.
2. Sao chép `.env.example` thành `.env` trên máy chủ và thay toàn bộ giá trị mẫu.
3. Đặt `NEXTAUTH_URL`, `AUTH_URL` và `NEXT_PUBLIC_APP_URL` về HTTPS của tên miền thật.
4. Cấu hình VNPay Return URL là `https://<domain>/api/vnpay/vnpay_return` và IPN URL là `https://<domain>/api/vnpay/ipn` trong cổng merchant.
5. Xác minh domain gửi email, sau đó cấu hình `EMAIL_API_KEY`, `EMAIL_FROM` và `ADMIN_EMAIL`.
6. Điền đúng thông tin công khai của đơn vị bán hàng: `LEGAL_COMPANY_NAME`, `LEGAL_TAX_CODE`, `LEGAL_ADDRESS`, `SUPPORT_PHONE`, `SUPPORT_EMAIL` và `LEGAL_REGISTRATION_NUMBER` nếu có. Đối chiếu lại các trang điều khoản/chính sách sau khi triển khai.
7. Đặt `ROBOEQ_IMAGE` thành tag SHA đã được pipeline xuất bản. Không triển khai bằng tag `latest`.
8. Chỉ mở cổng 80/443 ra Internet. MySQL và Redis không được public.

Tạo secret bằng trình quản lý mật khẩu hoặc `openssl rand -base64 48`. `NEXTAUTH_SECRET`, `VNP_HASH_SECRET`, `CRON_SECRET`, mật khẩu DB và token SMS phải khác nhau.

## Triển khai

```bash
docker compose pull
docker compose up -d
docker compose exec web npx prisma db push
docker compose ps
curl --fail https://<domain>/api/health
```

Pipeline chỉ xuất bản image sau khi Prisma validate, ESLint, TypeScript và Next.js build đều đạt. Mỗi image có tag SHA để rollback chính xác.

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
