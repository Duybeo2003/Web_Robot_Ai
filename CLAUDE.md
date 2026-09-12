# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

---

## Tổng quan dự án

**RoboEQ** là nền tảng thương mại điện tử bán đồ chơi giáo dục, robotics và STEM tại Việt Nam. Stack chính: Next.js 16 App Router + React 19 + TypeScript 5 + MySQL 8 + Redis 7 + Prisma ORM + NextAuth v5.

---

## 1. Lệnh thường dùng

### Phát triển

```bash
npm run dev              # Khởi động dev server (Turbopack)
npm run build            # Build production
npm run start            # Chạy production server
```

### Kiểm tra & lint

```bash
npm run lint             # ESLint
npm run typecheck        # TypeScript kiểm tra kiểu (không emit)
npm run check            # Chạy tuần tự: lint + typecheck + build (dùng trước PR)
```

### Kiểm thử

```bash
npm run test:e2e         # Playwright E2E (yêu cầu server đang chạy tại localhost:3000)
npm run test:migrations  # Kiểm tra tất cả Prisma migration có áp dụng được không
# E2E tests nằm tại: tests/e2e/auth.spec.ts, shop.spec.ts, admin.spec.ts
```

### Database

```bash
npx prisma generate           # Tái tạo Prisma client (tự chạy qua postinstall)
npx prisma migrate dev        # Tạo và áp dụng migration mới (dev)
npx prisma db push            # Đồng bộ schema không tạo migration (dev nhanh)
npx prisma studio             # Mở Prisma Studio GUI
npm run bootstrap:admin       # Tạo tài khoản admin ban đầu (chỉ chạy một lần)
npm run test:migrations       # Xác minh toàn bộ migration chạy sạch
```

### Docker (production)

```bash
docker compose up -d                              # Khởi động toàn bộ stack (MySQL, Redis, Next.js)
docker compose exec web npx prisma db push        # Áp dụng thay đổi schema trong production
docker compose logs -f web                        # Theo dõi log ứng dụng
```

> **Lưu ý quan trọng:** Mỗi khi sửa `prisma/schema.prisma`, phải hướng dẫn người dùng chạy `docker compose exec web npx prisma db push` trong môi trường production.

### Trước khi tạo PR

```bash
npm run lint
npm run typecheck
npm audit --audit-level=moderate
npx prisma validate
npm run test:migrations
npm run build
npm run test:e2e
```

---

## 2. Cấu trúc thư mục chính

