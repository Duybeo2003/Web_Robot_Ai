# Cẩm Nang Vận Hành & Quản Trị Web Robot AI

Tài liệu này tổng hợp toàn bộ vòng đời phát triển và quản trị của hệ thống, giúp bạn dễ dàng làm chủ quy trình từ máy cá nhân (Local) lên máy chủ (Server) và ngược lại.

## 1. Quy trình Đẩy Code (Local ➡️ Server)

Mỗi khi bạn (hoặc tôi) code xong một tính năng mới ở máy tính cá nhân (Local), hãy làm theo các bước sau để cập nhật lên Server:

### Bước 1: Đẩy Code từ Local lên Github
Mở Terminal ở máy cá nhân (trong VS Code) và chạy 3 lệnh:
```bash
git add .
git commit -m "Cập nhật tính năng mới"
git push origin main
```

### Bước 2: Kéo Code về Server và Cập nhật
Mở Terminal trên Server (SSH bằng tài khoản root) và chạy lần lượt:
```bash
# 1. Di chuyển vào thư mục dự án
cd /var/www/web_robot_ai

# 2. Kéo code mới nhất về
git pull origin main

# 3. Đóng gói Code mới vào Docker (Có thể tốn 1-2 phút)
docker compose build web

# 4. Khởi động lại trang web ngầm
docker compose up -d
```

> **💡 TIP - Khi nào cần chạy lệnh Database?**
> Nếu trong lần cập nhật code đó có sự thay đổi về cấu trúc Database (thêm bảng mới, cột mới), bạn CẦN CHẠY THÊM lệnh sau. Còn nếu chỉ sửa giao diện thì BỎ QUA lệnh này:
> ```bash
> docker exec -it -u root roboed-web npx prisma db push
> ```

## 2. Quy trình Sao lưu & Phục hồi Dữ liệu trên Server

Dữ liệu (Sản phẩm, Danh mục, Đơn hàng...) luôn là thứ quan trọng nhất. Hãy thường xuyên Backup.

### Bước 1: Sao lưu (Backup) dữ liệu ra file
Chạy lệnh này trên Server để gom toàn bộ dữ liệu lưu vào file `backup.json`:
```bash
# Chạy script gom dữ liệu
docker compose exec -u root web npx tsx scripts/export.ts

# Copy file dữ liệu đó từ bên trong Docker ra ngoài ổ cứng của Server
docker cp roboed-web:/app/backup.json ./backup.json
```

### Bước 2: Phục hồi (Restore) dữ liệu
Nếu một ngày đẹp trời Server bị lỗi, hoặc bạn lỡ tay xóa DB, đây là "thuốc giải":
```bash
# 1. Đưa file backup vào lại Docker
docker cp backup.json roboed-web:/app/backup.json

# 2. Chạy lệnh phục hồi
docker compose exec -u root web npx tsx scripts/import.ts
```

## 3. Quy trình Cấp lại quyền Admin (Sau khi mất dữ liệu)

Khi phục hồi dữ liệu từ số 0, toàn bộ tài khoản người dùng sẽ bị bay màu (vì file backup.json hiện tại chỉ lưu Sản phẩm/Danh mục).

1. Mở trang web và **Đăng nhập bằng Google** bằng tài khoản muốn làm Admin.
2. Lên Terminal Server chạy lệnh:
```bash
docker compose exec -u root web node make_admin.js
```
3. Đăng xuất và đăng nhập lại trên trang web.

## 4. Quy trình Đồng bộ Dữ liệu (Server ➡️ Local)

Đôi khi bạn muốn copy dữ liệu (các sản phẩm bạn đã đăng trên web thật) về máy cá nhân (Local) để test cho chuẩn:

### Bước 1: Backup trên Server
Làm y chang **Mục 2. Bước 1** để tạo ra file `backup.json` mới nhất trên Server.

### Bước 2: Tải file về máy cá nhân
Bạn có thể dùng phần mềm WinSCP, FileZilla hoặc MobaXterm để đăng nhập vào Server (thông tin giống như đăng nhập Putty).
Sau đó vào đường dẫn `/var/www/web_robot_ai`, tìm file `backup.json` và kéo thả tải về máy tính.

### Bước 3: Nạp vào máy cá nhân (Local)
Copy file `backup.json` vừa tải về, ném thẳng vào thư mục `Web_Robot_Ai` trong VS Code (ngang hàng với `package.json`).
Sau đó chạy lệnh sau ở Terminal của VS Code:
```bash
npm run db:import
```

🎉 Hoàn tất! Máy tính Local của bạn đã có 100% dữ liệu giống như web thật.
