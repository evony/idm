import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Admin player management
export async function GET(request: NextRequest) {
  const headers = new Headers();
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  try {
    const { searchParams } = new URL(request.url);
    const division = searchParams.get('division');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');

    const where: any = {};

    if (division) where.division = division;
    if (status) where.registrationStatus = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { gamertag: { contains: search } },
        { city: { contains: search } },
      ];
    }

    const players = await db.player.findMany({
      where,
      select: {
        id: true,
        name: true,
        gamertag: true,
        division: true,
        tier: true,
        avatar: true,
        points: true,
        totalWins: true,
        totalMvp: true,
        streak: true,
        maxStreak: true,
        matches: true,
        isActive: true,
        phone: true,
        city: true,
        registrationStatus: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { points: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: players,
    }, { headers });
  } catch (error) {
    console.error('Get players error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { headers,  status: 500 }
    );
  }
}
