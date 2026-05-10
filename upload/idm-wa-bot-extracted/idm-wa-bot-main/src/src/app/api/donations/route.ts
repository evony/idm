import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// POST /api/donations — Submit a new donation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { donorName, amount, message, type, tournamentId, seasonId } = body;

    // Validate required fields
    if (!donorName || typeof donorName !== 'string' || !donorName.trim()) {
      return NextResponse.json({ error: 'Nama donatur wajib diisi' }, { status: 400 });
    }

    if (!amount || typeof amount !== 'number' || amount < 1000) {
      return NextResponse.json({ error: 'Jumlah minimal Rp 1.000' }, { status: 400 });
    }

    if (amount > 100_000_000) {
      return NextResponse.json({ error: 'Jumlah maksimal Rp 100.000.000' }, { status: 400 });
    }

    const donationType = type === 'season' ? 'season' : 'weekly';

    // Find active season if not provided
    let resolvedSeasonId = seasonId;
    if (!resolvedSeasonId) {
      const activeSeason = await db.season.findFirst({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
      });
      resolvedSeasonId = activeSeason?.id || null;
    }

    // Find active tournament for weekly type if not provided
    let resolvedTournamentId = tournamentId;
    if (donationType === 'weekly' && !resolvedTournamentId && resolvedSeasonId) {
      const activeTournament = await db.tournament.findFirst({
        where: { seasonId: resolvedSeasonId, status: { in: ['setup', 'registration', 'main_event'] } },
        orderBy: { weekNumber: 'desc' },
      });
      resolvedTournamentId = activeTournament?.id || null;
    }

    const donation = await db.donation.create({
      data: {
        donorName: donorName.trim(),
        amount,
        message: message?.trim() || null,
        type: donationType,
        tournamentId: donationType === 'weekly' ? resolvedTournamentId : null,
        seasonId: resolvedSeasonId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Terima kasih atas dukungan Anda! 🎉',
      donation: {
        id: donation.id,
        donorName: donation.donorName,
        amount: donation.amount,
        type: donation.type,
        createdAt: donation.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[DONATIONS_POST]', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat memproses donasi' }, { status: 500 });
  }
}

// GET /api/donations — List donations
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // "weekly" | "season"
    const seasonId = searchParams.get('seasonId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (seasonId) where.seasonId = seasonId;

    const donations = await db.donation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const total = await db.donation.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json({
      donations,
      total: {
        amount: total._sum.amount || 0,
        count: total._count,
      },
    });
  } catch (error) {
    console.error('[DONATIONS_GET]', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
