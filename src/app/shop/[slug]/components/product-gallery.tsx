"use client";
import { useState } from "react";
import Image from "next/image";

export function ProductGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [activeImage, setActiveImage] = useState(images[0] || null);

  // If there are less than 3 images, we pad with the main image to make it look full if we really want to,
  // but it's better to just show unique images. Since the user wanted 3 thumbnails, if there's only 1 image,
  // we can just duplicate it so they can see the effect they wanted.
  const displayImages = images.length > 0 ? Array.from(new Set([
    images[0],
    images[1] || images[0],
    images[2] || images[0]
  ])).filter(Boolean) : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full aspect-square max-h-[400px] md:max-h-[500px] bg-white rounded-md shadow-sm border border-neutral-100 group overflow-hidden p-2 md:p-4 mx-auto">
        {activeImage ? (
          <Image
            src={activeImage}
            alt={title}
            fill
            priority
            className="object-contain transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground font-medium text-lg font-heading">
            Đang cập nhật hình ảnh
          </div>
        )}
      </div>
      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="flex gap-4">
          {displayImages.map((imgUrl, i) => (
            <div
              key={i}
              onClick={() => setActiveImage(imgUrl)}
              className={`w-20 h-20 bg-muted rounded-sm border overflow-hidden relative cursor-pointer ${
                activeImage === imgUrl ? 'border-[#FF5722] shadow-sm' : 'border-border'
              }`}
            >
              <Image
                src={imgUrl}
                alt={`${title} - thumbnail ${i + 1}`}
                fill
                sizes="80px"
                className={`object-cover transition-opacity ${
                  activeImage === imgUrl ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                }`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
