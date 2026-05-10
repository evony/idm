import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
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
    include: { teams: true },
  });

  if (!tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  if (tournament.teams.length < 2) {
    return NextResponse.json({ error: 'Need at least 2 teams to generate bracket' }, { status: 400 });
  }

  // Delete existing matches (regeneration support)
  await db.match.deleteMany({ where: { tournamentId: id } });

  const shuffledTeams = shuffle(tournament.teams);
  const teamCount = shuffledTeams.length;
  const format = tournament.format || 'single_elimination';
  const matchFormat = tournament.defaultMatchFormat || 'BO1';

  const matches = [];

  // ===== SINGLE ELIMINATION =====
  if (format === 'single_elimination') {
    const p2 = nextPowerOf2(teamCount);
    const totalRounds = Math.ceil(Math.log2(p2));
    const byes = p2 - teamCount; // number of teams that get a bye in round 1

    // Round 1: pair up teams, some get byes
    let matchNumber = 0;
    const round1Matches: { id: string; team1Id: string | null; team2Id: string | null; matchNumber: number }[] = [];

    let teamIdx = 0;
    for (let i = 0; i < Math.floor(p2 / 2); i++) {
      matchNumber++;
      const mn = matchNumber;

      // Teams with byes are placed so they auto-advance
      if (i < byes) {
        // One team gets a bye — the other slot is a real team
        // We'll create the match with only team1, team2 = null (bye)
        // Actually for bye: create match with one team, auto-complete it
        const byeTeam = shuffledTeams[teamIdx++];
        const match = await db.match.create({
          data: {
            tournamentId: id,
            round: 1,
            matchNumber: mn,
            bracket: 'upper',
            format: matchFormat,
            team1Id: byeTeam.id,
            team2Id: null, // bye
            status: 'completed',
            score1: 1,
            score2: 0,
            winnerId: byeTeam.id,
            completedAt: new Date(),
          },
        });
        round1Matches.push({ id: match.id, team1Id: byeTeam.id, team2Id: null, matchNumber: mn });
        matches.push(match);
      } else {
        const t1 = shuffledTeams[teamIdx++];
        const t2 = teamIdx < shuffledTeams.length ? shuffledTeams[teamIdx++] : null;
        const match = await db.match.create({
          data: {
            tournamentId: id,
            round: 1,
            matchNumber: mn,
            bracket: 'upper',
            format: matchFormat,
            team1Id: t1.id,
            team2Id: t2?.id || null,
            status: t2 ? 'ready' : 'completed',
            ...(t2 ? {} : { score1: 1, score2: 0, winnerId: t1.id, completedAt: new Date() }),
          },
        });
        round1Matches.push({ id: match.id, team1Id: t1.id, team2Id: t2?.id || null, matchNumber: mn });
        matches.push(match);
      }
    }

    // Create later rounds with TBD teams
    let prevRoundMatchCount = matchNumber;
    for (let round = 2; round <= totalRounds; round++) {
      const matchesInRound = Math.ceil(prevRoundMatchCount / 2);
      for (let i = 1; i <= matchesInRound; i++) {
        const mn = matchNumber + i;
        const match = await db.match.create({
          data: {
            tournamentId: id,
            round,
            matchNumber: mn,
            bracket: 'upper',
            format: matchFormat,
            team1Id: null,
            team2Id: null,
            status: 'pending',
          },
        });
        matches.push(match);
      }
      matchNumber += matchesInRound;
      prevRoundMatchCount = matchesInRound;
    }

    // Feed bye winners into round 2
    // For each completed round 1 match (bye), feed winner to round 2
    const round2Matches = await db.match.findMany({
      where: { tournamentId: id, round: 2 },
      orderBy: { matchNumber: 'asc' },
    });

    const completedR1 = await db.match.findMany({
      where: { tournamentId: id, round: 1, status: 'completed' },
      orderBy: { matchNumber: 'asc' },
    });

    for (const r1 of completedR1) {
      if (!r1.winnerId) continue;
      const r2Idx = Math.ceil(r1.matchNumber / 2) - 1;
      if (r2Idx >= 0 && r2Idx < round2Matches.length) {
        const r2 = round2Matches[r2Idx];
        const isOdd = r1.matchNumber % 2 === 1;
        await db.match.update({
          where: { id: r2.id },
          data: isOdd ? { team1Id: r1.winnerId } : { team2Id: r1.winnerId },
        });

        // Check if round 2 match now has both teams
        const updated = await db.match.findUnique({ where: { id: r2.id } });
        if (updated?.team1Id && updated?.team2Id) {
          await db.match.update({ where: { id: r2.id }, data: { status: 'ready' } });
        }
      }
    }
  }

  // ===== DOUBLE ELIMINATION =====
  else if (format === 'double_elimination') {
    const p2 = nextPowerOf2(teamCount);
    const upperRounds = Math.ceil(Math.log2(p2));
    const byes = p2 - teamCount;
    let matchNumber = 0;

    // Upper bracket — same as SE
    let teamIdx = 0;
    const totalUpperMatches = p2 - 1;

    // Round 1 upper
    for (let i = 0; i < Math.floor(p2 / 2); i++) {
      matchNumber++;
      if (i < byes) {
        const byeTeam = shuffledTeams[teamIdx++];
        const match = await db.match.create({
          data: {
            tournamentId: id, round: 1, matchNumber, bracket: 'upper', format: matchFormat,
            team1Id: byeTeam.id, team2Id: null, status: 'completed',
            score1: 1, score2: 0, winnerId: byeTeam.id, completedAt: new Date(),
          },
        });
        matches.push(match);
      } else {
        const t1 = shuffledTeams[teamIdx++];
        const t2 = teamIdx < shuffledTeams.length ? shuffledTeams[teamIdx++] : null;
        const match = await db.match.create({
          data: {
            tournamentId: id, round: 1, matchNumber, bracket: 'upper', format: matchFormat,
            team1Id: t1.id, team2Id: t2?.id || null,
            status: t2 ? 'ready' : 'completed',
            ...(t2 ? {} : { score1: 1, score2: 0, winnerId: t1.id, completedAt: new Date() }),
          },
        });
        matches.push(match);
      }
    }

    // Later upper rounds
    let prevCount = Math.floor(p2 / 2);
    for (let round = 2; round <= upperRounds; round++) {
      const count = Math.ceil(prevCount / 2);
      for (let i = 1; i <= count; i++) {
        matchNumber++;
        const match = await db.match.create({
          data: {
            tournamentId: id, round, matchNumber, bracket: 'upper', format: matchFormat,
            team1Id: null, team2Id: null, status: 'pending',
          },
        });
        matches.push(match);
      }
      prevCount = count;
    }

    // Feed bye winners into round 2
    const r2Upper = await db.match.findMany({ where: { tournamentId: id, round: 2, bracket: 'upper' }, orderBy: { matchNumber: 'asc' } });
    const completedR1 = await db.match.findMany({ where: { tournamentId: id, round: 1, bracket: 'upper', status: 'completed' }, orderBy: { matchNumber: 'asc' } });
    for (const r1 of completedR1) {
      if (!r1.winnerId) continue;
      const r2Idx = Math.ceil(r1.matchNumber / 2) - 1;
      if (r2Idx >= 0 && r2Idx < r2Upper.length) {
        const isOdd = r1.matchNumber % 2 === 1;
        await db.match.update({ where: { id: r2Upper[r2Idx].id }, data: isOdd ? { team1Id: r1.winnerId } : { team2Id: r1.winnerId } });
        const updated = await db.match.findUnique({ where: { id: r2Upper[r2Idx].id } });
        if (updated?.team1Id && updated?.team2Id) {
          await db.match.update({ where: { id: r2Upper[r2Idx].id }, data: { status: 'ready' } });
        }
      }
    }

    // Lower bracket — simplified: one round per upper round (losers feed in)
    // Lower bracket has (upperRounds - 1) * 2 rounds
    for (let round = 1; round <= (upperRounds - 1) * 2; round++) {
      // Calculate matches in this lower round
      const matchesInRound = Math.max(1, Math.floor(p2 / Math.pow(2, Math.ceil(round / 2) + 1)));
      for (let i = 1; i <= matchesInRound; i++) {
        matchNumber++;
        const match = await db.match.create({
          data: {
            tournamentId: id, round, matchNumber, bracket: 'lower', format: matchFormat,
            team1Id: null, team2Id: null, status: 'pending',
          },
        });
        matches.push(match);
      }
    }

    // Grand final
    matchNumber++;
    const gf = await db.match.create({
      data: {
        tournamentId: id, round: upperRounds + 1, matchNumber, bracket: 'grand_final', format: 'BO5',
        team1Id: null, team2Id: null, status: 'pending',
      },
    });
    matches.push(gf);
  }

  // ===== GROUP STAGE =====
  else if (format === 'group_stage') {
    const groupSize = 4;
    const numGroups = Math.ceil(teamCount / groupSize);
    const groupLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    let matchNumber = 0;

    for (let g = 0; g < numGroups; g++) {
      const groupTeams = shuffledTeams.slice(g * groupSize, (g + 1) * groupSize);
      const label = groupLabels[g];

      // Round-robin: each team plays every other team
      for (let i = 0; i < groupTeams.length; i++) {
        for (let j = i + 1; j < groupTeams.length; j++) {
          matchNumber++;
          const match = await db.match.create({
            data: {
              tournamentId: id, round: 1, matchNumber, bracket: 'group', groupLabel: label, format: matchFormat,
              team1Id: groupTeams[i].id, team2Id: groupTeams[j].id, status: 'ready',
            },
          });
          matches.push(match);
        }
      }
    }

    // Create playoff placeholder matches (semifinal + final) — teams TBD
    // 2 semis + 1 final + 1 3rd place
    matchNumber++;
    await db.match.create({ data: { tournamentId: id, round: 2, matchNumber, bracket: 'upper', format: 'BO3', team1Id: null, team2Id: null, status: 'pending' } });
    matchNumber++;
    await db.match.create({ data: { tournamentId: id, round: 2, matchNumber, bracket: 'upper', format: 'BO3', team1Id: null, team2Id: null, status: 'pending' } });
    matchNumber++;
    await db.match.create({ data: { tournamentId: id, round: 3, matchNumber, bracket: 'upper', format: 'BO3', team1Id: null, team2Id: null, status: 'pending' } });
    matchNumber++;
    await db.match.create({ data: { tournamentId: id, round: 3, matchNumber, bracket: 'lower', format: 'BO3', team1Id: null, team2Id: null, status: 'pending' } });
  }

  await db.tournament.update({ where: { id }, data: { status: 'bracket_generation' } });

  return NextResponse.json({ matches, teamCount, format });
}
