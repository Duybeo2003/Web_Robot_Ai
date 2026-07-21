import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

// Allowed MIME types (images only)
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    // SECURITY: Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)` },
        { status: 400 }
      );
    }

    // SECURITY: Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File quá lớn. Tối đa 5MB.' },
        { status: 400 }
      );
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      // Fallback to local storage for development
      const { writeFile } = await import('fs/promises');
      const path = await import('path');
      const fs = await import('fs');
      const crypto = await import('crypto');

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadDir = path.default.join(process.cwd(), 'public', 'uploads');
      if (!fs.default.existsSync(uploadDir)) {
        fs.default.mkdirSync(uploadDir, { recursive: true });
      }
      const ext = file.type.split('/')[1] === 'jpeg' ? '.jpg' : `.${file.type.split('/')[1]}`;
      const safeFilename = `${Date.now()}-${crypto.default.randomUUID()}${ext}`;
      const filepath = path.default.join(uploadDir, safeFilename);
      await writeFile(filepath, buffer);
      return NextResponse.json({ success: true, url: `/uploads/${safeFilename}` });
    }

    // Upload to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'roboed-products',
          resource_type: 'image',
          transformation: [
            { quality: 'auto', fetch_format: 'auto' },
            { width: 1200, height: 1200, crop: 'limit' }
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({ 
      success: true, 
      url: result.secure_url 
    });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
