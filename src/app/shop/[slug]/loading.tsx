export default function ProductLoading() {
  return (
    <div className="container mx-auto px-4 py-10 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image skeleton */}
        <div className="aspect-square bg-muted rounded-2xl" />

        {/* Info skeleton */}
        <div className="flex flex-col gap-4">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-full mt-2" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-4 bg-muted rounded w-4/6" />
          <div className="flex gap-3 mt-6">
            <div className="h-12 bg-muted rounded-xl flex-1" />
            <div className="h-12 w-12 bg-muted rounded-xl" />
          </div>
        </div>
      </div>

      {/* Reviews skeleton */}
      <div className="mt-16">
        <div className="h-6 bg-muted rounded w-36 mb-6" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 mb-6">
            <div className="h-10 w-10 bg-muted rounded-full shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-4 bg-muted rounded w-32" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
