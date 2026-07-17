"use client"
import Image from "next/image"

export function ProductGallery({ imageUrl, title }: { imageUrl: string | null, title: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="aspect-square bg-muted rounded-sm overflow-hidden border border-border relative group">
        {imageUrl ? (
          <Image 
            src={imageUrl} 
            alt={title} 
            fill
            priority
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground font-medium text-lg font-heading">
            Đang cập nhật hình ảnh
          </div>
        )}
      </div>
      {/* Thumbnail placeholders for future */}
      <div className="flex gap-4">
        {[1, 2, 3].map((_, i) => (
          <div key={i} className="w-20 h-20 bg-muted rounded-sm border border-border overflow-hidden relative">
            {imageUrl ? (
              <Image src={imageUrl} alt="" fill sizes="80px" className="object-cover opacity-60 hover:opacity-100 transition-opacity cursor-pointer" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
