import { Loader2 } from "lucide-react";

export default function ShopLoading() {
  return (
    <div className="container mx-auto px-4 py-12 flex-1 bg-background">
      <div className="mb-10 text-center md:text-left animate-pulse">
        <div className="h-10 bg-muted rounded w-48 mb-4 mx-auto md:mx-0" />
        <div className="h-6 bg-muted rounded w-full max-w-2xl mx-auto md:mx-0" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card rounded-sm overflow-hidden flex flex-col h-[400px] animate-pulse">
            <div className="h-60 bg-muted w-full" />
            <div className="p-6 flex flex-col flex-1">
              <div className="h-4 bg-muted rounded w-20 mb-3" />
              <div className="h-6 bg-muted rounded w-full mb-2" />
              <div className="mt-auto flex justify-between items-center">
                <div className="h-6 bg-muted rounded w-24" />
                <div className="h-10 w-10 bg-muted rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
