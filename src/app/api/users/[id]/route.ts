import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get user by ID - maps to Player in our schema
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const headers = new Headers();
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  try {
    const { id } = await params;

    const player = await db.player.findUnique({
      where: { id },
      include: {
        account: {
          select: { id: true, username: true, donorBadgeCount: true, lastLoginAt: true },
        },
        clubMembers: {
          where: { leftAt: null },
          include: { profile: { select: { name: true, logo: true } } },
        },
      },
    });

    if (!player) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { headers,  status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: player }, { headers });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { headers,  status: 500 }
    );
  }
}
