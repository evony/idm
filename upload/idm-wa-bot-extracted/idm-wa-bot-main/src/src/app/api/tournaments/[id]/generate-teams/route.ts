import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

/** Fisher-Yates shuffle in-place */
function fisherYatesShuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;

  const tournament = await db.tournament.findUnique({
    where: { id },
    include: {
      participations: {
        where: { status: 'approved' },
        include: { player: true },
      },
    },
  });

  if (!tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  const totalApproved = tournament.participations.length;

  // VALIDATION: Total must be divisible by 3
  if (totalApproved === 0) {
    return NextResponse.json(
      { error: 'No approved players to form teams' },
      { status: 400 }
    );
  }

  if (totalApproved % 3 !== 0) {
    const remainder = totalApproved % 3;
    const needed = 3 - remainder;
    return NextResponse.json(
      {
        error: `Need ${needed} more player(s) to form complete teams (total must be divisible by 3, current: ${totalApproved})`,
        totalApproved,
        needed,
      },
      { status: 400 }
    );
  }

  // Determine effective tier for each player: tierOverride if set, otherwise player.tier
  type PlayerWithParticipation = typeof tournament.participations[number] & {
    effectiveTier: string;
  };

  const playersWithTier: PlayerWithParticipation[] = tournament.participations.map((p) => ({
    ...p,
    effectiveTier: p.tierOverride || p.player.tier,
  }));

  // Group by effective tier
  const sTier = playersWithTier.filter((p) => p.effectiveTier === 'S');
  const aTier = playersWithTier.filter((p) => p.effectiveTier === 'A');
  const bTier = playersWithTier.filter((p) => p.effectiveTier === 'B');

  const teamCount = totalApproved / 3;

  // Validate tier distribution: each tier must have exactly teamCount players
  if (sTier.length !== teamCount || aTier.length !== teamCount || bTier.length !== teamCount) {
    return NextResponse.json(
      {
        error: `Tier distribution mismatch for ${teamCount} teams. Need ${teamCount} of each tier. Got S:${sTier.length}, A:${aTier.length}, B:${bTier.length}`,
        sCount: sTier.length,
        aCount: aTier.length,
        bCount: bTier.length,
        teamCount,
      },
      { status: 400 }
    );
  }

  // SHUFFLE: Randomize each tier independently using Fisher-Yates
  const shuffledS = fisherYatesShuffle(sTier);
  const shuffledA = fisherYatesShuffle(aTier);
  const shuffledB = fisherYatesShuffle(bTier);

  // Delete existing teams first (regeneration support)
  // TeamPlayer and Team cascade deletion
  const existingTeams = await db.team.findMany({ where: { tournamentId: id } });
  if (existingTeams.length > 0) {
    await db.teamPlayer.deleteMany({
      where: { teamId: { in: existingTeams.map((t) => t.id) } },
    });
    await db.team.deleteMany({ where: { tournamentId: id } });
  }

  // Each team gets 1S + 1A + 1B
  const teams: { id: string; name: string; power: number; playerIds: string[] }[] = [];

  for (let i = 0; i < teamCount; i++) {
    const sPlayer = shuffledS[i];
    const aPlayer = shuffledA[i];
    const bPlayer = shuffledB[i];

    const teamName = `Team ${String.fromCharCode(65 + i)}`; // Team A, Team B, etc.
    const power = sPlayer.player.points + aPlayer.player.points + bPlayer.player.points;
    const playerIds = [sPlayer.playerId, aPlayer.playerId, bPlayer.playerId];

    const team = await db.team.create({
      data: {
        name: teamName,
        tournamentId: id,
        power,
      },
    });

    await db.teamPlayer.createMany({
      data: playerIds.map((playerId) => ({
        teamId: team.id,
        playerId,
      })),
    });

    teams.push({ id: team.id, name: teamName, power, playerIds });
  }

  // Auto-balance: After initial assignment, try swapping B-tier players between teams if power imbalance > 15%
  if (teams.length >= 2) {
    let improved = true;
    let iterations = 0;
    const maxIterations = teams.length * teams.length; // prevent infinite loops

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;

      // Recalculate team powers from DB
      const teamsWithPlayers = await db.team.findMany({
        where: { tournamentId: id },
        include: { teamPlayers: { include: { player: true } } },
      });

      // Find min and max power
      const powers = teamsWithPlayers.map((t) => t.power);
      const maxPower = Math.max(...powers);
      const minPower = Math.min(...powers);

      // Check if imbalance > 15%
      if (maxPower > 0 && (maxPower - minPower) / maxPower > 0.15) {
        // Sort teams by power descending to find strongest and weakest
        const sorted = [...teamsWithPlayers].sort((a, b) => b.power - a.power);
        const strongest = sorted[0];
        const weakest = sorted[sorted.length - 1];

        // Find B-tier players to swap
        const bPlayerStrongest = strongest.teamPlayers.find(
          (tp) => tp.player.tier === 'B'
        );
        const bPlayerWeakest = weakest.teamPlayers.find(
          (tp) => tp.player.tier === 'B'
        );

        if (bPlayerStrongest && bPlayerWeakest) {
          const newStrongestPower =
            strongest.power - bPlayerStrongest.player.points + bPlayerWeakest.player.points;
          const newWeakestPower =
            weakest.power - bPlayerWeakest.player.points + bPlayerStrongest.player.points;

          // Only swap if it reduces the imbalance
          const currentImbalance = maxPower - minPower;
          const newMaxPower = Math.max(newStrongestPower, newWeakestPower);
          const newMinPower = Math.min(newStrongestPower, newWeakestPower);
          const newImbalance = newMaxPower - newMinPower;

          if (newImbalance < currentImbalance) {
            // Swap player assignments
            await db.teamPlayer.update({
              where: { id: bPlayerStrongest.id },
              data: { playerId: bPlayerWeakest.playerId },
            });
            await db.teamPlayer.update({
              where: { id: bPlayerWeakest.id },
              data: { playerId: bPlayerStrongest.playerId },
            });

            // Update team powers
            await db.team.update({
              where: { id: strongest.id },
              data: { power: newStrongestPower },
            });
            await db.team.update({
              where: { id: weakest.id },
              data: { power: newWeakestPower },
            });

            improved = true;
          }
        }
      }
    }
  }

  // Update tournament status
  await db.tournament.update({
    where: { id },
    data: { status: 'team_generation' },
  });

  // Update participation statuses to "assigned"
  await db.participation.updateMany({
    where: { tournamentId: id, status: 'approved' },
    data: { status: 'assigned' },
  });

  const finalTeams = await db.team.findMany({
    where: { tournamentId: id },
    include: { teamPlayers: { include: { player: true } } },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ teams: finalTeams, teamCount });
}
