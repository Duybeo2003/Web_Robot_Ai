import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const segments = (await params).path;
  if (!segments.length || segments.some((segment) => !segment || segment.includes("\0"))) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
  const filePath = path.resolve(uploadsDir, ...segments);
  const relativePath = path.relative(uploadsDir, filePath);
  if (
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath) ||
    relativePath === ""
  ) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()];
  if (!contentType) return new NextResponse("Not Found", { status: 404 });

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) return new NextResponse("Not Found", { status: 404 });
    const fileBuffer = await readFile(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileStat.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : null;
    if (code !== "ENOENT") {
      logger.error("upload.read_failed", {
        path: relativePath,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
    return new NextResponse("Not Found", { status: 404 });
  }
}
