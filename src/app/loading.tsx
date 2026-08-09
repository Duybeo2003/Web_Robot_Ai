export default function Loading() {
  return (
    <div className="container mx-auto px-4 flex flex-col h-[50vh] items-center justify-center space-y-4">
      {/* Spinner */}
      <div className="w-12 h-12 border-4 border-neutral-200 border-t-[#FF5722] rounded-full animate-spin"></div>
      <p className="text-neutral-500 font-medium animate-pulse">Đang tải dữ liệu...</p>
      
      {/* Generic skeleton structure */}
      <div className="w-full max-w-4xl mx-auto mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 opacity-50">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col space-y-3 p-4 border rounded-xl bg-neutral-50/50 hidden md:flex">
            <div className="w-full aspect-square bg-neutral-200 rounded-lg animate-pulse"></div>
            <div className="h-4 bg-neutral-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/2 animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
