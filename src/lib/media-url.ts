const IMAGE_HOSTS = new Set(["res.cloudinary.com", "images.unsplash.com"]);
const VIDEO_HOSTS = new Set([
  "res.cloudinary.com",
  "youtube.com",
  "www.youtube.com",
  "www.youtube-nocookie.com",
  "youtu.be",
  "tiktok.com",
  "www.tiktok.com",
]);

function isSafeLocalUpload(value: string) {
  return (
    value.startsWith("/uploads/") &&
    !value.includes("..") &&
    !value.includes("\\") &&
    !value.includes("\0")
  );
}

function hasAllowedHost(value: string, hosts: Set<string>) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && hosts.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function isAllowedImageUrl(value: string) {
  return isSafeLocalUpload(value) || hasAllowedHost(value, IMAGE_HOSTS);
}

export function isAllowedVideoUrl(value: string) {
  if (isSafeLocalUpload(value) || hasAllowedHost(value, VIDEO_HOSTS)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.toLowerCase().endsWith(".tiktok.com");
  } catch {
    return false;
  }
}
