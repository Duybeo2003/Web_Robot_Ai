"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

export function ProductGallery({
  images,
  title,
  selectedImage,
}: {
  images: string[];
  title: string;
  selectedImage?: string | null;
}) {
  const [activeImage, setActiveImage] = useState(selectedImage || images[0] || null);

  useEffect(() => {
    if (selectedImage) {
      setActiveImage(selectedImage);
    }
  }, [selectedImage]);

  // The user wants 3 thumbnails even if there's only 1 image.
  // We'll prioritize unique images from variants, but pad with the main image if needed.
  let displayImages = Array.from(new Set(images.filter(Boolean)));
  if (displayImages.length === 1) {
    displayImages = [displayImages[0], displayImages[0], displayImages[0]];
  } else if (displayImages.length === 2) {
    displayImages = [...displayImages, displayImages[0]];
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full aspect-square max-h-[400px] md:max-h-[500px] bg-white rounded-md shadow-sm border border-neutral-100 group overflow-hidden p-0 mx-auto">
        {activeImage ? (
          <Image
            src={activeImage}
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
      {/* Thumbnails */}
      {displayImages.length > 0 && (
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
