export default function HomeLoading() {
  return (
    <div className="flex flex-col gap-16 py-8 animate-pulse">
      {/* Hero skeleton */}
      <div className="h-[420px] bg-muted rounded-3xl mx-4" />

      {/* Product grid skeleton */}
      <div className="container mx-auto px-4">
        <div className="h-8 bg-muted rounded w-48 mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col rounded-2xl overflow-hidden border border-border">
              <div className="h-44 bg-muted" />
              <div className="p-4 flex flex-col gap-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
