import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { awardPoints } from '@/lib/points';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const body = await request.json();
  const { matchId, score1, score2 } = body;

  if (!matchId || score1 === undefined || score2 === undefined) {
    return NextResponse.json({ error: 'matchId, score1, score2 required' }, { status: 400 });
  }

  const match = await db.match.findUnique({
    where: { id: matchId },
    include: { tournament: true, team1: { include: { teamPlayers: { include: { player: true } } } }, team2: { include: { teamPlayers: { include: { player: true } } } } },
  });

  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  if (match.tournamentId !== id) {
    return NextResponse.json({ error: 'Match does not belong to this tournament' }, { status: 400 });
  }

  if (match.status === 'completed') {
    return NextResponse.json({ error: 'Match already completed' }, { status: 400 });
  }

  if (!match.team1Id || !match.team2Id) {
    return NextResponse.json({ error: 'Both teams must be set before scoring' }, { status: 400 });
  }

  // Determine winner and loser
  const winnerId = score1 > score2 ? match.team1Id : score2 > score1 ? match.team2Id : null;
  const loserId = score1 > score2 ? match.team2Id : score2 > score1 ? match.team1Id : null;

  if (!winnerId) {
    return NextResponse.json({ error: 'Draws are not allowed in elimination brackets' }, { status: 400 });
  }

  // Get team names for descriptions
  const winningTeam = match.team1Id === winnerId ? match.team1! : match.team2!;
  const losingTeam = match.team1Id === loserId ? match.team1! : match.team2!;
  const matchLabel = `R${match.round}M${match.matchNumber} ${winningTeam.name} vs ${losingTeam.name}`;

  // Update the match
  const updatedMatch = await db.match.update({
    where: { id: matchId },
    data: {
      score1,
      score2,
      status: 'completed',
      winnerId,
      loserId,
      completedAt: new Date(),
    },
  });

  // ===== AWARD MATCH POINTS WITH AUDIT TRAIL =====
  // 1 participation point (once per tournament) + 2 points per match win
  for (const tp of winningTeam.teamPlayers) {
    // Check if participation point already given
    const participation = await db.participation.findUnique({
      where: { playerId_tournamentId: { playerId: tp.playerId, tournamentId: id } },
    });

    if (participation) {
      const participationPtGiven = participation.pointsEarned >= 1;
      const participationPts = participationPtGiven ? 0 : 1;
      const winPts = 2;
      const totalPts = participationPts + winPts;

      // Update participation record
      await db.participation.update({
        where: { id: participation.id },
        data: { pointsEarned: participation.pointsEarned + totalPts },
      });

      // Award participation point (if first match in this tournament)
      if (!participationPtGiven) {
        await awardPoints({
          playerId: tp.playerId,
          amount: 1,
          reason: 'participation',
          description: `Partisipasi tournament - ${match.tournament.name}`,
          tournamentId: id,
          matchId,
        });
      }

      // Award match win point
      await awardPoints({
        playerId: tp.playerId,
        amount: winPts,
        reason: 'match_win',
        description: `Menang match ${matchLabel}`,
        tournamentId: id,
        matchId,
      });

      // Update player stats (streak, wins, matches)
      const player = tp.player;
      const newStreak = player.streak + 1;
      await db.player.update({
        where: { id: tp.playerId },
        data: {
          totalWins: player.totalWins + 1,
          matches: player.matches + 1,
          streak: newStreak,
          maxStreak: Math.max(newStreak, player.maxStreak),
        },
      });
    }
  }

  // Losing team: 1 participation point (once)
  for (const tp of losingTeam.teamPlayers) {
    const participation = await db.participation.findUnique({
      where: { playerId_tournamentId: { playerId: tp.playerId, tournamentId: id } },
    });

    if (participation) {
      const participationPtGiven = participation.pointsEarned >= 1;
      const participationPts = participationPtGiven ? 0 : 1;

      // Update participation record
      await db.participation.update({
        where: { id: participation.id },
        data: { pointsEarned: participation.pointsEarned + participationPts },
      });

      // Award participation point (if first match in this tournament)
      if (!participationPtGiven) {
        await awardPoints({
          playerId: tp.playerId,
          amount: 1,
          reason: 'participation',
          description: `Partisipasi tournament - ${match.tournament.name}`,
          tournamentId: id,
          matchId,
        });
      }

      // Update player stats (streak reset, matches increment)
      await db.player.update({
        where: { id: tp.playerId },
        data: {
          matches: tp.player.matches + 1,
          streak: 0, // losing resets streak
        },
      });
    }
  }

  // ===== BRACKET ADVANCEMENT =====
  const tournament2 = await db.tournament.findUnique({ where: { id } });
  if (!tournament2) return NextResponse.json(updatedMatch);

  const format = tournament2.format;
  const currentRound = match.round;
  const currentMatchNumber = match.matchNumber;
  const bracket = match.bracket;

  // Find next match in the same bracket
  if (bracket === 'upper' && format !== 'group_stage') {
    // Winner advances to next upper bracket round
    const nextRound = currentRound + 1;
    const nextMatchNumber = Math.ceil(currentMatchNumber / 2);
    const nextMatch = await db.match.findFirst({
      where: { tournamentId: id, round: nextRound, bracket: 'upper', matchNumber: nextMatchNumber },
    });

    if (nextMatch) {
      const isOdd = currentMatchNumber % 2 === 1;
      await db.match.update({
        where: { id: nextMatch.id },
        data: {
          ...(isOdd ? { team1Id: winnerId } : { team2Id: winnerId }),
        },
      });

      // Check if next match now has both teams
      const updated = await db.match.findUnique({ where: { id: nextMatch.id } });
      if (updated?.team1Id && updated?.team2Id && updated.status === 'pending') {
        await db.match.update({ where: { id: nextMatch.id }, data: { status: 'ready' } });
      }
    }

    // For DE: loser drops to lower bracket
    if (format === 'double_elimination' && loserId) {
      // Find the corresponding lower bracket match
      const lowerRound = currentRound;
      const lowerMatch = await db.match.findFirst({
        where: { tournamentId: id, round: lowerRound, bracket: 'lower' },
        orderBy: { matchNumber: 'asc' },
      });

      if (lowerMatch) {
        if (!lowerMatch.team1Id) {
          await db.match.update({ where: { id: lowerMatch.id }, data: { team1Id: loserId } });
        } else if (!lowerMatch.team2Id) {
          await db.match.update({ where: { id: lowerMatch.id }, data: { team2Id: loserId } });
          const updated2 = await db.match.findUnique({ where: { id: lowerMatch.id } });
          if (updated2?.team1Id && updated2?.team2Id && updated2.status === 'pending') {
            await db.match.update({ where: { id: lowerMatch.id }, data: { status: 'ready' } });
          }
        }
      }
    }
  }

  // Lower bracket winner advancement
  if (bracket === 'lower' && format === 'double_elimination') {
    const nextLowerRound = currentRound + 1;
    const nextLowerMatch = await db.match.findFirst({
      where: { tournamentId: id, round: nextLowerRound, bracket: 'lower' },
    });

    if (nextLowerMatch) {
      if (!nextLowerMatch.team1Id) {
        await db.match.update({ where: { id: nextLowerMatch.id }, data: { team1Id: winnerId } });
      } else if (!nextLowerMatch.team2Id) {
        await db.match.update({ where: { id: nextLowerMatch.id }, data: { team2Id: winnerId } });
        const updated3 = await db.match.findUnique({ where: { id: nextLowerMatch.id } });
        if (updated3?.team1Id && updated3?.team2Id && updated3.status === 'pending') {
          await db.match.update({ where: { id: nextLowerMatch.id }, data: { status: 'ready' } });
        }
      }
    } else {
      // No more lower rounds → winner goes to grand final
      const gf = await db.match.findFirst({
        where: { tournamentId: id, bracket: 'grand_final' },
      });
      if (gf) {
        await db.match.update({ where: { id: gf.id }, data: { team2Id: winnerId } });
        const updated4 = await db.match.findUnique({ where: { id: gf.id } });
        if (updated4?.team1Id && updated4?.team2Id && updated4.status === 'pending') {
          await db.match.update({ where: { id: gf.id }, data: { status: 'ready' } });
        }
      }
    }
  }

  // ===== Check if all matches completed =====
  const pendingMatches = await db.match.count({
    where: { tournamentId: id, status: { in: ['pending', 'ready', 'live'] } },
  });

  if (pendingMatches === 0) {
    // All matches done → auto advance to finalization
    await db.tournament.update({ where: { id }, data: { status: 'finalization' } });
  } else if (tournament2.status === 'bracket_generation') {
    await db.tournament.update({ where: { id }, data: { status: 'main_event' } });
  }

  return NextResponse.json(updatedMatch);
}
