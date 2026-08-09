import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const filePath = path.join(process.cwd(), 'public', 'uploads', ...resolvedParams.path);

    // Ensure the path is within the uploads directory to prevent directory traversal
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!filePath.startsWith(uploadsDir)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    if (!fs.existsSync(filePath)) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    let contentType = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.svg') contentType = 'image/svg+xml';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving local upload:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
