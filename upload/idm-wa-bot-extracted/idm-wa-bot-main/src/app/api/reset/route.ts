import { db } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/api-auth';
import { getSafeErrorMessage } from '@/lib/api-error';
import { NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit';

/**
 * POST /api/reset
 * Resets tournament data, player points, club points, season data, skins & badges
 * ONLY for the currently active season(s).
 * Completed/closed seasons remain intact with all champion & snapshot data.
 * Keeps: Players, ClubProfiles, ClubMembers, Admins, Accounts, CMS data, Sponsors
 * Resets: PlayerSkins, donorBadgeCount, sawerBadgeTier
 */
export async function POST(request: Request) {
  const authResult = await requireSuperAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const results: Record<string, number> = {};

    // ============================================================
    // STEP 0: Find active season(s) — only reset these
    // ============================================================
    const activeSeasons = await db.season.findMany({
      where: { status: 'active' },
      select: { id: true },
    });

    if (activeSeasons.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tidak ada season aktif. Tidak ada data yang di-reset.',
        details: results,
      });
    }

    const activeSeasonIds = activeSeasons.map((s) => s.id);

    // ============================================================
    // STEP 1: Find all tournaments in active seasons
    // ============================================================
    const activeTournaments = await db.tournament.findMany({
      where: { seasonId: { in: activeSeasonIds } },
      select: { id: true },
    });
    const activeTournamentIds = activeTournaments.map((t) => t.id);

    // ============================================================
    // STEP 2: Delete tournament-related data (respect foreign key order)
    // Only for tournaments in active seasons
    // ============================================================

    if (activeTournamentIds.length > 0) {
      // 2a. PlayerAchievement — only for active season tournaments
      results.playerAchievement = (
        await db.playerAchievement.deleteMany({
          where: { tournamentId: { in: activeTournamentIds } },
        })
      ).count;

      // 2b. TournamentPrize — only for active season tournaments
      results.tournamentPrize = (
        await db.tournamentPrize.deleteMany({
          where: { tournamentId: { in: activeTournamentIds } },
        })
      ).count;

      // 2c. TournamentSponsor — only for active season tournaments
      results.tournamentSponsor = (
        await db.tournamentSponsor.deleteMany({
          where: { tournamentId: { in: activeTournamentIds } },
        })
      ).count;

      // 2d. SponsoredPrize — only for active season tournaments
      results.sponsoredPrize = (
        await db.sponsoredPrize.deleteMany({
          where: { tournamentId: { in: activeTournamentIds } },
        })
      ).count;

      // 2e. Match — only for active season tournaments
      results.match = (
        await db.match.deleteMany({
          where: { tournamentId: { in: activeTournamentIds } },
        })
      ).count;

      // 2f. TeamPlayer — must delete before Team (foreign key)
      // Find team IDs in active tournaments first
      const activeTeams = await db.team.findMany({
        where: { tournamentId: { in: activeTournamentIds } },
        select: { id: true },
      });
      const activeTeamIds = activeTeams.map((t) => t.id);

      if (activeTeamIds.length > 0) {
        results.teamPlayer = (
          await db.teamPlayer.deleteMany({
            where: { teamId: { in: activeTeamIds } },
          })
        ).count;
      }

      // 2g. Team — only for active season tournaments
      results.team = (
        await db.team.deleteMany({
          where: { tournamentId: { in: activeTournamentIds } },
        })
      ).count;

      // 2h. Participation — only for active season tournaments
      results.participation = (
        await db.participation.deleteMany({
          where: { tournamentId: { in: activeTournamentIds } },
        })
      ).count;

      // 2i. WaRegistration — only for active season tournaments
      results.waRegistration = (
        await db.waRegistration.deleteMany({
          where: { tournamentId: { in: activeTournamentIds } },
        })
      ).count;

      // 2j. Tournament — only for active seasons
      results.tournament = (
        await db.tournament.deleteMany({
          where: { seasonId: { in: activeSeasonIds } },
        })
      ).count;
    }

    // ============================================================
    // STEP 3: Delete PlayerPoint records for active seasons
    // ============================================================
    results.playerPoint = (
      await db.playerPoint.deleteMany({
        where: { seasonId: { in: activeSeasonIds } },
      })
    ).count;

    // ============================================================
    // STEP 4: Delete league & playoff matches for active seasons
    // ============================================================
    results.leagueMatch = (
      await db.leagueMatch.deleteMany({
        where: { seasonId: { in: activeSeasonIds } },
      })
    ).count;

    results.playoffMatch = (
      await db.playoffMatch.deleteMany({
        where: { seasonId: { in: activeSeasonIds } },
      })
    ).count;

    // ============================================================
    // STEP 5: Delete donations for active seasons
    // ============================================================
    results.donation = (
      await db.donation.deleteMany({
        where: { seasonId: { in: activeSeasonIds } },
      })
    ).count;

    // ============================================================
    // STEP 6: Delete PlayerSeasonStats for active seasons
    // Then reset ALL Player flat stats to 0
    // (Completed season stats are preserved as historical records,
    //  but the displayed points/wins/etc on the Player record are
    //  reset to 0 — admin expects a full clean slate after reset)
    // ============================================================
    results.playerSeasonStats = (
      await db.playerSeasonStats.deleteMany({
        where: { seasonId: { in: activeSeasonIds } },
      })
    ).count;

    // Reset ALL player flat stats to zero — regardless of completed season history
    const playerReset = await db.player.updateMany({
      data: {
        points: 0,
        totalWins: 0,
        totalMvp: 0,
        streak: 0,
        maxStreak: 0,
        matches: 0,
        tier: 'B',
      },
    });
    results.playersReset = playerReset.count;

    // ============================================================
    // STEP 7: Reset Club entries for active seasons only
    // Club entries belong to a specific season (profileId + seasonId + division)
    // ============================================================
    const clubUpdate = await db.club.updateMany({
      where: { seasonId: { in: activeSeasonIds } },
      data: {
        points: 0,
        wins: 0,
        losses: 0,
        gameDiff: 0,
      },
    });
    results.clubsReset = clubUpdate.count;

    // ============================================================
    // STEP 8: Reset only active seasons — clear champion/snapshot
    // Completed seasons are LEFT UNTOUCHED
    // ============================================================
    const seasonUpdate = await db.season.updateMany({
      where: { status: 'active' },
      data: {
        championClubId: null,
        championPlayerId: null,
        championPlayerPoints: null,
        championPlayerSnapshot: null,
        championClubSnapshot: null,
        championSquad: null,
      },
    });
    results.seasonsReset = seasonUpdate.count;

    // ============================================================
    // STEP 9: Reset skins & badges for active season participants
    // - Delete PlayerSkin records (awarded skins)
    // - Reset Account.donorBadgeCount & sawerBadgeTier
    // - Delete PlayerAchievement for non-tournament achievements in active seasons
    // ============================================================

    // 9a. Delete all PlayerSkin records (awarded badges/skins)
    // These are explicitly granted skins (season_champion, champion, mvp, donor, etc.)
    // Virtual skins (derived from tournaments/seasons) are already gone after Step 2-8
    results.playerSkins = (
      await db.playerSkin.deleteMany({})
    ).count;

    // 9b. Reset donor badge counts and sawer badge tiers on all Accounts
    const badgeReset = await db.account.updateMany({
      data: {
        donorBadgeCount: 0,
        sawerBadgeTier: 'none',
      },
    });
    results.badgesReset = badgeReset.count;

    // ============================================================
    // AUDIT LOG
    // ============================================================
    await createAuditLog({
      adminId: authResult.id,
      adminName: authResult.username,
      action: 'reseed',
      entity: 'admin',
      details: `Reset poin, data turnamen, skin & badge untuk season aktif (${activeSeasonIds.join(', ')}). Season completed tidak terpengaruh.`,
      metadata: results,
    });

    return NextResponse.json({
      success: true,
      message: `Data turnamen season aktif berhasil di-reset! Semua poin pemain di-nol-kan, skin & badge di-reset. Season yang sudah completed tetap utuh sebagai arsip.`,
      details: results,
    });
  } catch (e: unknown) {
    const error = e as Error;
    console.error('Reset error:', error);
    return NextResponse.json({ error: getSafeErrorMessage(e) }, { status: 500 });
  }
}
