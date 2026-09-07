import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[65vh] items-center justify-center bg-neutral-50 px-4 py-16 text-center">
      <div className="max-w-lg">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-[#FF5722]">Lỗi 404</p>
        <h1 className="mb-4 text-4xl font-black text-neutral-900">Không tìm thấy trang</h1>
        <p className="mb-8 text-neutral-600">Địa chỉ có thể đã thay đổi hoặc nội dung không còn tồn tại.</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="rounded-lg bg-[#FF5722] px-6 py-3 font-semibold text-white hover:bg-[#E64A19]" href="/">
            Về trang chủ
          </Link>
          <Link className="rounded-lg border border-neutral-300 bg-white px-6 py-3 font-semibold text-neutral-800 hover:bg-neutral-100" href="/shop">
            Xem sản phẩm
          </Link>
        </div>
      </div>
    </main>
  );
}
