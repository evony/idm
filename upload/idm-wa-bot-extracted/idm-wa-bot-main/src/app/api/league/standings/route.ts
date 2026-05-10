// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Division } from '@prisma/client';

export async function GET(request: NextRequest) {
  const headers = new Headers();
  headers.set('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=120');

  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId');
    const rawDivision = searchParams.get('division') as Division | null;
    const divisionFilter = rawDivision === 'semua' ? { in: ['male', 'female'] } : rawDivision;

    const where: any = {};
    if (seasonId) {
      where.seasonId = seasonId;
    }
    if (divisionFilter) {
      where.division = divisionFilter;
    }

    const standings = await db.seasonStanding.findMany({
      where,
      include: {
        club: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            division: true,
          },
        },
        season: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { points: 'desc' },
        { gameDiff: 'desc' },
        { gameWins: 'desc' },
      ],
    });

    // Add rank
    const rankedStandings = standings.map((standing, index) => ({
      ...standing,
      rank: index + 1,
    }));

    return NextResponse.json({
      success: true,
      data: rankedStandings,
    }, { headers });
  } catch (error) {
    console.error('Get standings error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { headers,  status: 500 }
    );
  }
}
