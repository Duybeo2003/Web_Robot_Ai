"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { PlayCircle } from "lucide-react";

export function ProductGallery({
  images,
  title,
  selectedImage,
  videoUrl,
}: {
  images: string[];
  title: string;
  selectedImage?: string | null;
  videoUrl?: string | null;
}) {
  const [activeMedia, setActiveMedia] = useState<string>(
    videoUrl ? "video" : selectedImage || images[0] || ""
  );

  useEffect(() => {
    if (selectedImage) {
      setActiveMedia(selectedImage);
    }
  }, [selectedImage]);

  let displayImages = Array.from(new Set(images.filter(Boolean)));
  // No longer faking 3 thumbnails if they have video or real gallery
  if (displayImages.length === 1 && !videoUrl) {
    displayImages = [displayImages[0], displayImages[0], displayImages[0]];
  } else if (displayImages.length === 2 && !videoUrl) {
    displayImages = [...displayImages, displayImages[0]];
  }

  const isYouTube = videoUrl?.includes("youtube.com") || videoUrl?.includes("youtu.be");
  const isTikTok = videoUrl?.includes("tiktok.com");

  const renderVideoPlayer = () => {
    if (!videoUrl) return null;
    
    if (isYouTube) {
      let videoId = "";
      if (videoUrl.includes("youtu.be/")) {
        videoId = videoUrl.split("youtu.be/")[1]?.split("?")[0];
      } else if (videoUrl.includes("watch?v=")) {
        videoId = videoUrl.split("watch?v=")[1]?.split("&")[0];
      }
      return (
        <iframe
          className="w-full h-full object-cover"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      );
    }
    
    if (isTikTok) {
      // Basic tiktok embed (might need official embed script for full support, but iframe works for some formats)
      let videoId = videoUrl.split("/video/")[1]?.split("?")[0];
      return (
        <iframe
          className="w-full h-full object-cover"
          src={`https://www.tiktok.com/embed/v2/${videoId}`}
          allowFullScreen
        ></iframe>
      );
    }

    // Direct MP4 / WebM
    return (
      <video
        className="w-full h-full object-cover bg-black"
        controls
        autoPlay
        playsInline
      >
        <source src={videoUrl} type="video/mp4" />
        Trình duyệt của bạn không hỗ trợ thẻ video.
      </video>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full aspect-square max-h-[400px] md:max-h-[500px] bg-white rounded-md shadow-sm border border-neutral-100 group overflow-hidden p-0 mx-auto flex items-center justify-center bg-black/5">
        {activeMedia === "video" ? (
          renderVideoPlayer()
        ) : activeMedia ? (
          <Image
            src={activeMedia}
            alt={title}
            fill
            priority
            unoptimized
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
      <div className="flex gap-4 flex-wrap">
        {videoUrl && (
          <div
            onClick={() => setActiveMedia("video")}
            className={`w-20 h-20 bg-neutral-900 flex flex-col items-center justify-center rounded-sm border overflow-hidden relative cursor-pointer group ${
              activeMedia === "video" ? 'border-[#FF5722] shadow-sm ring-2 ring-[#FF5722]/20' : 'border-border'
            }`}
          >
            <PlayCircle className={`w-8 h-8 transition-colors ${activeMedia === "video" ? "text-[#FF5722]" : "text-white group-hover:text-[#FF5722]"}`} />
            <span className="text-[10px] text-white font-medium mt-1 uppercase">Video</span>
          </div>
        )}
        
        {displayImages.map((imgUrl, i) => (
          <div
            key={i}
            onClick={() => setActiveMedia(imgUrl)}
            className={`w-20 h-20 bg-muted rounded-sm border overflow-hidden relative cursor-pointer ${
              activeMedia === imgUrl ? 'border-[#FF5722] shadow-sm ring-2 ring-[#FF5722]/20' : 'border-border'
            }`}
          >
            <Image
              src={imgUrl}
              alt={`${title} - thumbnail ${i + 1}`}
              fill
              sizes="80px"
              unoptimized
              className={`object-cover transition-opacity ${
                activeMedia === imgUrl ? 'opacity-100' : 'opacity-60 hover:opacity-100'
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
