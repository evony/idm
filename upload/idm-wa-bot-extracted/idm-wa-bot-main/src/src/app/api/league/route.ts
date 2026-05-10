import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  // Get any active season — League is unified, not per-division
  const season = await db.season.findFirst({
    where: { status: 'active' },
    orderBy: { number: 'desc' },
  });

  if (!season) {
    return NextResponse.json({ hasData: false });
  }

  // All clubs — League treats clubs as unified entities (mixed male+female members)
  const allClubs = await db.club.findMany({
    where: { seasonId: season.id },
    orderBy: [{ points: 'desc' }, { gameDiff: 'desc' }],
    include: {
      _count: { select: { members: true } },
      members: {
        include: {
          player: { select: { id: true, gamertag: true, division: true, tier: true, points: true } },
        },
      },
    },
  });

  // All league matches
  const leagueMatches = await db.leagueMatch.findMany({
    where: { seasonId: season.id },
    orderBy: [{ week: 'asc' }],
    include: {
      club1: true,
      club2: true,
    },
  });

  // All playoff matches
  const playoffMatches = await db.playoffMatch.findMany({
    where: { seasonId: season.id },
    include: {
      club1: true,
      club2: true,
    },
    orderBy: { round: 'asc' },
  });

  // Top players across all divisions
  const topPlayers = await db.player.findMany({
    where: { isActive: true },
    orderBy: [{ points: 'desc' }, { totalWins: 'desc' }],
    take: 10,
  });

  // Stats
  const totalClubs = allClubs.length;
  const totalMatches = leagueMatches.length;
  const completedMatches = leagueMatches.filter(m => m.status === 'completed').length;
  const liveMatches = leagueMatches.filter(m => m.status === 'live').length;
  const weeks = [...new Set(leagueMatches.map(m => m.week))].sort((a: number, b: number) => a - b);
  const totalWeeks = 11;

  // MVP candidates
  const mvpCandidates = await db.participation.findMany({
    where: {
      isMvp: true,
      tournament: { seasonId: season.id, status: 'completed' },
    },
    include: { player: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return NextResponse.json({
    hasData: true,
    season: { id: season.id, name: season.name },
    clubs: allClubs.map(c => ({
      id: c.id,
      name: c.name,
      wins: c.wins,
      losses: c.losses,
      points: c.points,
      gameDiff: c.gameDiff,
      memberCount: c._count.members,
      members: c.members.map(m => ({
        id: m.player.id,
        gamertag: m.player.gamertag,
        division: m.player.division,
        tier: m.player.tier,
        points: m.player.points,
        role: m.role,
      })),
    })),
    leagueMatches: leagueMatches.map(m => ({
      id: m.id, week: m.week, score1: m.score1, score2: m.score2,
      status: m.status, format: m.format,
      club1: { id: m.club1.id, name: m.club1.name },
      club2: { id: m.club2.id, name: m.club2.name },
    })),
    playoffMatches: playoffMatches.map(m => ({
      id: m.id, round: m.round, score1: m.score1, score2: m.score2,
      status: m.status, format: m.format,
      club1: { id: m.club1.id, name: m.club1.name },
      club2: { id: m.club2.id, name: m.club2.name },
    })),
    topPlayers: topPlayers.map(p => ({
      id: p.id, gamertag: p.gamertag, division: p.division,
      tier: p.tier, points: p.points, totalWins: p.totalWins,
      totalMvp: p.totalMvp, streak: p.streak,
    })),
    mvpCandidates: mvpCandidates.map(mp => ({
      id: mp.player.id,
      gamertag: mp.player.gamertag,
      tier: mp.player.tier,
      totalMvp: mp.player.totalMvp,
      points: mp.player.points,
      totalWins: mp.player.totalWins,
      streak: mp.player.streak,
    })),
    stats: {
      totalClubs,
      totalMatches,
      completedMatches,
      liveMatches,
      totalWeeks,
      playedWeeks: weeks.length,
    },
    teamFormat: {
      size: 5,
      main: 3,
      substitute: 2,
      rule: 'Wajib minimal 1 peserta female. Tim tidak boleh semua male atau semua female.',
    },
  });
}