```
src/
├── app/                    # Next.js App Router — toàn bộ routing
│   ├── (shop)/             # Storefront công khai (trang chủ, sản phẩm, checkout)
│   ├── admin/              # Dashboard quản trị (role-gated)
│   ├── auth/               # Trang đăng nhập / OTP
│   ├── api/                # Route handlers: webhook (VNPay IPN), cron, và các việc
│   │                       # Server Action không làm được (streaming AI chat, upload
│   │                       # multipart, health check, cart sync qua sendBeacon)
│   ├── layout.tsx          # Root layout — Providers, AuthModal, CartSyncer
│   ├── error.tsx           # Global error boundary
│   └── not-found.tsx       # 404 page
│
├── actions/                # Server Actions — MỌI mutation đều đi qua đây (25 file)
│   ├── checkout.ts         # Luồng đặt hàng và thanh toán (625 dòng)
│   ├── order.ts            # Chuyển trạng thái đơn, hủy đơn (412 dòng)
│   ├── event.ts            # Sự kiện gamification, vòng quay may mắn (316 dòng)
│   ├── admin-event.ts      # Quản trị sự kiện/flash sale (294 dòng)
│   ├── admin-products.ts   # CRUD sản phẩm phía admin (232 dòng)
│   ├── admin-catalog.ts    # Category, coupon, review, settings (223 dòng)
│   ├── inventory.ts        # Nhập/xuất kho, kiểm kho (206 dòng)
│   ├── rma.ts              # Trả hàng, bảo hành
│   ├── admin-wallet.ts, admin-users.ts, admin-delivery.ts, admin-support.ts
│   │                       # CRUD admin theo từng domain (tách nhỏ từ admin.ts cũ)
│   ├── wallet.ts           # Ví "Robo Xu" (tiền ảo)
│   ├── commission.ts       # Hoa hồng affiliate/CTV
│   ├── article.ts, review.ts, coupon.ts, contact.ts, warranty.ts, wishlist.ts
│   ├── user.ts, user-inventory.ts, auth.ts, shop.ts, product.ts
│   └── admin.ts            # ⚠️ Deprecated — chỉ re-export từ các file admin-*.ts,
│                            # KHÔNG thêm code mới vào đây, import trực tiếp từ file gốc
│
├── lib/                    # Thư viện hạ tầng & tiện ích lõi
│   ├── prisma.ts           # Singleton PrismaClient
│   ├── redis.ts            # Singleton ioredis
│   ├── authz.ts            # requireUser(), requireRole() — dùng trong mọi action
│   ├── rbac.ts             # canAccessAdminPath(), adminLandingPage()
│   ├── audit.ts            # recordAudit() — log mọi thay đổi dữ liệu admin
│   ├── logger.ts           # logger.info/warn/error() — JSON structured logging
│   ├── rate-limit.ts       # checkRateLimit() — Redis fixed-window
│   ├── vnpay.ts            # createVnPayUrl() — ký HMAC-SHA256
│   ├── email.ts            # Gửi email qua Resend API
│   ├── cloudinary.ts       # Upload/xóa ảnh Cloudinary
│   ├── commerce-policy.ts  # Hằng số kinh doanh (RETURN_WINDOW_DAYS, v.v.)
│   ├── utils.ts            # cn() (clsx+twMerge), generateSlug()
│   ├── phone.ts            # normalizeVietnamPhone()
│   ├── media-url.ts        # isAllowedImageUrl(), isAllowedVideoUrl()
│   ├── order-access.ts     # Token truy cập đơn hàng cho khách vãng lai
│   ├── store/cart.ts       # Zustand cart store (persist localStorage)
│   ├── payments/           # Logic thanh toán VNPay settlement
│   └── orders/             # cancel-order.ts, lock-order.ts
│
├── components/
│   ├── ui/                 # 28 primitives Shadcn/ui (Button, Dialog, Input…)
│   ├── admin/              # AppSidebar, Breadcrumbs, RevenueChart
│   ├── layout/             # Header, Footer, FloatingSocialBar
│   └── *.tsx               # Các component dùng chung (AuthModal, CartSheet…)
│
├── store/                  # Zustand stores UI-only (không persist)
│   ├── use-auth-modal.ts   # isOpen, openModal, closeModal
│   └── use-cart-ui.ts      # isOpen, openCart, closeCart
│
├── types/                  # TypeScript type definitions
│   ├── product.ts          # Interface Product
│   └── next-auth.d.ts      # Module augmentation Session, User, JWT
│
├── hooks/                  # Custom React hooks
├── auth.ts                 # Cấu hình NextAuth (Credentials + Google + Facebook + OTP)
├── proxy.ts                # Next.js 16: thay thế middleware.ts cũ. Route protection
│                           # (session + RBAC qua canAccessAdminPath/adminLandingPage),
│                           # rate limit in-memory, VÀ gate quyền xem đơn khách vãng lai
│                           # cho /checkout/success/[id] (xem lý do ở mục 3) — sửa ở đây,
│                           # KHÔNG tạo lại middleware.ts (không còn được Next.js dùng)
└── instrumentation.ts      # Khởi động ứng dụng (chạy một lần khi server start)

prisma/
├── schema.prisma           # 26 model, đầy đủ enum, relations
└── migrations/             # Migration history (không chỉnh sửa tay)

tests/                      # Playwright E2E tests
scripts/                    # bootstrap-admin.mjs, verify-migrations.mjs, backup.sh
```

