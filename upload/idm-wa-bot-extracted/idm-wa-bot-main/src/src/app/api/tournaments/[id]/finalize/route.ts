import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { awardPoints, processTierUpgrade } from '@/lib/points';
import { checkTournamentAchievements } from '@/lib/achievements';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const body = await request.json();
  const { mvpPlayerId } = body;

  const tournament = await db.tournament.findUnique({
    where: { id },
    include: {
      matches: { include: { team1: true, team2: true, winner: true, loser: true, mvpPlayer: true }, orderBy: { round: 'asc' } },
      teams: { include: { teamPlayers: { include: { player: true } } } },
      participations: { include: { player: true } },
      prizes: { orderBy: { position: 'asc' } },
    },
  });

  if (!tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  if (tournament.status !== 'finalization') {
    return NextResponse.json({ error: 'Tournament must be in finalization status' }, { status: 400 });
  }

  // Check if prizes exist
  if (!tournament.prizes || tournament.prizes.length === 0) {
    return NextResponse.json({ error: 'No prizes configured. Please configure prizes in approval phase.' }, { status: 400 });
  }

  // ===== DETERMINE TEAM RANKINGS =====
  const format = tournament.format;

  // Find champion, runner-up, semi-finalists based on bracket results
  let rank1TeamId: string | null = null;
  let rank2TeamId: string | null = null;
  let rank3TeamIds: string[] = [];

  if (format === 'single_elimination' || format === 'double_elimination') {
    // Find the final match (highest round in upper bracket)
    const upperMatches = tournament.matches.filter(m => m.bracket === 'upper' || m.bracket === 'grand_final');
    const maxRound = Math.max(...upperMatches.map(m => m.round));
    const finalMatch = upperMatches.find(m => m.round === maxRound && m.status === 'completed');

    if (finalMatch) {
      rank1TeamId = finalMatch.winnerId;
      rank2TeamId = finalMatch.loserId;

      // Semi-final losers = rank 3
      const semiMatches = upperMatches.filter(m => m.round === maxRound - 1 && m.status === 'completed');
      for (const sm of semiMatches) {
        if (sm.loserId && sm.loserId !== rank2TeamId) {
          rank3TeamIds.push(sm.loserId);
        }
      }
    }
  } else if (format === 'group_stage') {
    // For group stage, ranking is based on group results + playoff
    const playoffMatches = tournament.matches.filter(m => m.round >= 2 && m.status === 'completed');
    const maxPlayoffRound = playoffMatches.length > 0 ? Math.max(...playoffMatches.map(m => m.round)) : 0;
    const finalMatch = playoffMatches.find(m => m.round === maxPlayoffRound);

    if (finalMatch) {
      rank1TeamId = finalMatch.winnerId;
      rank2TeamId = finalMatch.loserId;
    }
  }

  // Update team ranks
  if (rank1TeamId) {
    await db.team.update({ where: { id: rank1TeamId }, data: { rank: 1, isWinner: true } });
  }
  if (rank2TeamId) {
    await db.team.update({ where: { id: rank2TeamId }, data: { rank: 2 } });
  }
  for (const tid of rank3TeamIds) {
    await db.team.update({ where: { id: tid }, data: { rank: 3 } });
  }

  // ===== AWARD PRIZE POINTS WITH AUDIT TRAIL =====
  const tierUpgrades: { playerId: string; gamertag: string; fromTier: string; toTier: string }[] = [];

  for (const prize of tournament.prizes) {
    const isMvpPrize = prize.label.toLowerCase().includes('mvp');
    const teamPrizeMap: Record<number, string | null> = {
      1: rank1TeamId,
      2: rank2TeamId,
      3: rank3TeamIds[0] || null,
    };

    // Map prize label to reason
    const getPrizeReason = (label: string): string => {
      const l = label.toLowerCase();
      if (l.includes('mvp')) return 'prize_mvp';
      if (l.includes('juara 1') || l.includes('1st')) return 'prize_juara1';
      if (l.includes('juara 2') || l.includes('2nd')) return 'prize_juara2';
      if (l.includes('juara 3') || l.includes('3rd')) return 'prize_juara3';
      return 'prize_other';
    };

    if (isMvpPrize && mvpPlayerId) {
      // Award MVP points directly to the player
      const player = await db.player.findUnique({ where: { id: mvpPlayerId } });
      if (player) {
        // Award points with audit trail
        await awardPoints({
          playerId: mvpPlayerId,
          amount: prize.pointsPerPlayer,
          reason: getPrizeReason(prize.label),
          description: `MVP - ${tournament.name}`,
          tournamentId: id,
        });

        // Update MVP count
        await db.player.update({
          where: { id: mvpPlayerId },
          data: { totalMvp: player.totalMvp + 1 },
        });

        // Update participation
        const part = await db.participation.findUnique({
          where: { playerId_tournamentId: { playerId: mvpPlayerId, tournamentId: id } },
        });
        if (part) {
          await db.participation.update({
            where: { id: part.id },
            data: { pointsEarned: part.pointsEarned + prize.pointsPerPlayer, isMvp: true },
          });
        }

        // Check tier upgrade
        const upgrade = await processTierUpgrade(mvpPlayerId);
        if (upgrade?.upgraded) {
          tierUpgrades.push({ playerId: mvpPlayerId, gamertag: player.gamertag, fromTier: upgrade.fromTier, toTier: upgrade.toTier });
        }
      }

      // Set MVP on the grand final / last match
      const lastMatch = tournament.matches
        .filter(m => m.status === 'completed')
        .sort((a, b) => b.round - a.round)[0];
      if (lastMatch) {
        await db.match.update({ where: { id: lastMatch.id }, data: { mvpPlayerId } });
      }
    } else {
      // Team prize — find the team at this position
      let targetTeamId: string | null = null;
      if (prize.label.toLowerCase().includes('juara 1') || prize.label.toLowerCase().includes('1st')) {
        targetTeamId = rank1TeamId;
      } else if (prize.label.toLowerCase().includes('juara 2') || prize.label.toLowerCase().includes('2nd')) {
        targetTeamId = rank2TeamId;
      } else if (prize.label.toLowerCase().includes('juara 3') || prize.label.toLowerCase().includes('3rd')) {
        targetTeamId = rank3TeamIds[0] || null;
      }

      if (targetTeamId) {
        const team = await db.team.findUnique({
          where: { id: targetTeamId },
          include: { teamPlayers: { include: { player: true } } },
        });

        if (team) {
          for (const tp of team.teamPlayers) {
            // Award points with audit trail
            await awardPoints({
              playerId: tp.playerId,
              amount: prize.pointsPerPlayer,
              reason: getPrizeReason(prize.label),
              description: `${prize.label} - ${tournament.name} (${team.name})`,
              tournamentId: id,
            });

            // Update participation
            const part = await db.participation.findUnique({
              where: { playerId_tournamentId: { playerId: tp.playerId, tournamentId: id } },
            });
            if (part) {
              await db.participation.update({
                where: { id: part.id },
                data: {
                  pointsEarned: part.pointsEarned + prize.pointsPerPlayer,
                  isWinner: rank1TeamId === targetTeamId,
                },
              });
            }

            // Check tier upgrade
            const upgrade = await processTierUpgrade(tp.playerId);
            if (upgrade?.upgraded) {
              tierUpgrades.push({ playerId: tp.playerId, gamertag: tp.player.gamertag, fromTier: upgrade.fromTier, toTier: upgrade.toTier });
            }
          }
        }
      }
    }
  }

  // ===== FINALIZE TOURNAMENT =====
  await db.tournament.update({
    where: { id },
    data: { status: 'completed', finalizedAt: new Date(), completedAt: new Date() },
  });

  // ===== CHECK AND AWARD ACHIEVEMENTS =====
  const achievementsAwarded = await checkTournamentAchievements(id);

  const result = await db.tournament.findUnique({
    where: { id },
    include: {
      matches: { include: { team1: true, team2: true, winner: true, mvpPlayer: true }, orderBy: { round: 'asc' } },
      teams: { include: { teamPlayers: { include: { player: true } } }, orderBy: { rank: 'asc' } },
      participations: { include: { player: true }, orderBy: { pointsEarned: 'desc' } },
      prizes: { orderBy: { position: 'asc' } },
    },
  });

  return NextResponse.json({ ...result, tierUpgrades, achievementsAwarded });
}
