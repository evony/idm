import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { createAuditLog } from '@/lib/audit';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const headers = new Headers();
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  const { id } = await params;
  const season = await db.season.findUnique({
    where: { id },
    include: {
      tournaments: { orderBy: { weekNumber: 'asc' } },
      clubs: {
        orderBy: { points: 'desc' },
        include: {
          profile: { select: { id: true, name: true, logo: true } },
          _count: { select: { homeMatches: true, awayMatches: true } },
        },
      },
      donations: { orderBy: { createdAt: 'desc' } },
      championClub: { select: { id: true, name: true, logo: true } },
      championPlayer: { select: { id: true, gamertag: true, division: true, avatar: true, points: true } },
      _count: { select: { tournaments: true, clubs: true, donations: true } },
    },
  });

  if (!season) {
    return NextResponse.json({ error: 'Season not found' }, { headers,  status: 404 });
  }

  // For completed non-liga seasons, use PlayerSeasonStats for accurate historical data
  let seasonPlayers: Array<{ id: string; gamertag: string; division: string; avatar: string | null; points: number; rank: number | null; tier: string; club: string | null; tournamentCount: number }> = [];

  if (season.status === 'completed' && season.division !== 'liga') {
    // Use PlayerSeasonStats for completed seasons — accurate historical snapshots
    const statsRecords = await db.playerSeasonStats.findMany({
      where: { seasonId: id },
      include: {
        player: {
          select: {
            id: true, gamertag: true, division: true, avatar: true,
            clubMembers: {
              where: { leftAt: null },
              include: { profile: { select: { name: true } } },
              take: 1,
            },
          },
        },
      },
      orderBy: [
        { points: 'desc' },
        { totalWins: 'desc' },
      ],
    });

    seasonPlayers = statsRecords.map((stat, idx) => ({
      id: stat.player.id,
      gamertag: stat.player.gamertag,
      division: stat.player.division,
      avatar: stat.player.avatar,
      points: stat.points,
      rank: stat.rank || idx + 1,
      tier: stat.tier,
      club: stat.player.clubMembers[0]?.profile?.name || null,
      tournamentCount: 0,
    }));
  } else if (season.division !== 'liga') {
    // Active/upcoming seasons — use live participation data
    const participations = await db.participation.findMany({
      where: {
        tournament: { seasonId: id },
        status: { in: ['approved', 'assigned'] },
      },
      include: {
        player: {
          select: {
            id: true, gamertag: true, division: true, avatar: true, points: true,
            clubMembers: {
              where: { leftAt: null },
              include: { profile: { select: { name: true } } },
              take: 1,
            },
          },
        },
      },
    });
    const playerMap = new Map<string, { id: string; gamertag: string; division: string; avatar: string | null; points: number; tier: string; club: string | null; tournamentCount: number }>();
    for (const p of participations) {
      const existing = playerMap.get(p.player.id);
      if (existing) {
        existing.tournamentCount++;
      } else {
        playerMap.set(p.player.id, {
          id: p.player.id,
          gamertag: p.player.gamertag,
          division: p.player.division,
          avatar: p.player.avatar,
          points: p.player.points,
          tier: p.player.clubMembers[0]?.profile?.name ? 'B' : 'B', // will be overridden
          club: p.player.clubMembers[0]?.profile?.name || null,
          tournamentCount: 1,
        });
      }
    }
    seasonPlayers = Array.from(playerMap.values())
      .sort((a, b) => b.points - a.points)
      .map((p, idx) => ({ ...p, rank: null, tier: 'B' }));
  }

  // For liga seasons, also fetch ALL ClubProfiles (for champion selector when season has no clubs yet)
  let availableProfiles: Array<{ id: string; name: string; logo: string | null; memberCount: number }> = [];
  if (season.division === 'liga') {
    const profiles = await db.clubProfile.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { members: true } } },
    });
    availableProfiles = profiles.map(p => ({
      id: p.id,
      name: p.name,
      logo: p.logo,
      memberCount: p._count.members,
    }));
  }

  // Parse JSON string fields
  const response = { ...season } as Record<string, unknown>;
  if (response.championSquad && typeof response.championSquad === 'string') {
    try {
      response.championSquad = JSON.parse(response.championSquad as string);
    } catch {
      response.championSquad = null;
    }
  }
  if (response.championPlayerSnapshot && typeof response.championPlayerSnapshot === 'string') {
    try {
      response.championPlayerSnapshot = JSON.parse(response.championPlayerSnapshot as string);
    } catch {
      response.championPlayerSnapshot = null;
    }
  }
  if (response.championClubSnapshot && typeof response.championClubSnapshot === 'string') {
    try {
      response.championClubSnapshot = JSON.parse(response.championClubSnapshot as string);
    } catch {
      response.championClubSnapshot = null;
    }
  }
  // Add players for tarkam seasons
  if (seasonPlayers.length > 0) {
    response.players = seasonPlayers;
  }
  // Add available profiles for liga seasons
  if (availableProfiles.length > 0) {
    response.availableProfiles = availableProfiles;
  }

  return NextResponse.json(response, { headers });
}