---

## 3. Kiến trúc luồng đặt hàng & thanh toán

Đây là luồng phức tạp nhất trong hệ thống, trải dài qua nhiều file — đọc phần này trước khi sửa bất kỳ thứ gì liên quan đến order/payment.

**Vòng đời đơn hàng** (`processCheckout` trong `checkout.ts`):
1. Validate Zod + rate limit (theo user/phone và theo IP fingerprint riêng biệt).
2. Khách vãng lai (guest) được phép đặt hàng — xác thực bằng OTP số điện thoại thay vì `requireUser()` (xem ngoại lệ ở mục 5). Guest được cấp `guestAccessToken` (hash lưu DB) để tra cứu đơn sau này qua `order-access.ts`.
3. Toàn bộ trong `prisma.$transaction`: trừ tồn kho bằng `updateMany` có điều kiện `inventoryCount: { gte: quantity }` (atomic, tránh oversell do race condition) — **không** đọc rồi ghi riêng lẻ.
4. `idempotencyKey` (UUID từ client) là unique constraint trên `Order` — nếu request bị retry, code bắt lỗi Prisma `P2002` và trả về đơn đã tồn tại thay vì tạo trùng.
5. Với đơn cần thanh toán, set `inventoryReservedUntil` (30 phút cho VNPay, 24h cho chuyển khoản — hằng số trong `commerce-policy.ts`) — cron `release-expired-orders` sẽ huỷ đơn hết hạn và hoàn kho.

**Xác nhận thanh toán VNPay** (`settleVnPayPayment` trong `lib/payments/vnpay-settlement.ts`, gọi từ `/api/vnpay/ipn` và `/api/vnpay/vnpay_return`):
- Luôn `lockOrderRow()` (`SELECT ... FOR UPDATE`) trước khi đọc/ghi Order trong transaction — bắt buộc vì IPN và return URL có thể tới gần như đồng thời.
- Idempotent theo thiết kế: kiểm tra `paymentTransaction.status === "SUCCEEDED"` hoặc có sibling SUCCEEDED trước khi ghi — gọi lại nhiều lần không tạo side-effect kép.
- Có nhánh xử lý riêng khi đơn đã bị hủy nhưng tiền vẫn về (`captured-after-cancellation`) — đánh dấu cần hoàn tiền thủ công qua `auditLog`, không tự động refund.
- **Không sửa logic HMAC-SHA512 trong `vnpay.ts`** (đã ghi ở mục 5) — mọi thay đổi ở `verifyVnPayReturn`/`createVnPayUrl` ảnh hưởng trực tiếp đến việc xác thực callback từ VNPay.

**Hủy đơn & hoàn kho** (`cancelOrderAndRestoreInventory` trong `lib/orders/cancel-order.ts`): hàm dùng chung cho mọi luồng hủy đơn (user tự hủy, admin hủy, cron hết hạn) — luôn `lockOrderRow()` trước, hoàn tồn kho + flash-sale stock, hoàn điểm thưởng đã dùng, giảm `usageCount` coupon, và hủy `Commission` đang `PENDING`. Khi cần thêm một luồng hủy đơn mới, **tái sử dụng hàm này** thay vì viết lại logic hoàn kho.

