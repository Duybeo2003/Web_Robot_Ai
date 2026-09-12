export default function ProfileLoading() {
  return (
    <div className="container mx-auto px-4 py-10 animate-pulse">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-16 w-16 bg-muted rounded-full" />
        <div className="flex flex-col gap-2">
          <div className="h-5 bg-muted rounded w-40" />
          <div className="h-4 bg-muted rounded w-56" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-32 bg-muted rounded-xl" />
        <div className="h-32 bg-muted rounded-xl" />
        <div className="h-32 bg-muted rounded-xl" />
      </div>

      <div className="mt-8 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  );
}
