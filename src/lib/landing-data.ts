// ═══════════════════════════════════════════════════════════
// LANDING DATA FETCHER — Server-side pre-fetching for SSR
// ═══════════════════════════════════════════════════════════
// Pre-fetches essential landing page data on the server so the
// initial HTML already contains real data (no stale flash).
// Client-side React Query will fetch FULL data and update.

import { db } from '@/lib/db';
import { SEASON_TOTAL_WEEKS } from '@/lib/constants';
import { withDbRetry } from '@/lib/db-resilience';
import { buildSkinMap } from './build-skin-map';

/**
 * Fetch essential stats data for the landing page SSR.
 * Returns data compatible with the StatsData type used by components.
 * Some fields are simplified (empty arrays) — React Query fills them client-side.
 */
export async function fetchLandingStats(division: 'male' | 'female') {
  try {
    const divisionFilter = division;

    // Find seasons for this division
    const allSeasons = await withDbRetry(() => db.season.findMany({
      where: { division: divisionFilter, status: { in: ['active', 'completed'] } },
      orderBy: { number: 'desc' },
      include: { _count: { select: { tournaments: true } } },
    }));

    const season = allSeasons[0];

    if (!season) {
      return {
        hasData: false,
        division,
        allSeasons: [],
        weeklyChampions: [],
        weeklyTopPerformers: [],
        sultanOfWeekly: [],
        totalPlayers: 0,
        approvedPlayerCount: 0,
        topPlayers: [],
        clubs: [],
        skinMap: {},
        recentMatches: [],
        upcomingMatches: [],
        topDonors: [],
        mvpHallOfFame: [],
        totalPrizePool: 0,
        malePrizePool: 0,
        femalePrizePool: 0,
        seasonDonationTotal: 0,
        seasonProgress: { totalWeeks: SEASON_TOTAL_WEEKS, completedWeeks: 0, percentage: 0 },
        activeTournament: null,
      };
    }

    // Find season with clubs (handles new seasons without clubs yet)
    const seasonWithClubs = await withDbRetry(() => db.season.findFirst({
      where: {
        division: divisionFilter,
        id: { in: allSeasons.map(s => s.id) },
        clubs: { some: {} },
      },
      orderBy: { number: 'desc' },
    }));

    const activeSeasonId = season.id;
    const clubSeasonId = seasonWithClubs?.id || season.id;

    // ── Run essential queries in parallel ──
    const [
      totalPlayers,
      seasonPointsRaw,
      allDivisionPlayers,
      clubs,
      tournaments,
      seasonDonations,
    ] = await Promise.all([
      // Total players
      withDbRetry(() => db.player.count({ where: { division: divisionFilter, isActive: true, registrationStatus: 'approved' } })),

      // Per-season points aggregation
      withDbRetry(() => db.playerPoint.groupBy({
        by: ['playerId'],
        where: { seasonId: activeSeasonId },
        _sum: { amount: true },
      })),

      // All active players for leaderboard
      withDbRetry(() => db.player.findMany({
        where: { division: divisionFilter, isActive: true, registrationStatus: 'approved' },
        select: {
          id: true, name: true, gamertag: true, avatar: true, tier: true,
          points: true, totalWins: true, totalMvp: true, streak: true,
          maxStreak: true, matches: true, division: true, city: true, isActive: true,
          clubMembers: {
            where: { leftAt: null },
            include: { profile: { select: { id: true, name: true, logo: true } } },
            take: 1,
          },
        },
      })),

      // Clubs standings
      withDbRetry(() => db.club.findMany({
        where: { seasonId: clubSeasonId },
        orderBy: [{ points: 'desc' }, { gameDiff: 'desc' }],
        include: {
          profile: { include: { _count: { select: { members: true } } } },
          season: { select: { name: true, division: true } },
        },
      })),

      // Tournaments (for weekly champions)
      withDbRetry(() => db.tournament.findMany({
        where: { seasonId: { in: allSeasons.map(s => s.id) } },
        orderBy: { weekNumber: 'asc' },
        include: {
          _count: { select: { teams: true, participations: true } },
          teams: {
            where: { isWinner: true },
            include: {
              teamPlayers: {
                include: {
                  player: {
                    include: {
                      clubMembers: {
                        where: { leftAt: null },
                        include: { profile: { select: { id: true, name: true, logo: true } } },
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
          },
          participations: {
            where: { isMvp: true },
            include: { player: true },
          },
        },
      })),

      // Season donations
      withDbRetry(() => db.donation.findMany({
        where: {
          status: 'approved',
          division: divisionFilter,
          OR: [
            { seasonId: { in: allSeasons.map(s => s.id) } },
            { seasonId: null },
          ],
        },
      })),
    ]);

    // ── Compute topPlayers leaderboard ──
    const seasonPointsMap = new Map(
      seasonPointsRaw.map((sp: { playerId: string; _sum: { amount: number | null } }) => [sp.playerId, sp._sum.amount || 0])
    );

    const topPlayers = (allDivisionPlayers as any[])
      .map(p => {
        const activeClub = p.clubMembers?.[0]?.profile;
        return {
          ...p,
          points: seasonPointsMap.get(p.id) || 0,
          seasonPoints: seasonPointsMap.get(p.id) || 0,
          lifetimePoints: p.points,
          club: activeClub ? { id: activeClub.id, name: activeClub.name, logo: activeClub.logo } : undefined,
        };
      })
      .sort((a: any, b: any) => {
        if (b.seasonPoints !== a.seasonPoints) return b.seasonPoints - a.seasonPoints;
        if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins;
        return b.totalMvp - a.totalMvp;
      });

    // ── Flatten clubs ──
    const flatClubs = clubs.map((c: any) => ({
      id: c.id,
      name: c.profile?.name || '',
      logo: c.profile?.logo || null,
      bannerImage: c.profile?.bannerImage || null,
      division: c.division,
      seasonId: c.seasonId,
      wins: c.wins,
      losses: c.losses,
      points: c.points,
      gameDiff: c.gameDiff,
      _count: { members: c.profile?._count?.members || 0 },
      profileId: c.profileId,
    }));

    // ── Compute weeklyChampions ──
    const completedTournaments = tournaments.filter(t => t.status === 'completed');
    const seasonLookup = new Map(allSeasons.map((s: any) => [s.id, s]));

    const weeklyChampions = completedTournaments.map(t => {
      const winnerTeam = t.teams[0];
      const mvpParticipation = t.participations.find((p: any) => p.isMvp);
      const mvpPlayer = mvpParticipation?.player;
      const tournamentSeason = seasonLookup.get(t.seasonId);
      return {
        weekNumber: t.weekNumber,
        tournamentName: t.name,
        prizePool: t.prizePool,
        completedAt: t.completedAt,
        seasonId: t.seasonId,
        seasonNumber: tournamentSeason?.number ?? 1,
        seasonStatus: tournamentSeason?.status ?? 'active',
        winnerTeam: winnerTeam ? {
          name: winnerTeam.name,
          players: winnerTeam.teamPlayers.map((tp: any) => {
            const activeClub = tp.player.clubMembers?.[0]?.profile;
            return {
              id: tp.player.id,
              gamertag: tp.player.gamertag,
              avatar: tp.player.avatar,
              tier: tp.player.tier,
              points: tp.player.points,
              totalWins: tp.player.totalWins,
              totalMvp: tp.player.totalMvp,
              streak: tp.player.streak,
              matches: tp.player.matches,
              club: activeClub ? { id: activeClub.id, name: activeClub.name, logo: activeClub.logo } : null,
              city: tp.player.city || null,
            };
          }),
        } : null,
        mvp: mvpPlayer ? {
          id: mvpPlayer.id, gamertag: mvpPlayer.gamertag, avatar: mvpPlayer.avatar,
          tier: mvpPlayer.tier, totalMvp: mvpPlayer.totalMvp, points: mvpPlayer.points,
        } : null,
      };
    });

    // ── Compute prize pools ──
    const weeklyDonations = seasonDonations.filter(d => d.type === 'weekly');
    const totalPrizePool = weeklyDonations.reduce((sum, d) => sum + d.amount, 0);
    const malePrizePool = weeklyDonations.filter(d => d.division === 'male').reduce((sum, d) => sum + d.amount, 0);
    const femalePrizePool = weeklyDonations.filter(d => d.division === 'female').reduce((sum, d) => sum + d.amount, 0);
    const seasonDonationTotal = seasonDonations.reduce((sum, d) => sum + d.amount, 0);

    // ── Top donors ──
    const donorAccum = new Map<string, { totalAmount: number; donationCount: number }>();
    for (const d of seasonDonations) {
      const entry = donorAccum.get(d.donorName) ?? { totalAmount: 0, donationCount: 0 };
      donorAccum.set(d.donorName, {
        totalAmount: entry.totalAmount + d.amount,
        donationCount: entry.donationCount + 1,
      });
    }
    const topDonors = Array.from(donorAccum.entries())
      .map(([donorName, data]) => ({
        donorName,
        _sum: { amount: data.totalAmount },
        _count: { id: data.donationCount },
      }))
      .sort((a, b) => b._sum.amount - a._sum.amount)
      .slice(0, 5);

    // ── Season progress ──
    const completedWeeks = tournaments.filter(t => t.status === 'completed').length;

    // ── MVP Hall of Fame (simplified) ──
    // Must be computed before Promise.all since it doesn't depend on allSeasonsInfo
    const mvpHallOfFame = completedTournaments
      .flatMap(t =>
        t.participations.map((p: any) => ({
          _sortKey: p.createdAt as Date,
          id: p.player.id, gamertag: p.player.gamertag, avatar: p.player.avatar,
          tier: p.player.tier, totalMvp: p.player.totalMvp, points: p.player.points,
          totalWins: p.player.totalWins, streak: p.player.streak,
          weekNumber: t.weekNumber, tournamentName: t.name,
        }))
      )
      .sort((a, b) => +b._sortKey - +a._sortKey)
      .map(({ _sortKey, ...rest }: any) => rest);

    // ── Approved player count ──
    const approvedPlayerCount = await withDbRetry(() => db.participation.count({
      where: {
        status: { in: ['approved', 'assigned'] },
        tournament: { seasonId: clubSeasonId },
        player: { division: divisionFilter },
      },
    }));

    // ── Run skinMap building and allSeasonsInfo in parallel ──
    const [skinMapResult, allSeasonsInfo] = await Promise.all([
      buildSkinMap({
        playerIds: topPlayers.map(p => p.id),
        allSeasons: allSeasons as any[],
        completedTournaments,
      }),
      Promise.all(allSeasons.map(async (s: any) => {
        let championPlayer: any = null;
        if (s.championPlayerId) {
          // Try snapshot first for completed seasons
          if (s.championPlayerSnapshot && s.status === 'completed') {
            try {
              const snapshot = JSON.parse(s.championPlayerSnapshot);
              championPlayer = {
                id: s.championPlayerId,
                gamertag: snapshot.gamertag || '',
                avatar: snapshot.avatar || null,
                tier: snapshot.tier || 'B',
                points: snapshot.points || 0,
                totalWins: snapshot.totalWins || 0,
                totalMvp: snapshot.totalMvp || 0,
                streak: snapshot.streak || 0,
                maxStreak: snapshot.maxStreak || 0,
                matches: snapshot.matches || 0,
                club: snapshot.club || null,
                city: snapshot.city || null,
                division: snapshot.division,
                hasSeasonChampionSkin: true, // Season champions always have the virtual skin
              };

              // ★ Enrich snapshot with live avatar/city/club if missing
              // Old snapshots may not have avatar (player uploaded it later),
              // causing SVG placeholders to show for 2 min until client-side refetch.
              if (!snapshot.avatar || !snapshot.city || (typeof snapshot.club === 'string' || !snapshot.club)) {
                const livePlayer = await db.player.findUnique({
                  where: { id: s.championPlayerId },
                  select: {
                    avatar: true,
                    city: true,
                    clubMembers: {
                      where: { leftAt: null },
                      include: { profile: { select: { id: true, name: true, logo: true } } },
                      take: 1,
                    },
                  },
                });
                if (livePlayer) {
                  if (!snapshot.avatar && livePlayer.avatar) {
                    championPlayer.avatar = livePlayer.avatar;
                  }
                  if (!snapshot.city && livePlayer.city) {
                    championPlayer.city = livePlayer.city;
                  }
                  if (typeof snapshot.club === 'string' || !snapshot.club) {
                    const activeClub = livePlayer.clubMembers[0]?.profile;
                    if (activeClub) {
                      championPlayer.club = { id: activeClub.id, name: activeClub.name, logo: activeClub.logo };
                    }
                  }
                }
              }
            } catch { /* fallback to live data */ }
          }

          if (!championPlayer) {
            const player = await db.player.findUnique({
              where: { id: s.championPlayerId },
              include: {
                clubMembers: { where: { leftAt: null }, include: { profile: { select: { id: true, name: true, logo: true } } }, take: 1 },
              },
            });
            if (player) {
              const activeClubProfile = player.clubMembers[0]?.profile;
              championPlayer = {
                id: player.id, gamertag: player.gamertag, avatar: player.avatar,
                tier: player.tier, points: s.championPlayerPoints ?? player.points,
                totalWins: player.totalWins, totalMvp: player.totalMvp,
                streak: player.streak, maxStreak: player.maxStreak, matches: player.matches,
                club: activeClubProfile ? { id: activeClubProfile.id, name: activeClubProfile.name, logo: activeClubProfile.logo } : null,
                city: player.city || null, division: player.division,
                hasSeasonChampionSkin: true, // Season champions always have the virtual skin
              };
            }
          }
        }

        // Champion club
        let championClub: any = null;
        if (s.championClubId) {
          if (s.championClubSnapshot && s.status === 'completed') {
            try {
              const snapshot = JSON.parse(s.championClubSnapshot);
              championClub = { id: s.championClubId, name: snapshot.name || '', logo: snapshot.logo || null };

              // ★ Enrich snapshot with live logo if missing (same pattern as champion player avatar)
              if (!snapshot.logo) {
                const liveProfile = await db.clubProfile.findUnique({
                  where: { id: s.championClubId },
                  select: { logo: true },
                });
                if (liveProfile?.logo) championClub.logo = liveProfile.logo;
              }
            } catch { /* fallback */ }
          }
          if (!championClub) {
            const profile = await db.clubProfile.findUnique({
              where: { id: s.championClubId },
              select: { id: true, name: true, logo: true },
            });
            if (profile) championClub = profile;
          }

          // Enrich with members for completed seasons
          if (championClub && s.status === 'completed') {
            const clubMembers = await db.clubMember.findMany({
              where: { profileId: s.championClubId, leftAt: null },
              include: { player: { select: { id: true, gamertag: true, avatar: true, tier: true, division: true } } },
            });
            const memberIds = clubMembers.map(cm => cm.player.id);
            const sameNumberSeasons = await db.season.findMany({ where: { number: s.number }, select: { id: true } });
            const seasonIds = sameNumberSeasons.map((as2: any) => as2.id);
            const seasonStats = await db.playerSeasonStats.findMany({
              where: { playerId: { in: memberIds }, seasonId: { in: seasonIds } },
            });
            const statsMap = new Map<string, { points: number; tier: string }>();
            for (const ps of seasonStats) {
              const existing = statsMap.get(ps.playerId);
              if (existing) {
                existing.points += ps.points;
                const tierOrder = ['S', 'A', 'B'];
                if (tierOrder.indexOf(ps.tier) < tierOrder.indexOf(existing.tier)) existing.tier = ps.tier;
              } else {
                statsMap.set(ps.playerId, { points: ps.points, tier: ps.tier });
              }
            }
            const members = clubMembers.map(cm => {
              const stat = statsMap.get(cm.player.id);
              return {
                id: cm.player.id, gamertag: cm.player.gamertag, avatar: cm.player.avatar,
                tier: stat?.tier || cm.player.tier, points: stat?.points || 0, division: cm.player.division,
              };
            });
            championClub.members = members;
            championClub.totalPoints = members.reduce((sum: number, m: any) => sum + m.points, 0);
            championClub.maleScore = members.filter((m: any) => m.division === 'male').reduce((sum: number, m: any) => sum + m.points, 0);
            championClub.femaleScore = members.filter((m: any) => m.division === 'female').reduce((sum: number, m: any) => sum + m.points, 0);
          }
        }

        // Sultan of Season (top penyawer)
        let sultanPlayer: any = null;
        if (s.sultanPlayerId) {
          const sultan = await db.player.findUnique({
            where: { id: s.sultanPlayerId },
            select: {
              id: true, gamertag: true, avatar: true, division: true, tier: true,
              points: true, city: true,
              clubMembers: { where: { leftAt: null }, include: { profile: { select: { id: true, name: true, logo: true } } }, take: 1 },
            },
          });
          if (sultan) {
            const activeClub = sultan.clubMembers[0]?.profile;
            sultanPlayer = {
              id: sultan.id,
              gamertag: sultan.gamertag,
              avatar: sultan.avatar,
              division: sultan.division,
              tier: sultan.tier,
              points: sultan.points,
              city: sultan.city || null,
              club: activeClub ? { id: activeClub.id, name: activeClub.name, logo: activeClub.logo } : null,
            };
          }
        }

        return {
          id: s.id, name: s.name, number: s.number, status: s.status,
          startDate: s.startDate, endDate: s.endDate,
          tournamentCount: s._count?.tournaments ?? 0,
          championClubId: s.championClubId,
          championPlayerId: s.championPlayerId,
          championPlayer, championClub,
          sultanPlayerId: s.sultanPlayerId,
          sultanPlayer,
        };
      })),
    ]);

    return {
      hasData: true,
      division,
      season: { id: season.id, name: season.name, number: season.number, status: season.status },
      allSeasons: allSeasonsInfo,
      topPlayers,
      clubs: flatClubs,
      weeklyChampions,
      mvpHallOfFame,
      totalPlayers,
      approvedPlayerCount,
      totalPrizePool,
      malePrizePool,
      femalePrizePool,
      seasonDonationTotal,
      topDonors,
      seasonProgress: {
        totalWeeks: SEASON_TOTAL_WEEKS,
        completedWeeks,
        percentage: SEASON_TOTAL_WEEKS > 0 ? Math.round((completedWeeks / SEASON_TOTAL_WEEKS) * 100) : 0,
      },
      // ── Simplified fields: loaded by client-side React Query ──
      skinMap: skinMapResult,
      weeklyTopPerformers: [] as any[],
      sultanOfWeekly: [] as any[],
      recentMatches: [] as any[],
      upcomingMatches: [] as any[],
      activeTournament: null as any,
    };
  } catch (error) {
    console.error(`[landing-data] Failed to fetch ${division} stats:`, error);
    return null;
  }
}

/**
 * Fetch essential league data for the landing page SSR.
 */
export async function fetchLandingLeague() {
  try {
    const seasons = await withDbRetry(() => db.season.findMany({
      where: { status: { in: ['active', 'completed'] }, division: { in: ['male', 'female'] } },
      orderBy: { number: 'desc' },
      include: {
        championClub: {
          select: {
            id: true, name: true, logo: true,
            members: {
              where: { leftAt: null },
              include: { player: { select: { id: true, gamertag: true, division: true, tier: true, points: true, avatar: true } } },
            },
          },
        },
        championPlayer: {
          select: {
            id: true, gamertag: true, division: true, tier: true, points: true,
            avatar: true, totalWins: true, totalMvp: true,
          },
        },
      },
    }));

    if (!seasons || seasons.length === 0) {
      return { hasData: false, reason: 'no_season', tarkamChampion: null };
    }

    const season = seasons[0];
    const allSeasonIds = seasons.map(s => s.id);

    // ── Get ClubProfiles with members ──
    const clubProfiles = await withDbRetry(() => db.clubProfile.findMany({
      orderBy: { name: 'asc' },
      include: {
        members: {
          where: { leftAt: null },
          include: { player: { select: { id: true, gamertag: true, division: true, tier: true, points: true, avatar: true } } },
        },
        seasonEntries: { where: { seasonId: { in: allSeasonIds } } },
      },
    }));

    if (clubProfiles.length === 0) {
      return {
        hasData: false,
        reason: 'no_clubs',
        season: { id: season.id, name: season.name, number: season.number },
        tarkamChampion: null,
      };
    }

    // ── Compute Tarkam club points ──
    const dedupedClubs = clubProfiles.map(profile => {
      const maleMembers = profile.members.filter(m => m.player.division === 'male');
      const femaleMembers = profile.members.filter(m => m.player.division === 'female');
      const malePoints = maleMembers.reduce((sum, m) => sum + m.player.points, 0);
      const femalePoints = femaleMembers.reduce((sum, m) => sum + m.player.points, 0);
      const tarkamPoints = malePoints + femalePoints;

      let totalWins = 0, totalLosses = 0, totalGameDiff = 0;
      for (const entry of profile.seasonEntries) {
        totalWins += entry.wins;
        totalLosses += entry.losses;
        totalGameDiff += entry.gameDiff;
      }

      return {
        id: profile.id, name: profile.name, logo: profile.logo,
        bannerImage: profile.bannerImage,
        points: tarkamPoints, malePoints, femalePoints,
        wins: totalWins, losses: totalLosses, gameDiff: totalGameDiff,
        memberCount: profile.members.length,
        maleMemberCount: maleMembers.length,
        femaleMemberCount: femaleMembers.length,
        members: profile.members.map(m => ({
          id: m.player.id, gamertag: m.player.gamertag, name: m.player.gamertag,
          division: m.player.division, tier: m.player.tier, points: m.player.points,
          role: m.role, avatar: m.player.avatar,
        })),
      };
    }).sort((a, b) => b.points - a.points);

    // ── Tarkam Champion ──
    const tarkamChampionClub = dedupedClubs[0] || null;

    const championSeason = seasons.find(s => s.championPlayerId && s.championPlayer);
    const tarkamPlayerChampion = championSeason?.championPlayer ? {
      id: championSeason.championPlayer.id,
      gamertag: championSeason.championPlayer.gamertag,
      division: championSeason.championPlayer.division,
      tier: championSeason.championPlayer.tier,
      points: championSeason.championPlayer.points,
      totalWins: championSeason.championPlayer.totalWins,
      totalMvp: championSeason.championPlayer.totalMvp,
      avatar: championSeason.championPlayer.avatar,
      seasonNumber: championSeason.number,
    } : null;

    const tarkamChampion = tarkamChampionClub ? {
      id: tarkamChampionClub.id, name: tarkamChampionClub.name, logo: tarkamChampionClub.logo,
      seasonNumber: season.number,
      malePoints: tarkamChampionClub.malePoints, femalePoints: tarkamChampionClub.femalePoints,
      totalPoints: tarkamChampionClub.points, members: tarkamChampionClub.members,
    } : null;

    const totalClubs = dedupedClubs.length;

    return {
      hasData: true,
      preSeason: dedupedClubs.length > 0 && (await db.leagueMatch.count({ where: { seasonId: { in: allSeasonIds } } })) === 0,
      season: { id: season.id, name: season.name, number: season.number },
      tarkamChampion,
      tarkamPlayerChampion,
      clubs: dedupedClubs,
      stats: {
        totalClubs,
        totalMatches: 0,
        completedMatches: 0,
        liveMatches: 0,
        totalWeeks: 0,
        playedWeeks: 0,
      },
      // Simplified fields — loaded by client-side React Query
      leagueMatches: [],
      playoffMatches: [],
      topPlayers: [],
      mvpCandidates: [],
    };
  } catch (error) {
    console.error('[landing-data] Failed to fetch league data:', error);
    return null;
  }
}
