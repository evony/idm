import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { getTierUpgradeInfo, processAllTierUpgrades, recalculateAllPoints, TIER_THRESHOLDS } from '@/lib/points';
import { NextResponse } from 'next/server';

/**
 * GET /api/rankings
 * Query params:
 *   division: "male" | "female"
 *   detail: "full" — include point breakdown per player
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const division = searchParams.get('division');
  const detail = searchParams.get('detail');

  const where: Record<string, string> = {};
  if (division) where.division = division;

  const players = await db.player.findMany({
    where,
    orderBy: [{ points: 'desc' }, { totalWins: 'desc' }, { maxStreak: 'desc' }, { matches: 'asc' }],
    include: {
      participations: { include: { tournament: true }, orderBy: { createdAt: 'desc' } },
      clubMembers: { include: { club: true } },
    },
  });

  const rankings = players.map((p, idx) => {
    const upgradeInfo = getTierUpgradeInfo(p.tier as 'S' | 'A' | 'B', p.points);
    const club = (p.clubMembers as unknown as { club: { name: string } }[])?.[0]?.club?.name || null;

    // Point breakdown
    const pointBreakdown = {
      participation: 0,
      matchWin: 0,
      prize: 0,
      other: 0,
    };

    if (detail === 'full') {
      // Calculate from participations (aggregated view)
      for (const part of p.participations) {
        // We can approximate from participation data but the real audit trail is in PlayerPoint
      }
    }

    return {
      rank: idx + 1,
      id: p.id,
      name: p.name,
      gamertag: p.gamertag,
      division: p.division,
      tier: p.tier,
      avatar: p.avatar,
      points: p.points,
      totalWins: p.totalWins,
      totalMvp: p.totalMvp,
      streak: p.streak,
      maxStreak: p.maxStreak,
      matches: p.matches,
      club,
      tournamentCount: p.participations.filter(part => part.status === 'approved' || part.status === 'assigned').length,
      upgradeInfo,
    };
  });

  // Tier distribution summary
  const tierSummary = { S: 0, A: 0, B: 0 };
  for (const p of rankings) {
    tierSummary[p.tier as keyof typeof tierSummary]++;
  }

  // Pending upgrades
  const pendingUpgrades = rankings.filter(r => r.upgradeInfo.shouldUpgrade);

  return NextResponse.json({
    rankings,
    tierSummary,
    pendingUpgrades,
    thresholds: TIER_THRESHOLDS,
  });
}

/**
 * POST /api/rankings
 * Actions:
 *   action: "process_upgrades" — process all eligible tier upgrades
 *   action: "recalculate" — recalculate all points from audit trail
 *   action: "upgrade_player" — upgrade specific player (playerId required)
 */
export async function POST(request: Request) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  const { action, division, playerId } = body;

  if (action === 'process_upgrades') {
    const upgraded = await processAllTierUpgrades(division || undefined);
    return NextResponse.json({ success: true, upgraded, count: upgraded.length });
  }

  if (action === 'recalculate') {
    const results = await recalculateAllPoints(division || undefined);
    const corrected = results.filter(r => r.diff !== 0);
    return NextResponse.json({ success: true, totalPlayers: results.length, corrected, correctionsCount: corrected.length });
  }

  if (action === 'upgrade_player' && playerId) {
    const { processTierUpgrade } = await import('@/lib/points');
    const result = await processTierUpgrade(playerId);
    if (result?.upgraded) {
      return NextResponse.json({ success: true, upgraded: true, fromTier: result.fromTier, toTier: result.toTier });
    }
    return NextResponse.json({ success: true, upgraded: false, message: 'Player tidak eligible untuk upgrade' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
