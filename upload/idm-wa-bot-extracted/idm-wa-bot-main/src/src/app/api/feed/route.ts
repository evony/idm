import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export interface FeedItem {
  id: string;
  type: 'transfer' | 'donation' | 'score' | 'champion' | 'mvp' | 'registration';
  icon: string;
  title: string;
  subtitle: string;
  timestamp: string;
  division?: string;
  accent: string; // tailwind color class or hex
}

export async function GET() {
  const feedItems: FeedItem[] = [];

  // Run all queries in parallel
  const [
    recentDonations,
    recentCompletedMatches,
    recentChampionTournaments,
    recentMvpPlayers,
    recentClubMembers,
    recentRegistrations,
  ] = await Promise.all([
    // Latest donations
    db.donation.findMany({
      where: { amount: { gt: 0 } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),

    // Latest completed league matches
    db.leagueMatch.findMany({
      where: { status: 'completed', score1: { not: null }, score2: { not: null } },
      orderBy: { week: 'desc' },
      take: 8,
      include: { club1: true, club2: true, season: true },
    }),

    // Latest completed tournaments with winner
    db.tournament.findMany({
      where: { status: 'completed' },
      orderBy: { completedAt: 'desc' },
      take: 4,
      include: {
        teams: { where: { isWinner: true }, take: 1 },
      },
    }),

    // Recent MVPs
    db.match.findMany({
      where: { mvpPlayerId: { not: null }, status: 'completed' },
      orderBy: { completedAt: 'desc' },
      take: 5,
      include: { mvpPlayer: true, tournament: true },
    }),

    // Recent club member changes (transfers / new members)
    db.clubMember.findMany({
      orderBy: { clubId: 'desc' }, // no createdAt, use clubId as proxy
      take: 10,
      include: {
        player: true,
        club: true,
      },
    }),

    // Recent player registrations
    db.player.findMany({
      where: { registrationStatus: 'approved' },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  // ─── Donations ───
  for (const d of recentDonations) {
    feedItems.push({
      id: `don-${d.id}`,
      type: 'donation',
      icon: '💰',
      title: `${d.donorName} menyawer ${formatRupiah(d.amount)}`,
      subtitle: d.message || (d.type === 'season' ? 'Donasi Season' : 'Donasi Weekly'),
      timestamp: d.createdAt.toISOString(),
      accent: '#22c55e',
    });
  }

  // ─── Completed Match Scores ───
  for (const m of recentCompletedMatches) {
    const s1 = m.score1 ?? 0;
    const s2 = m.score2 ?? 0;
    const winner = s1 > s2 ? m.club1.name : s2 > s1 ? m.club2.name : 'Seri';
    feedItems.push({
      id: `score-${m.id}`,
      type: 'score',
      icon: '⚽',
      title: `${m.club1.name} ${s1}–${s2} ${m.club2.name}`,
      subtitle: `Week ${m.week} • ${winner !== 'Seri' ? winner + ' menang!' : 'Seri!'}`,
      timestamp: new Date().toISOString(), // league matches don't have completedAt
      division: m.season?.division,
      accent: '#06b6d4',
    });
  }

  // ─── Champions ───
  for (const t of recentChampionTournaments) {
    const winnerTeam = t.teams.find(team => team.isWinner);
    if (winnerTeam) {
      feedItems.push({
        id: `champ-${t.id}`,
        type: 'champion',
        icon: '🏆',
        title: `${winnerTeam.name} Juara Week ${t.weekNumber}!`,
        subtitle: t.division === 'male' ? 'Male Division' : 'Female Division',
        timestamp: t.completedAt?.toISOString() || t.updatedAt.toISOString(),
        division: t.division,
        accent: '#d4a853',
      });
    }
  }

  // ─── MVP ───
  for (const match of recentMvpPlayers) {
    if (match.mvpPlayer) {
      feedItems.push({
        id: `mvp-${match.id}`,
        type: 'mvp',
        icon: '⭐',
        title: `${match.mvpPlayer.gamertag} MVP!`,
        subtitle: match.tournament?.name || 'Tournament',
        timestamp: match.completedAt?.toISOString() || new Date().toISOString(),
        division: match.mvpPlayer.division,
        accent: '#eab308',
      });
    }
  }

  // ─── Transfers (club member assignments) ───
  // Group by player to detect "transfers" — if a player appears in multiple clubs
  const playerClubMap = new Map<string, { player: typeof recentClubMembers[0]['player']; clubs: string[] }>();
  for (const cm of recentClubMembers) {
    const existing = playerClubMap.get(cm.player.id);
    if (existing) {
      existing.clubs.push(cm.club.name);
    } else {
      playerClubMap.set(cm.player.id, { player: cm.player, clubs: [cm.club.name] });
    }
  }

  for (const [, { player, clubs }] of playerClubMap) {
    if (clubs.length >= 2) {
      // Transfer: player moved from one club to another
      feedItems.push({
        id: `transfer-${player.id}`,
        type: 'transfer',
        icon: '🔄',
        title: `${player.gamertag} pindah ke ${clubs[clubs.length - 1]}`,
        subtitle: `Dari ${clubs[clubs.length - 2]} → ${clubs[clubs.length - 1]}`,
        timestamp: player.updatedAt.toISOString(),
        division: player.division,
        accent: '#a855f7',
      });
    } else {
      // New signing
      feedItems.push({
        id: `sign-${player.id}`,
        type: 'transfer',
        icon: '📝',
        title: `${player.gamertag} bergabung dengan ${clubs[0]}`,
        subtitle: `${player.division === 'male' ? 'Male' : 'Female'} Division`,
        timestamp: player.updatedAt.toISOString(),
        division: player.division,
        accent: '#a855f7',
      });
    }
  }

  // ─── New Registrations ───
  for (const p of recentRegistrations) {
    feedItems.push({
      id: `reg-${p.id}`,
      type: 'registration',
      icon: '🆕',
      title: `${p.gamertag} mendaftar sebagai pemain`,
      subtitle: `${p.division === 'male' ? 'Male' : 'Female'} Division • ${p.city || 'Unknown City'}`,
      timestamp: p.createdAt.toISOString(),
      division: p.division,
      accent: '#22d3ee',
    });
  }

  // Sort by timestamp descending
  feedItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return NextResponse.json({ items: feedItems.slice(0, 30) }, {
    headers: {
      'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20',
    },
  });
}

function formatRupiah(amount: number): string {
  if (amount >= 1000000) return `Rp${(amount / 1000000).toFixed(1)}jt`;
  if (amount >= 1000) return `Rp${(amount / 1000).toFixed(0)}rb`;
  return `Rp${amount}`;
}
