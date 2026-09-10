"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ROUTE_ERROR]", error);
  }, [error]);

  return (
    <main className="container mx-auto flex min-h-[65vh] items-center justify-center px-4 py-12">
      <section className="w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm sm:p-10" role="alert">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-orange-50 text-primary">
          <AlertTriangle className="size-8" aria-hidden="true" />
        </div>
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-primary">RoboEQ</p>
        <h1 className="text-2xl font-black text-neutral-900 sm:text-3xl">Nội dung chưa thể hiển thị</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-600 sm:text-base">
          Hệ thống đã ghi nhận sự cố. Bạn có thể thử tải lại nội dung hoặc trở về trang chủ.
        </p>
        {error.digest && (
          <p className="mt-3 text-xs text-neutral-400">Mã tham chiếu: {error.digest}</p>
        )}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-semibold text-white transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Thử lại
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-5 font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <Home className="size-4" aria-hidden="true" />
            Về trang chủ
          </Link>
        </div>
      </section>
    </main>
  );
}
