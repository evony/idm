import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';
import { requireAdmin } from '@/lib/api-auth';

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * POST /api/cloudinary/upload
 * Upload an image to Cloudinary. Requires admin auth.
 * Body: { file: string (base64 data URL), folder?: string, publicId?: string }
 */
export async function POST(request: NextRequest) {
  const headers = new Headers();
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  // Auth check — require admin
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: 'Cloudinary not configured — set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env' },
        { headers, status: 500 }
      );
    }

    const body = await request.json();
    const { file, folder, publicId } = body;

    if (!file) {
      return NextResponse.json({ error: 'File diperlukan' }, { headers, status: 400 });
    }

    // Validate file is a base64 data URL
    if (!file.startsWith('data:')) {
      return NextResponse.json({ error: 'File harus berupa base64 data URL' }, { headers, status: 400 });
    }

    // Upload to Cloudinary
    const uploadOptions: UploadApiOptions = {
      folder: folder || 'general',
      overwrite: true,
      invalidate: true, // ★ Invalidate CDN cache so updated images appear immediately
      resource_type: 'image',
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

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
    console.error('[Cloudinary Upload] Error:', error);
    const message = error instanceof Error ? error.message : 'Upload gagal';
    return NextResponse.json(
      { error: message },
      { headers, status: 500 }
    );
  }
}

/**
 * DELETE /api/cloudinary/upload
 * Delete an image from Cloudinary. Requires admin auth.
 * Body: { publicId: string }
 */
export async function DELETE(request: NextRequest) {
  const headers = new Headers();
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  // Auth check — require admin
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { publicId } = body;

    if (!publicId) {
      return NextResponse.json({ error: 'Public ID diperlukan' }, { headers, status: 400 });
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      return NextResponse.json({ success: true, message: 'Gambar berhasil dihapus' }, { headers });
    }

    return NextResponse.json({ error: 'Gagal menghapus gambar', result: result.result }, { headers, status: 400 });
  } catch (error: unknown) {
    console.error('[Cloudinary Delete] Error:', error);
    const message = error instanceof Error ? error.message : 'Gagal menghapus gambar';
    return NextResponse.json(
      { error: message },
      { headers, status: 500 }
    );
  }
}
