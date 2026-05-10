import { NextRequest, NextResponse } from 'next/server';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const nextCursor = searchParams.get('next_cursor');
    const maxResults = searchParams.get('max_results') || '50';
    const prefix = searchParams.get('prefix') || '';
    const type = searchParams.get('type') || 'upload'; // upload, facebook, twitter, etc.

    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
      return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
    }

    // Build URL for Cloudinary Admin API
    const url = new URL(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image`);

    // Add query parameters
    url.searchParams.append('max_results', maxResults);
    url.searchParams.append('type', type);
    if (nextCursor) {
      url.searchParams.append('next_cursor', nextCursor);
    }
    if (prefix) {
      url.searchParams.append('prefix', prefix);
    }

    // Make authenticated request to Cloudinary
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64')}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Cloudinary API error:', error);
      return NextResponse.json({ error: 'Failed to fetch from Cloudinary' }, { status: response.status });
    }

    const data = await response.json();

    // Transform the response to include only what we need
    const images = (data.resources || []).map((img: { public_id: string; secure_url: string; width: number; height: number; format: string; bytes: number; created_at: string }) => ({
      public_id: img.public_id,
      url: img.secure_url,
      width: img.width,
      height: img.height,
      format: img.format,
      bytes: img.bytes,
      created_at: img.created_at,
    }));

    return NextResponse.json({
      images,
      next_cursor: data.next_cursor || null,
      rate_limit_remaining: response.headers.get('x-featureratelimit-remaining'),
    });
  } catch (error) {
    console.error('Cloudinary fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get folders list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'get_folders') {
      if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
        return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
      }

      const url = new URL(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/folders`);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64')}`,
        },
      });

      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to fetch folders' }, { status: response.status });
      }

      const data = await response.json();
      return NextResponse.json({ folders: data.folders || [] });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Cloudinary folders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
