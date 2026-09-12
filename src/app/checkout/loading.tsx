export default function CheckoutLoading() {
  return (
    <div className="container mx-auto px-4 py-10 animate-pulse max-w-4xl">
      <div className="h-8 bg-muted rounded w-40 mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form skeleton */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="h-6 bg-muted rounded w-36 mb-2" />
          <div className="h-12 bg-muted rounded-xl" />
          <div className="h-12 bg-muted rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 bg-muted rounded-xl" />
            <div className="h-12 bg-muted rounded-xl" />
          </div>
          <div className="h-12 bg-muted rounded-xl" />
          <div className="h-6 bg-muted rounded w-36 mt-4 mb-2" />
          <div className="h-12 bg-muted rounded-xl" />
          <div className="h-12 bg-muted rounded-xl" />
        </div>

        {/* Order summary skeleton */}
        <div className="lg:col-span-2">
          <div className="h-6 bg-muted rounded w-36 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-16 w-16 bg-muted rounded-lg shrink-0" />
                <div className="flex flex-col gap-2 flex-1">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 h-48 bg-muted rounded-xl" />
        </div>
      </div>
    </div>
  );
}
