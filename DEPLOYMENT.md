# Triển khai production — RoboEQ

Tài liệu này mô tả quy trình đưa code từ `main` lên server production. Đọc trước khi deploy lần đầu; sau đó chỉ cần phần "Deploy thường ngày".

---

## 1. Kiến trúc triển khai

- **CI/CD**: `.github/workflows/docker-build.yml` — khi push lên `main`, GitHub Actions tự động:
  1. Chạy `quality` job: `lint` → `typecheck` → `npm audit` → `prisma validate` → `test:migrations` → `build` → `test:e2e` (Playwright, Chromium).
  2. Nếu qua hết, chạy `build` job: build Docker image và push lên Docker Hub với **2 tag**: `nguyenduy203/web-robot-ai:<commit-sha-đầy-đủ>` và `:latest`.
- **Server**: chạy 3 container qua `docker compose` — `mysql` (`RoboEQ-db`), `redis` (`RoboEQ-redis`), `web` (`RoboEQ-web`).
- **Image dùng trên server**: biến `ROBOEQ_IMAGE` trong `.env` trên server. `docker-compose.yml` **bắt buộc** giá trị này phải là tag cố định theo SHA — không cho phép `:latest`:
  ```
  image: ${ROBOEQ_IMAGE:?ROBOEQ_IMAGE must reference an immutable release tag}
  ```
  Lý do: mỗi lần deploy biết chính xác đang chạy commit nào, và rollback chỉ là đổi lại SHA cũ (mục 4).

---

## 2. Deploy thường ngày (khuyến nghị)

Sau khi push code lên `main` và thấy [GitHub Actions](https://github.com/Duybeo2003/Web_Robot_Ai/actions) chạy job **"Docker Build and Push"** xong (dấu tick xanh):

```bash
cd /var/www/web_robot_ai
bash scripts/deploy.sh
```

Script tự động:
1. `git pull --ff-only origin main`
2. Lấy SHA hiện tại, kiểm tra image `nguyenduy203/web-robot-ai:<sha>` đã tồn tại trên Docker Hub chưa (nếu CI chưa build xong sẽ báo rõ và **dừng lại, không sửa `.env`**).
3. Backup `.env` thành `.env.bak.<timestamp>` trước khi sửa.
4. Cập nhật `ROBOEQ_IMAGE` trong `.env`.
5. `docker compose pull web && docker compose up -d web`.
6. `docker compose exec web npx prisma db push` — áp dụng thay đổi schema (an toàn, không mất dữ liệu nếu chỉ thêm cột/bảng mới).
7. Poll `/api/health` đến khi thấy `"status":"ok"`, tối đa 30 giây.

Nếu bước 6 (`prisma db push`) hỏi xác nhận ("Bạn có chắc muốn mất dữ liệu?") — **đừng tự động trả lời có**. Đây là cảnh báo cho thay đổi có thể xóa dữ liệu thật (đổi kiểu cột, xóa cột…). Đọc kỹ thông báo trước khi gõ `y`.

---

## 3. Deploy thủ công (khi không dùng được script)

```bash
cd /var/www/web_robot_ai
git pull origin main

# Sửa ROBOEQ_IMAGE trong .env thành tag mới, ví dụ:
nano .env
# ROBOEQ_IMAGE=nguyenduy203/web-robot-ai:<commit-sha-đầy-đủ>

docker compose pull web
docker compose up -d web
docker compose exec web npx prisma db push
docker compose logs -f web
```

Kiểm tra sau khi deploy:
```bash
curl http://localhost:3000/api/health
# Kỳ vọng: {"status":"ok",...,"checks":{"database":{"status":"ok",...},"redis":{"status":"ok",...}}}
```

---

## 4. Rollback

Vì mỗi image được ghim theo SHA cụ thể, rollback chỉ là quay lại SHA trước đó:

```bash
cd /var/www/web_robot_ai
sed -i 's|^ROBOEQ_IMAGE=.*|ROBOEQ_IMAGE=nguyenduy203/web-robot-ai:<sha-phiên-bản-cũ>|' .env
docker compose pull web
docker compose up -d web
```

> Rollback **không** tự động hoàn tác thay đổi schema DB đã áp dụng (`prisma db push` không có "undo"). Nếu bản mới có thêm cột mới, các cột đó vẫn còn sau khi rollback — bình thường, code cũ chỉ đơn giản không dùng đến chúng. Chỉ cần lo lắng nếu bản mới đã **xóa hoặc đổi kiểu** cột — trường hợp đó cần khôi phục từ backup DB (`scripts/backup.sh`).

---

## 5. Sự cố đã gặp và đã khắc phục (2026-09)

Để tránh lặp lại khi debug trong tương lai:

- **Build Docker lỗi "Can't reach database server at localhost:3306"**: `/shop/[slug]/page.tsx` gọi `generateStaticParams()` truy vấn DB thật lúc build, trong khi bước build image cố tình dùng `DATABASE_URL` giả (không có DB thật lúc build, chỉ kết nối thật lúc container chạy). Đã bọc try/catch, trả về `[]` nếu không kết nối được — trang vẫn render động lúc runtime.
- **`docker compose exec web npx prisma db push` báo lỗi thiếu file `.wasm`**: `node_modules/.bin/prisma` trên Linux là symlink; `Dockerfile` copy nó như 1 file khiến Docker "giải symlink", làm sai lệch đường dẫn tương đối nội bộ của CLI. Đã sửa: không copy file symlink đó nữa, tự tạo lại symlink đúng trong `Dockerfile` sau khi đã copy đủ `node_modules/prisma`.
- **Migration mới báo "Table 'cart' doesn't exist" trên CI (Linux) dù chạy được ở máy Windows**: MySQL trên Windows không phân biệt hoa/thường tên bảng, Linux thì có. Tên bảng thật trong schema là `Cart`/`Order` (viết hoa, khớp tên model Prisma) — migration đã viết nhầm thường. Luôn đối chiếu case với các migration khác trong `prisma/migrations/` trước khi viết SQL tay.

---

## 6. Biến môi trường liên quan đến deploy

| Biến | Ý nghĩa |
|---|---|
| `ROBOEQ_IMAGE` | `<namespace>/web-robot-ai:<sha>` — bắt buộc, không dùng `:latest` |
| `DB_ROOT_PASSWORD`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Cấu hình MySQL container |
| `DATABASE_URL` | Chuỗi kết nối Prisma dùng bên trong container `web` |
| `REDIS_URL` | Mặc định `redis://redis:6379` trong mạng docker compose nội bộ |

Xem đầy đủ biến môi trường ứng dụng (VNPay, email, Cloudinary…) tại `.env.example` và mục "Biến môi trường quan trọng" trong `CLAUDE.md`.
