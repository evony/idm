import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * GET /api/clubs/unified-profile?clubId=xxx
 *
 * Given a club ID (Club or ClubProfile), return the unified profile with
 * combined members, stats, and division info.
 *
 * Clubs in IDM League are unified entities — a single ClubProfile has
 * members from both male and female divisions, with season-specific
 * stats in Club entries.
 */
export async function GET(request: Request) {
  const headers = new Headers();
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  const { searchParams } = new URL(request.url);
  const clubId = searchParams.get('clubId');

  if (!clubId) {
    return NextResponse.json({ error: 'clubId is required' }, { headers,  status: 400 });
  }

  // Resolve to ClubProfile
  let profileId = clubId;

  const profile = await db.clubProfile.findUnique({
    where: { id: clubId },
  });

  if (!profile) {
    // Maybe it's a Club ID — look up the profile
    const club = await db.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club tidak ditemukan' }, { headers,  status: 404 });
    }

    profileId = club.profileId;
  }

  // Fetch the full ClubProfile with members and season entries
  const fullProfile = await db.clubProfile.findUnique({
    where: { id: profileId },
    include: {
      members: {
        where: { leftAt: null },
        include: {
          player: {
            select: {
              id: true,
              gamertag: true,
              name: true,
              division: true,
              avatar: true,
              tier: true,
              points: true,
              totalWins: true,
              totalMvp: true,
              streak: true,
              maxStreak: true,
              matches: true,
              isActive: true,
              city: true,
            },
          },
        },
        orderBy: [
          { role: 'desc' }, // captains first
          { player: { gamertag: 'asc' } },
        ],
      },
      seasonEntries: {
        include: {
          season: { select: { id: true, name: true, number: true, division: true } },
        },
      },
    },
  });

  if (!fullProfile) {
    return NextResponse.json({ error: 'Club profile tidak ditemukan' }, { headers,  status: 404 });
  }

  const sameNameClubs = fullProfile.seasonEntries;
  const divisions = [...new Set(sameNameClubs.map(c => c.division))];

  // Combine stats from all season entries
  const totalWins = sameNameClubs.reduce((sum, c) => sum + c.wins, 0);
  const totalLosses = sameNameClubs.reduce((sum, c) => sum + c.losses, 0);
  const totalPoints = sameNameClubs.reduce((sum, c) => sum + c.points, 0);
  const totalGameDiff = sameNameClubs.reduce((sum, c) => sum + c.gameDiff, 0);

  // Count members per division
  const maleMembers = fullProfile.members.filter(m => m.player.division === 'male').length;
  const femaleMembers = fullProfile.members.filter(m => m.player.division === 'female').length;

  // Check if this club is a Liga IDM Season champion
  const championSeasons = await db.season.findMany({
    where: {
      championClubId: profileId,
      status: 'completed',
    },
    select: {
      id: true,
      name: true,
      number: true,
      division: true,
    },
    orderBy: { number: 'desc' },
  });

  return NextResponse.json({
    id: profileId,
    name: fullProfile.name,
    logo: fullProfile.logo,
    bannerImage: fullProfile.bannerImage,
    // Unified stats across all divisions
    wins: totalWins,
    losses: totalLosses,
    points: totalPoints,
    gameDiff: totalGameDiff,
    // Division info
    divisions,
    hasMaleDivision: divisions.includes('male'),
    hasFemaleDivision: divisions.includes('female'),
    maleMembers,
    femaleMembers,
    // Club IDs per division for reference
    clubIds: sameNameClubs.map(c => ({ id: c.id, division: c.division })),
    // Members with division info
    members: fullProfile.members.map(m => ({
      id: m.player.id,
      gamertag: m.player.gamertag,
      name: m.player.name,
      division: m.player.division,
      avatar: m.player.avatar,
      tier: m.player.tier,
      points: m.player.points,
      totalWins: m.player.totalWins,
      totalMvp: m.player.totalMvp,
      streak: m.player.streak,
      maxStreak: m.player.maxStreak,
      matches: m.player.matches,
      isActive: m.player.isActive,
      role: m.role,
      city: m.player.city,
    })),
    // Per-division stats breakdown
    divisionStats: sameNameClubs.map(c => ({
      division: c.division,
      wins: c.wins,
      losses: c.losses,
      points: c.points,
      gameDiff: c.gameDiff,
      season: c.season,
    })),
    // League champion seasons
    championSeasons,
  }, { headers });
}
