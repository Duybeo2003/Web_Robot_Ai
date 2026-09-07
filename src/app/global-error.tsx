"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="vi">
      <body className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 font-sans text-neutral-900">
        <main className="max-w-lg text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-[#FF5722]">RoboEQ</p>
          <h1 className="mb-4 text-3xl font-black">Hệ thống đang gặp sự cố</h1>
          <p className="mb-8 text-neutral-600">Chúng tôi đã ghi nhận lỗi. Bạn có thể thử tải lại thao tác vừa thực hiện.</p>
          <button className="rounded-lg bg-[#FF5722] px-6 py-3 font-semibold text-white hover:bg-[#E64A19]" onClick={reset}>
            Thử lại
          </button>
        </main>
      </body>
    </html>
  );
}
