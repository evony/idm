import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';
import { requirePlayer } from '@/lib/api-auth';

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Max file size: 5MB (base64 is ~33% larger, so ~6.7MB in base64)
const MAX_BASE64_SIZE = 7 * 1024 * 1024;

/**
 * POST /api/marketplace/upload
 * Upload an image to Cloudinary for marketplace listings. Requires player auth.
 * Body: { file: string (base64 data URL) }
 */
export async function POST(request: NextRequest) {
  const headers = new Headers();
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  // Auth check — require player login
  const playerAuth = await requirePlayer(request);
  if (playerAuth instanceof NextResponse) return playerAuth;

  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: 'Cloudinary not configured' },
        { headers, status: 500 }
      );
    }

    const body = await request.json();
    const { file } = body;

    if (!file) {
      return NextResponse.json({ error: 'File diperlukan' }, { headers, status: 400 });
    }

    // Validate file is a base64 data URL
    if (!file.startsWith('data:')) {
      return NextResponse.json({ error: 'File harus berupa base64 data URL' }, { headers, status: 400 });
    }

    // Validate file size (base64 is ~33% larger than binary)
    if (file.length > MAX_BASE64_SIZE) {
      return NextResponse.json(
        { error: 'File terlalu besar — maksimal 5MB' },
        { headers, status: 413 }
      );
    }

    // Validate MIME type is an image
    const mimeMatch = file.match(/^data:(image\/[a-zA-Z+.-]+);base64,/);
    if (!mimeMatch) {
      return NextResponse.json(
        { error: 'Hanya file gambar yang diperbolehkan' },
        { headers, status: 400 }
      );
    }

    // Upload to Cloudinary in marketplace folder
    const uploadOptions: UploadApiOptions = {
      folder: 'marketplace/user-uploads',
      overwrite: false, // Don't overwrite — generate unique public_id
      resource_type: 'image',
      // Optimize image quality
      transformation: [
        { quality: 'auto:good', fetch_format: 'auto' },
      ],
    };

    const result = await cloudinary.uploader.upload(file, uploadOptions);

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    }, { headers });
  } catch (error: unknown) {
    console.error('[Marketplace Upload] Error:', error);
    const message = error instanceof Error ? error.message : 'Upload gagal';
    return NextResponse.json(
      { error: message },
      { headers, status: 500 }
    );
  }
}