**⚠️ `notFound()` không trả đúng status code nếu route nằm dưới `loading.tsx`** (kể cả `loading.tsx` gốc ở `src/app/`, áp dụng cho MỌI route không có `loading.tsx` riêng đè lên): route được bọc ngầm trong `<Suspense>`, response đã bắt đầu stream với status 200 trước khi phần thân trang (nơi gọi `notFound()`) chạy xong — nội dung hiển thị đúng "không tìm thấy" nhưng HTTP status vẫn là 200. Đây là hành vi App Router đã có từ lâu (không riêng Next 16), chỉ lộ ra khi có test kiểm tra status code thay vì nội dung. Đã gặp và sửa ở `checkout/success/[id]`: chuyển kiểm tra `guestAccessToken`/quyền xem đơn lên `proxy.ts` (chạy trước khi stream bắt đầu) — page vẫn giữ nguyên check của nó làm lớp phòng thủ thứ hai. Nếu thêm trang mới dùng `notFound()` để gate quyền truy cập (không chỉ để báo "record không tồn tại"), cân nhắc pattern tương tự hoặc ít nhất đừng giả định status code luôn đúng — test bằng nội dung trang, không chỉ bằng response status, trừ khi đã gate ở `proxy.ts`.

## 4. Quy chuẩn viết code

### Đặt tên file

| Loại | Convention | Ví dụ |
|---|---|---|
| Page / Layout | `page.tsx`, `layout.tsx` | `src/app/shop/page.tsx` |
| Server Action file | `camelCase.ts` | `src/actions/checkout.ts` |
| Component file | `PascalCase.tsx` hoặc `kebab-case.tsx` | `AuthModal.tsx`, `cart-sheet.tsx` |
| Lib utility | `kebab-case.ts` | `rate-limit.ts`, `order-access.ts` |
| Zustand store | `use-<name>.ts` | `use-auth-modal.ts` |
| Type file | `camelCase.ts` hoặc `kebab-case.d.ts` | `product.ts`, `next-auth.d.ts` |

### Đặt tên hàm / biến

- **Function & variable**: `camelCase` — `processCheckout`, `requireRole`, `cartItems`
- **React component**: `PascalCase` — `AuthModal`, `AddToCartButton`
- **Interface / Type**: `PascalCase` — `CartItem`, `CartStore`
- **Enum value** (Prisma): `UPPER_SNAKE_CASE` — `ORDER_STATUS.PENDING`, `Role.ADMIN`
- **Hằng số**: `UPPER_SNAKE_CASE` — `RETURN_WINDOW_DAYS`, `VNPAY_RESERVATION_MINUTES`
- **Path alias**: Luôn dùng `@/*` thay vì relative path khi import từ `src/`

### Pattern Server Action (bắt buộc)

Mọi Server Action phải tuân theo cấu trúc sau:

```typescript
"use server";

export async function actionName(input: unknown) {
  // 1. Kiểm tra quyền truy cập
  const user = await requireRole("ADMIN"); // hoặc requireUser()

  // 2. Validate input bằng Zod
  const data = someSchema.parse(input); // ném lỗi nếu invalid

  try {
    // 3. Business logic — dùng $transaction cho multi-step writes
    await prisma.$transaction(async (tx) => {
      // ...
    });

    // 4. Invalidate cache
    revalidatePath("/admin/orders");

    // 5. Audit log (bắt buộc với admin mutation)
    await recordAudit({ action: "UPDATE_ORDER", model: "Order", recordId: data.id, ... });

    return { success: true };
  } catch (error) {
    logger.error("action.name_failed", { error, userId: user.id });
    return { success: false, error: "Thông báo lỗi thân thiện với người dùng" };
  }
}
```

**Quy tắc return type:**
- Thành công: `{ success: true }` hoặc `{ success: true, data: ... }`
- Thất bại: `{ success: false, error: string }`
- **Không bao giờ throw từ Server Action** (người dùng sẽ thấy lỗi xấu)

> Toàn bộ `src/actions/*.ts` đã được đồng bộ về đúng quy tắc `{ success: false, error }` / `{ success: true, ... }` ở trên (2026-09: đã sửa 6 file từng thiếu `success: false` — `checkout.ts`, `article.ts`, `inventory.ts`, `rma.ts`, `user.ts`, `warranty.ts`). **Ngoại lệ duy nhất còn lại:** `contact.ts` (`submitContactRequest`) dùng type riêng `ContactActionState = { success: true; message } | { success: false; message }` — có chủ đích, vì UI luôn hiển thị `state.message` (thành công lẫn thất bại) dạng một dòng trạng thái duy nhất, không phải action lỗi thời. Action MỚI vẫn nên theo `{ success, error }` chuẩn; chỉ dùng pattern `message` kiểu `contact.ts` khi thật sự cần "submit rồi hiển thị 1 thông báo trạng thái" giống vậy.

