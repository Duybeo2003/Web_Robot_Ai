import { Skeleton } from "@/components/ui/skeleton";

export function PageLoading() {
  return (
    <div
      className="container mx-auto flex min-h-[55vh] w-full flex-col justify-center px-4 py-10"
      role="status"
      aria-live="polite"
      aria-label="Đang tải nội dung"
    >
      <div className="mx-auto w-full max-w-6xl motion-safe:animate-pulse">
        <div className="mb-8 space-y-3">
          <Skeleton className="h-8 w-52 max-w-full rounded-lg" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="overflow-hidden rounded-xl border border-neutral-200 bg-white p-3 sm:p-4"
            >
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
              <Skeleton className="mt-5 h-6 w-1/2" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">RoboEQ đang chuẩn bị nội dung, vui lòng chờ.</span>
    </div>
  );
}
