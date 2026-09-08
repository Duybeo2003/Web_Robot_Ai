import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import type { UploadApiResponse } from "cloudinary";
import cloudinary from "@/lib/cloudinary";
import { AuthorizationError, requireUser } from "@/lib/authz";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const allowedTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);
const maxFileSize = 5 * 1024 * 1024;

function hasExpectedSignature(type: string, buffer: Buffer) {
  if (type === "image/jpeg") return buffer.subarray(0, 3).toString("hex") === "ffd8ff";
  if (type === "image/png") return buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
  return (
    type === "image/webp" &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  );
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const rateLimit = await checkRateLimit(`rl:rma-upload:${user.id}`, 10, 86_400, {
      failClosed: true,
    });
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Bạn đã tải quá nhiều ảnh hôm nay." }, { status: 429 });
    }

    const formData = await request.formData();
    const candidate = formData.get("file");
    if (!(candidate instanceof File)) {
      return NextResponse.json({ error: "Thiếu tệp ảnh." }, { status: 400 });
    }
    const extension = allowedTypes.get(candidate.type);
    if (!extension || candidate.size <= 0 || candidate.size > maxFileSize) {
      return NextResponse.json(
        { error: "Chỉ nhận ảnh JPEG, PNG hoặc WebP tối đa 5 MB." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await candidate.arrayBuffer());
    if (!hasExpectedSignature(candidate.type, buffer)) {
      return NextResponse.json({ error: "Nội dung tệp ảnh không hợp lệ." }, { status: 400 });
    }

    const cloudinaryConfigured = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET,
    );
    if (!cloudinaryConfigured) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Dịch vụ lưu ảnh chưa sẵn sàng." }, { status: 503 });
      }
      const filename = `rma-${crypto.randomUUID()}${extension}`;
      const uploadDirectory = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDirectory, { recursive: true });
      await writeFile(path.join(uploadDirectory, filename), buffer);
      return NextResponse.json({ url: `/uploads/${filename}` });
    }

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `RoboEQ-rma/${user.id}`,
            resource_type: "image",
            transformation: [
              { quality: "auto", fetch_format: "auto" },
              { width: 1600, height: 1600, crop: "limit" },
            ],
          },
          (error, uploaded) => {
            if (error) reject(error);
            else if (uploaded) resolve(uploaded);
            else reject(new Error("Upload returned no result"));
          },
        )
        .end(buffer);
    });
    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Không thể tải ảnh." }, { status: 500 });
  }
}
