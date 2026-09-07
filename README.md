# RoboEQ

RoboEQ là nền tảng thương mại điện tử cho robot giáo dục, kit STEM và đồ chơi tư duy. Ứng dụng dùng Next.js 16, React 19, Prisma/MySQL, Redis, Auth.js và tích hợp VNPay.

## Phát triển cục bộ

Yêu cầu Node.js 22, MySQL 8 và Redis 7.

```bash
cp .env.example .env
npm ci
npx prisma generate
npx prisma db push
npm run dev
```

Các lệnh kiểm tra bắt buộc trước khi tạo pull request:

```bash
npm run lint
npm run typecheck
npm run build
```

## Cấu trúc chính

- `src/app`: giao diện và Route Handlers theo Next.js App Router.
- `src/actions`: Server Actions; mọi mutation quản trị phải kiểm tra quyền ở máy chủ.
- `src/lib`: xác thực quyền, thanh toán, tồn kho, rate limit và hạ tầng.
- `prisma/schema.prisma`: mô hình dữ liệu MySQL.
- `prisma/migrations`: thay đổi cơ sở dữ liệu có phiên bản.
- `RUNBOOK.md`: triển khai, giám sát, sao lưu và xử lý sự cố.
- `SECURITY.md`: cách báo cáo lỗ hổng và yêu cầu bảo mật.

## Production

Image Docker chạy bằng user không đặc quyền và có healthcheck tại `/api/health`. Sao chép `.env.example`, thay toàn bộ giá trị mẫu bằng secret thật, sau đó làm theo `RUNBOOK.md`. Không commit tệp `.env`, bản sao dữ liệu hoặc log runtime.