### Pattern Authorization

```typescript
// Bất kỳ route/action nào cần auth
import { requireRole } from "@/lib/authz";

// Yêu cầu đăng nhập (bất kỳ role nào)
const user = await requireUser();

// Yêu cầu role cụ thể (sẽ throw AuthorizationError nếu không đủ quyền)
const user = await requireRole("ADMIN", "STORE_MANAGER");
```

### Pattern Validation (Zod)

```typescript
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^(?:\+84|0)[0-9]{9,10}$/),
  amount: z.number().int().positive(),
});

// Trong Server Action: dùng .parse() (throw nếu lỗi)
const data = schema.parse(rawInput);

// Trong form client: dùng .safeParse() để hiển thị lỗi
const result = schema.safeParse(rawInput);
```

### Pattern Component

```typescript
// Component server (mặc định — không cần khai báo gì)
export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } });
  // ...
}

// Component client — phải khai báo đầu file
"use client";
export function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  // ...
}
```

**Hydration safety** cho client component đọc localStorage:

```typescript
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;
```

### Pattern Zustand Store

```typescript
import { create } from "zustand";

interface MyState {
  value: boolean;
  setValue: (v: boolean) => void;
}

export const useMyStore = create<MyState>((set) => ({
  value: false,
  setValue: (v) => set({ value: v }),
}));

// Với persistence (chỉ dùng cho cart):
import { persist } from "zustand/middleware";
export const useCartStore = create(persist<CartStore>(..., { name: "RoboEQ-cart" }));
```

### Logger

```typescript
import { logger } from "@/lib/logger";

logger.info("checkout.initiated", { userId, itemCount });
logger.warn("rate_limit.hit", { ip, endpoint });
logger.error("payment.failed", { error, orderId });
```

### Utility quan trọng

```typescript
// Merge Tailwind classes (dùng mọi nơi thay vì string concatenation)
import { cn } from "@/lib/utils";
className={cn("base-class", condition && "conditional-class", className)}

// Slug tiếng Việt
import { generateSlug } from "@/lib/utils";
const slug = generateSlug("Đồ chơi STEM cho bé"); // → "do-choi-stem-cho-be"

// Chuẩn hóa số điện thoại Việt Nam
import { normalizeVietnamPhone } from "@/lib/phone";
const phone = normalizeVietnamPhone("0912345678"); // → "+84912345678"
```

---

## 5. Lưu ý và hạn chế cần tránh

### Kiến trúc

- **Không tạo REST API endpoint mới** cho business logic — dùng Server Actions. Route handlers (`/api/`) chỉ dành cho webhook (VNPay IPN, cron jobs), callback bên ngoài, và các trường hợp Server Action không đáp ứng được (streaming response như `/api/chat`, upload multipart, health check, cart sync qua `sendBeacon`).
- **Không import trực tiếp** `prisma` hay `redis` singleton trong Client Component — chỉ được dùng trong Server Component, Server Action, và Route Handler.
- **Không bỏ qua** `requireUser()` / `requireRole()` trong bất kỳ Server Action nào có mutation gắn với một user đã đăng nhập. Ngoại lệ duy nhất đã biết: `processCheckout` trong `checkout.ts` cố tình cho phép khách vãng lai (guest) đặt hàng không cần đăng nhập — thay vào đó tự xác thực bằng OTP số điện thoại (`hashOtp`) + rate limit theo cả tài khoản lẫn địa chỉ IP. Nếu thêm luồng guest mới, làm theo đúng cơ chế xác thực thay thế này, đừng bỏ xác thực hoàn toàn.
- **Không dùng `any` tường minh** nếu có thể tránh — ESLint tắt rule nhưng không có nghĩa là nên dùng.