// PUT /api/seasons/[id] — Update season (status, championClubId, endDate, name)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const body = await request.json();
  const { name, status, championClubId, championPlayerId, championPlayerPoints, championSquad, endDate } = body;

  const season = await db.season.findUnique({ where: { id } });
  if (!season) {
    return NextResponse.json({ error: 'Season tidak ditemukan' }, { status: 404 });
  }

  // Validate championClubId if provided (liga mode — references ClubProfile)
  if (championClubId !== undefined && championClubId !== null) {
    const profile = await db.clubProfile.findUnique({ where: { id: championClubId } });
    if (!profile) {
      return NextResponse.json({ error: 'Club champion tidak ditemukan' }, { status: 400 });
    }
    // Check if club already has a season entry; if not, auto-create one
    const seasonEntry = await db.club.findFirst({ where: { profileId: championClubId, seasonId: id } });
    if (!seasonEntry) {
      // Auto-add club to this season so it can be set as champion
      await db.club.create({
        data: {
          profileId: championClubId,
          division: season.division,
          seasonId: id,
        },
      });
    }
  }

  // Validate championPlayerId if provided (tarkam mode — references Player)
  if (championPlayerId !== undefined && championPlayerId !== null) {
    const player = await db.player.findUnique({ where: { id: championPlayerId } });
    if (!player) {
      return NextResponse.json({ error: 'Player champion tidak ditemukan' }, { status: 400 });
    }
  }

  // Validate championSquad if provided — must be array with max 5 members
  if (championSquad !== undefined) {
    if (championSquad !== null && !Array.isArray(championSquad)) {
      return NextResponse.json({ error: 'championSquad harus berupa array' }, { status: 400 });
    }
    if (Array.isArray(championSquad) && championSquad.length > 5) {
      return NextResponse.json({ error: 'championSquad maksimal 5 anggota' }, { status: 400 });
    }
  }

  // Validate status transition
  if (status && !['active', 'completed', 'upcoming'].includes(status)) {
    return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
  }

  // If completing season, auto-set endDate
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name.trim();
  if (status !== undefined) updateData.status = status;
  if (championClubId !== undefined) updateData.championClubId = championClubId || null;
  if (championPlayerId !== undefined) updateData.championPlayerId = championPlayerId || null;
  if (championPlayerPoints !== undefined) updateData.championPlayerPoints = championPlayerPoints || null;
  if (championSquad !== undefined) updateData.championSquad = championSquad ? JSON.stringify(championSquad) : null;
  if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

  // When status is set to completed and no endDate, set now
  if (status === 'completed' && !endDate && !season.endDate) {
    updateData.endDate = new Date();
  }

  // ===== SNAPSHOT CHAMPION DATA when manually setting champion + completing season =====
  // This ensures historical champion data is preserved even when new seasons run
  const willBeCompleted = status === 'completed' || (status === undefined && season.status === 'completed');

  // Snapshot tarkam champion player
  if (championPlayerId && willBeCompleted) {
    const player = await db.player.findUnique({
      where: { id: championPlayerId },
      include: {
        clubMembers: {
          where: { leftAt: null },
          include: { profile: { select: { name: true } } },
          take: 1,
        },
      },
    });
    if (player) {
      const activeClub = player.clubMembers[0]?.profile?.name || null;
      // Compute per-season points from PlayerPoint aggregation (not lifetime)
      let perSeasonPoints = championPlayerPoints;
      if (!perSeasonPoints) {
        const seasonPoints = await db.playerPoint.groupBy({
          by: ['playerId'],
          where: { playerId: championPlayerId, seasonId: id },
          _sum: { amount: true },
        });
        perSeasonPoints = seasonPoints[0]?._sum.amount || 0;
      }
      updateData.championPlayerSnapshot = JSON.stringify({
        gamertag: player.gamertag,
        avatar: player.avatar,
        tier: player.tier,
        points: perSeasonPoints,
        totalWins: player.totalWins,
        totalMvp: player.totalMvp,
        streak: player.streak,
        maxStreak: player.maxStreak,
        matches: player.matches,
        club: activeClub,
        division: player.division,
      });
    }
  }

  // Snapshot liga champion club
  if (championClubId && willBeCompleted) {
    const profile = await db.clubProfile.findUnique({
      where: { id: championClubId },
      select: { id: true, name: true, logo: true },
    });
    const clubEntry = await db.club.findFirst({
      where: { profileId: championClubId, seasonId: id },
    });
    if (profile) {
      updateData.championClubSnapshot = JSON.stringify({
        name: profile.name,
        logo: profile.logo,
        wins: clubEntry?.wins || 0,
        losses: clubEntry?.losses || 0,
        points: clubEntry?.points || 0,
        gameDiff: clubEntry?.gameDiff || 0,
      });
    }
  }

  // Clear snapshots when removing champion
  if (championPlayerId === null) {
    updateData.championPlayerSnapshot = null;
  }
  if (championClubId === null) {
    updateData.championClubSnapshot = null;
  }

  const updated = await db.season.update({
    where: { id },
    data: updateData,
    include: {
      championClub: { select: { id: true, name: true, logo: true } },
      championPlayer: { select: { id: true, gamertag: true, division: true, avatar: true, points: true } },
      _count: { select: { tournaments: true, clubs: true } },
    },
  });

  // Parse JSON string fields
  const updatedResponse = { ...updated } as Record<string, unknown>;
  if (updatedResponse.championSquad && typeof updatedResponse.championSquad === 'string') {
    try {
      updatedResponse.championSquad = JSON.parse(updatedResponse.championSquad as string);
    } catch {
      updatedResponse.championSquad = null;
    }
  }
  if (updatedResponse.championPlayerSnapshot && typeof updatedResponse.championPlayerSnapshot === 'string') {
    try {
      updatedResponse.championPlayerSnapshot = JSON.parse(updatedResponse.championPlayerSnapshot as string);
    } catch {
      updatedResponse.championPlayerSnapshot = null;
    }
  }
  if (updatedResponse.championClubSnapshot && typeof updatedResponse.championClubSnapshot === 'string') {
    try {
      updatedResponse.championClubSnapshot = JSON.parse(updatedResponse.championClubSnapshot as string);
    } catch {
      updatedResponse.championClubSnapshot = null;
    }
  }

  // Invalidate Next.js server cache so landing page shows updated champion data
  revalidatePath('/');
  revalidatePath('/api/league');

  await createAuditLog({
    adminId: authResult.id,
    adminName: authResult.username,
    action: 'update',
    entity: 'season',
    entityId: id,
    details: `Update season "${season.name}"`,
  });

  return NextResponse.json(updatedResponse);
}

// DELETE /api/seasons/[id] — Delete season (cascade handled by Prisma schema)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;

  const season = await db.season.findUnique({
    where: { id },
    include: { _count: { select: { tournaments: true, clubs: true, leagueMatches: true, playoffMatches: true } } },
  });
  if (!season) {
    return NextResponse.json({ error: 'Season tidak ditemukan' }, { status: 404 });
  }

  // Don't allow deletion if season has matches (too destructive)
  if (season._count.leagueMatches > 0 || season._count.playoffMatches > 0) {
    return NextResponse.json({ error: 'Season tidak bisa dihapus karena sudah memiliki match' }, { status: 400 });
  }

  // Prisma cascade deletes will handle: tournaments → teams → teamPlayers, matches → playerPoints,
  // clubs → clubMembers, donations (SetNull), etc.
  await db.season.delete({ where: { id } });

  await createAuditLog({
    adminId: authResult.id,
    adminName: authResult.username,
    action: 'delete',
    entity: 'season',
    entityId: id,
    details: `Menghapus season "${season.name}"`,
  });

  return NextResponse.json({ success: true, message: 'Season berhasil dihapus' });
}
