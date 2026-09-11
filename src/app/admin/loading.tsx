export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 w-32 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-xl border border-border">
        {/* Table header */}
        <div className="flex gap-4 border-b border-border bg-muted/40 px-4 py-3">
          {[20, 30, 15, 20, 15].map((w, i) => (
            <div
              key={i}
              className="h-4 animate-pulse rounded bg-muted"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 border-b border-border/50 px-4 py-4 last:border-0"
          >
            {[20, 30, 15, 20, 15].map((w, j) => (
              <div
                key={j}
                className="h-4 animate-pulse rounded bg-muted"
                style={{ width: `${w}%`, opacity: 1 - i * 0.08 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
