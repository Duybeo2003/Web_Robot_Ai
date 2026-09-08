import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { AuthorizationError, requireRole } from "@/lib/authz";
import type { UploadApiResponse } from "cloudinary";
import { checkRateLimit } from "@/lib/rate-limit";

// Allowed MIME types (images and videos)
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

// Max file size: 30MB for videos
const MAX_FILE_SIZE = 30 * 1024 * 1024;

function hasExpectedSignature(type: string, buffer: Buffer) {
  const hex = buffer.subarray(0, 12).toString("hex");
  if (type === "image/jpeg") return hex.startsWith("ffd8ff");
  if (type === "image/png") return hex.startsWith("89504e470d0a1a0a");
  if (type === "image/gif") return buffer.subarray(0, 4).toString("ascii") === "GIF8";
  if (type === "image/webp") {
    return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  }
  if (type === "video/webm") return hex.startsWith("1a45dfa3");
  if (type === "video/mp4" || type === "video/quicktime") {
    return buffer.subarray(4, 8).toString("ascii") === "ftyp";
  }
  return false;
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("ADMIN", "EDITOR");
    const contentLengthHeader = request.headers.get("content-length");
    const contentLength = Number(contentLengthHeader);
    if (
      !contentLengthHeader ||
      !Number.isFinite(contentLength) ||
      contentLength < 0 ||
      contentLength > MAX_FILE_SIZE + 1_000_000
    ) {
      return NextResponse.json(
        { success: false, error: "Nội dung tải lên vượt quá giới hạn." },
        { status: contentLengthHeader ? 413 : 411 },
      );
    }
    const rateLimit = await checkRateLimit(`rl:catalog-upload:${user.id}`, 200, 86_400, {
      failClosed: true,
    });
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: "Bạn đã vượt giới hạn tải tệp trong ngày." },
        { status: 429 },
      );
    }
    const data = await request.formData();
    const candidate = data.get("file");
    const file = candidate instanceof File ? candidate : null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 },
      );
    }

    // SECURITY: Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP) và video (MP4, WebM)`,
        },
        { status: 400 },
      );
    }

    // SECURITY: Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File quá lớn. Tối đa 30MB." },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    if (!hasExpectedSignature(file.type, buffer)) {
      return NextResponse.json(
        { success: false, error: "Nội dung tệp không khớp định dạng đã khai báo." },
        { status: 400 },
      );
    }

    const cloudinaryConfigured = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET,
    );
    if (!cloudinaryConfigured) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { success: false, error: "Dịch vụ lưu trữ tệp chưa được cấu hình." },
          { status: 503 },
        );
      }
      // Fallback to local storage for development
      const { writeFile } = await import("fs/promises");
      const path = await import("path");
      const fs = await import("fs");
      const crypto = await import("crypto");

      const uploadDir = path.default.join(process.cwd(), "public", "uploads");
      if (!fs.default.existsSync(uploadDir)) {
        fs.default.mkdirSync(uploadDir, { recursive: true });
      }
      const ext =
        file.type.split("/")[1] === "jpeg"
          ? ".jpg"
          : `.${file.type.split("/")[1]}`;
      const safeFilename = `${Date.now()}-${crypto.default.randomUUID()}${ext}`;
      const filepath = path.default.join(uploadDir, safeFilename);
      await writeFile(filepath, buffer);
      return NextResponse.json({
        success: true,
        url: `/uploads/${safeFilename}`,
      });
    }

    // Upload to Cloudinary
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const isVideo = file.type.startsWith("video/");
      cloudinary.uploader
        .upload_stream(
          {
            folder: "RoboEQ-products",
            resource_type: isVideo ? "video" : "image",
            transformation: isVideo
              ? undefined
              : [
                  { quality: "auto", fetch_format: "auto" },
                  { width: 1200, height: 1200, crop: "limit" },
                ],
          },
          (error, result) => {
            if (error) reject(error);
            else if (result) resolve(result);
            else reject(new Error("Cloudinary returned no upload result"));
          },
        )
        .end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.message === "Forbidden" ? 403 : 401 },
      );
    }
    console.error("Upload Error:", error);
    return NextResponse.json(
      { success: false, error: "Upload failed" },
      { status: 500 },
    );
  }
}
