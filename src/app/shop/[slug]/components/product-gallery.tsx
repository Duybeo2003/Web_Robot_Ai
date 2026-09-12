"use client";

import { useState } from "react";
import Image from "next/image";
import { PlayCircle } from "lucide-react";

type EmbeddedVideo =
  | { kind: "youtube"; id: string }
  | { kind: "tiktok"; id: string }
  | { kind: "direct"; url: string; mimeType: string };

function parseVideoUrl(rawUrl: string): EmbeddedVideo | null {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.toLowerCase();
    if (hostname === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] || "";
      return /^[\w-]{6,20}$/.test(id) ? { kind: "youtube", id } : null;
    }
    if (["youtube.com", "www.youtube.com", "www.youtube-nocookie.com"].includes(hostname)) {
      const pathParts = url.pathname.split("/").filter(Boolean);
      const id =
        url.searchParams.get("v") ||
        (["embed", "shorts"].includes(pathParts[0] || "") ? pathParts[1] : "") ||
        "";
      return /^[\w-]{6,20}$/.test(id) ? { kind: "youtube", id } : null;
    }
    if (hostname === "tiktok.com" || hostname.endsWith(".tiktok.com")) {
      const match = url.pathname.match(/\/video\/(\d+)/);
      return match?.[1] ? { kind: "tiktok", id: match[1] } : null;
    }
    return {
      kind: "direct",
      url: rawUrl,
      mimeType: url.pathname.toLowerCase().endsWith(".webm") ? "video/webm" : "video/mp4",
    };
  } catch {
    return null;
  }
}

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
  const parsedVideo = videoUrl ? parseVideoUrl(videoUrl) : null;
  const [mediaSelection, setMediaSelection] = useState(() => ({
    sourceImage: selectedImage,
    media: parsedVideo ? "video" : selectedImage || images[0] || "",
  }));
  const activeMedia =
    mediaSelection.sourceImage === selectedImage
      ? mediaSelection.media
      : selectedImage || images[0] || "";
  const selectMedia = (media: string) =>
    setMediaSelection({ sourceImage: selectedImage, media });
  const displayImages = Array.from(new Set(images.filter(Boolean)));

  const renderVideoPlayer = () => {
    if (!parsedVideo) return null;
    if (parsedVideo.kind === "youtube") {
      return (
        <iframe
          className="h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${parsedVideo.id}`}
          title={`Video sản phẩm ${title}`}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
    if (parsedVideo.kind === "tiktok") {
      return (
        <iframe
          className="h-full w-full"
          src={`https://www.tiktok.com/embed/v2/${parsedVideo.id}`}
          title={`Video TikTok sản phẩm ${title}`}
          allowFullScreen
        />
      );
    }
    return (
      <video className="h-full w-full bg-black object-contain" controls playsInline preload="metadata">
        <source src={parsedVideo.url} type={parsedVideo.mimeType} />
        Trình duyệt của bạn không hỗ trợ phát video.
      </video>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="group relative mx-auto flex aspect-square w-full max-w-[540px] items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {activeMedia === "video" && parsedVideo ? (
          renderVideoPlayer()
        ) : activeMedia ? (
          <Image
            src={activeMedia}
            alt={title}
            fill
            loading="eager"
            className="object-contain transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-heading text-lg font-medium text-muted-foreground">
            Đang cập nhật hình ảnh
          </div>
        )}
      </div>

      {(parsedVideo || displayImages.length > 1) && (
        <div className="flex flex-wrap gap-4" aria-label="Thư viện sản phẩm">
          {parsedVideo && (
            <button
              type="button"
              onClick={() => selectMedia("video")}
              aria-pressed={activeMedia === "video"}
              className={`group relative flex size-20 flex-col items-center justify-center overflow-hidden rounded-lg border bg-neutral-900 ${
                activeMedia === "video"
                  ? "border-[#FF5722] shadow-sm ring-2 ring-[#FF5722]/20"
                  : "border-border"
              }`}
            >
              <PlayCircle className={`size-8 transition-colors ${activeMedia === "video" ? "text-primary" : "text-white group-hover:text-primary"}`} />
              <span className="mt-1 text-[10px] font-medium uppercase text-white">Video</span>
            </button>
          )}

          {displayImages.map((imageUrl, index) => (
            <button
              type="button"
              key={imageUrl}
              onClick={() => selectMedia(imageUrl)}
              aria-label={`Xem ảnh ${index + 1} của ${title}`}
              aria-pressed={activeMedia === imageUrl}
              className={`relative size-20 overflow-hidden rounded-lg border bg-muted ${
                activeMedia === imageUrl
                  ? "border-[#FF5722] shadow-sm ring-2 ring-[#FF5722]/20"
                  : "border-border"
              }`}
            >
              <Image
                src={imageUrl}
                alt=""
                fill
                sizes="80px"
                className={`object-cover transition-opacity ${activeMedia === imageUrl ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