### Database

- **Luôn dùng `$transaction`** khi có nhiều hơn một write liên quan — tránh inconsistent state.
- **Không xóa cứng (hard delete)** Product hay User — dùng soft delete (`deletedAt`).
- **Không chỉnh sửa tay** file trong `prisma/migrations/` — chỉ tạo migration mới qua `prisma migrate dev`.
- **Không dùng `prisma db push` trong production** để tạo migration — chỉ dùng cho dev nhanh hoặc Docker production theo hướng dẫn.

### Bảo mật

- **Không bỏ rate limiting** trên bất kỳ endpoint auth nào — dùng `checkRateLimit()` từ `@/lib/rate-limit`.
- **Không lưu image ngoài Cloudinary** hoặc các domain đã whitelist trong `media-url.ts`.
- **Không commit** `.env`, secret keys, hay credentials vào git.
- **Không thêm domain mới** vào `remotePatterns` trong `next.config.ts` mà không xem xét CSP.
- **Không bỏ audit log** (`recordAudit`) khi thực hiện admin mutation.

### Thanh toán

- **Luôn dùng `idempotencyKey`** (UUID) khi tạo đơn hàng — ngăn duplicate order khi retry.
- **Không thay đổi logic HMAC-SHA256** trong `vnpay.ts` — ảnh hưởng đến toàn bộ luồng thanh toán.
- Hằng số kinh doanh (thời hạn, phí, chính sách) nằm trong `src/lib/commerce-policy.ts` — không hardcode rải rác.

### UI / Component

- **Luôn dùng `cn()`** từ `@/lib/utils` để merge Tailwind classes — không dùng string template.
- **Không import component UI bên ngoài `@/components/ui/`** khi Shadcn đã có — tránh trùng lặp.
- **Admin page** bắt buộc có `export const dynamic = 'force-dynamic'` — tránh cache dữ liệu nhạy cảm.
- **Không dùng `suppressHydrationWarning`** tùy tiện — chỉ được dùng trên `<html>` và `<body>` ở root layout.

### Testing

- E2E Playwright chỉ chạy trên Chromium — không viết test phụ thuộc vào behavior của Firefox/Safari.
- Không dùng `page.waitForTimeout()` — dùng `page.waitForSelector()` hoặc `page.waitForResponse()`.

---

## 6. Biến môi trường quan trọng

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `DATABASE_URL` | Có | MySQL connection string |
| `REDIS_URL` | Có | Redis connection string |
| `AUTH_SECRET` | Có | NextAuth secret (≥32 ký tự ngẫu nhiên) |
| `AUTH_URL` | Có | URL ứng dụng (HTTPS trong production) |
| `VNP_TMN_CODE`, `VNP_HASH_SECRET` | Có | Thông tin merchant VNPay |
| `VNP_URL`, `VNP_RETURN_URL` | Có | Endpoint VNPay |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Có | Lưu trữ ảnh |
| `EMAIL_API_KEY`, `EMAIL_FROM` | Có | Gửi email qua Resend |
| `LEGAL_COMPANY_NAME`, `LEGAL_TAX_CODE`, `SUPPORT_PHONE` | Có | Thông tin pháp lý bắt buộc hiển thị |
| `CRON_SECRET` | Có | Xác thực webhook cron job |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Không | Đăng nhập Google OAuth |
| `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` | Không | Đăng nhập Facebook OAuth |
| `SMS_WEBHOOK_URL`, `SMS_WEBHOOK_TOKEN` | Không | Gửi OTP qua SMS |
| `OPENROUTER_API_KEY` | Không | Tích hợp LLM (tính năng AI) |
