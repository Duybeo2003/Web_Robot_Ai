"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GLOBAL_ERROR]", error);
  }, [error]);

  return (
    <html lang="vi">
      <body className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 font-sans text-neutral-900">
        <main className="w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm sm:p-10" role="alert">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-orange-50 text-3xl" aria-hidden="true">
            ⚠
          </div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-primary">RoboEQ</p>
          <h1 className="text-2xl font-black sm:text-3xl">Hệ thống đang gặp sự cố</h1>
          <p className="mx-auto mt-3 max-w-md leading-6 text-neutral-600">
            Hệ thống đã ghi nhận lỗi. Bạn có thể thử lại hoặc trở về trang chủ.
          </p>
          {error.digest && (
            <p className="mt-3 text-xs text-neutral-400">Mã tham chiếu: {error.digest}</p>
          )}
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              className="min-h-11 rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              onClick={reset}
            >
              Thử lại
            </button>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-neutral-300 bg-white px-6 font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Về trang chủ
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
