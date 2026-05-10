import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get('force') === 'true';

  if (force) {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;
  } else {
    const playerCount = await db.player.count();
    if (playerCount > 0) {
      return NextResponse.json({ success: true, message: 'Database already has data — seeding skipped' });
    }
  }

  try {
    // Clear existing data
    await db.teamPlayer.deleteMany();
    await db.match.deleteMany();
    await db.team.deleteMany();
    await db.participation.deleteMany();
    await db.donation.deleteMany();
    await db.clubMember.deleteMany();
    await db.leagueMatch.deleteMany();
    await db.playoffMatch.deleteMany();
    await db.club.deleteMany();
    await db.tournament.deleteMany();
    await db.season.deleteMany();
    await db.player.deleteMany();

    // ======== SEASONS ========
    const maleSeason = await db.season.create({
      data: {
        name: 'IDM League Season 1 - Male',
        number: 1,
        division: 'male',
        status: 'active',
        startDate: new Date('2025-01-06'),
      },
    });

    const femaleSeason = await db.season.create({
      data: {
        name: 'IDM League Season 1 - Female',
        number: 1,
        division: 'female',
        status: 'active',
        startDate: new Date('2025-01-06'),
      },
    });

    // ======== PLAYERS — All points zeroed ========
    const maleData = [
      { gamertag: 'cepz', club: 'SALVADOR' },
      { gamertag: 'Afroki', club: 'SOUTHERN' },
      { gamertag: 'Airuen', club: 'AVENUE' },
      { gamertag: 'Life', club: 'SALVADOR' },
      { gamertag: 'Armors', club: 'SOUTHERN' },
      { gamertag: 'Bambang', club: 'MAXIMOUS' },
      { gamertag: 'ziafu', club: 'MYSTERY' },
      { gamertag: 'afi', club: 'MAXIMOUS' },
      { gamertag: 'Kageno', club: 'AVENUE' },
      { gamertag: 'janskie', club: 'SOUTHERN' },
      { gamertag: 'zico', club: 'EUPHORIC' },
      { gamertag: 'Vriskey_', club: 'EUPHORIC' },
      { gamertag: 'astro', club: 'MAXIMOUS' },
      { gamertag: 'ipinnn', club: 'GYMSHARK' },
      { gamertag: 'sheraid', club: 'MAXIMOUS' },
      { gamertag: 'yay', club: 'MAXIMOUS' },
      { gamertag: 'Oura', club: 'SALVADOR' },
      { gamertag: 'Jave', club: 'RESTART' },
      { gamertag: 'zmz', club: 'ALQA' },
      { gamertag: 'Georgie', club: 'ALQA' },
      { gamertag: 'Chrollo', club: 'EUPHORIC' },
      { gamertag: 'Vankless', club: 'SOUTHERN' },
      { gamertag: 'Dylee', club: 'SENSEI' },
      { gamertag: 'Earth', club: 'MAXIMOUS' },
      { gamertag: 'chikoo', club: 'SENSEI' },
      { gamertag: 'fyy', club: 'GYMSHARK' },
      { gamertag: 'montiel', club: 'PARANOID' },
      { gamertag: 'marimo', club: 'SECRETS' },
      { gamertag: 'tonsky', club: 'MAXIMOUS' },
      { gamertag: 'Ren', club: 'MAXIMOUS' },
      { gamertag: 'RIVALDO', club: 'EUPHORIC' },
      { gamertag: 'jugger', club: 'GYMSHARK' },
      { gamertag: 'WHYSON', club: 'RESTART' },
      { gamertag: 'DUUL', club: 'PARANOID' },
      { gamertag: 'ZORO', club: 'PARANOID' },
      { gamertag: 'VICKY', club: 'MAXIMOUS' },
      { gamertag: 'CARAOSEL', club: 'ORPIC' },
      { gamertag: 'KIERAN', club: 'MAXIMOUS' },
      { gamertag: 'RONALD', club: 'MAXIMOUS' },
      { gamertag: 'KIRA', club: 'SOUTHERN' },
      { gamertag: 'XIAOPEI', club: 'CROWN' },
      { gamertag: 'ZABYER', club: 'JASMINE' },
      { gamertag: 'VBBOY', club: 'AVENUE' },
      { gamertag: 'justice', club: 'EUPHORIC' },
      { gamertag: 'tazos', club: 'GYMSHARK' },
    ];

    const femaleData = [
      { gamertag: 'Indy', club: 'MAXIMOUS' },
      { gamertag: 'skylin', club: 'EUPHORIC' },
      { gamertag: 'cheeyaqq', club: 'SECRETS' },
      { gamertag: 'Vion', club: 'QUEEN' },
      { gamertag: 'Veronicc', club: 'PARANOID' },
      { gamertag: 'Liz', club: 'SOUTHERN' },
      { gamertag: 'Afrona', club: 'SOUTHERN' },
      { gamertag: 'Elvareca', club: 'EUPHORIC' },
      { gamertag: 'weywey', club: 'RNB' },
      { gamertag: 'cami', club: 'MAXIMOUS' },
      { gamertag: 'mishelle', club: 'PARANOID' },
      { gamertag: 'kacee', club: 'MAXIMOUS' },
      { gamertag: 'irazz', club: 'PARANOID' },
      { gamertag: 'ciki_w', club: 'TOGETHER' },
      { gamertag: 'reptil', club: 'SOUTHERN' },
      { gamertag: 'meatry', club: 'YAKUZA' },
      { gamertag: 'AiTan', club: 'PARANOID' },
      { gamertag: 'arcalya', club: 'SOUTHERN' },
      { gamertag: 's_melin', club: 'Plat R' },
      { gamertag: 'yoonabi', club: 'PARANOID' },
      { gamertag: 'Eive', club: 'PSALM' },
      { gamertag: 'damncil', club: 'EUPHORIC' },
      { gamertag: 'dysa', club: 'RESTART' },
      { gamertag: 'yaaay', club: 'YAKUZA' },
      { gamertag: 'moy', club: 'YAKUZA' },
      { gamertag: 'EVONY', club: 'GYMSHARK' },
    ];

    // Create male players (all stats zeroed)
    const malePlayers: Record<string, string> = {};
    for (const p of maleData) {
      const player = await db.player.create({
        data: {
          name: p.gamertag,
          gamertag: p.gamertag,
          division: 'male',
          tier: 'B',
          points: 0,
          totalWins: 0,
          totalMvp: 0,
          streak: 0,
          maxStreak: 0,
          matches: 0,
          isActive: true,
          city: '',
          registrationStatus: 'approved',
        },
      });
      malePlayers[p.gamertag] = player.id;
    }

    // Create female players (all stats zeroed)
    const femalePlayers: Record<string, string> = {};
    for (const p of femaleData) {
      const player = await db.player.create({
        data: {
          name: p.gamertag,
          gamertag: p.gamertag,
          division: 'female',
          tier: 'B',
          points: 0,
          totalWins: 0,
          totalMvp: 0,
          streak: 0,
          maxStreak: 0,
          matches: 0,
          isActive: true,
          city: '',
          registrationStatus: 'approved',
        },
      });
      femalePlayers[p.gamertag] = player.id;
    }

    // ======== CLUBS — All stats zeroed ========
    // Unique clubs per division
    const maleClubNames = [...new Set(maleData.map(p => p.club))];
    const femaleClubNames = [...new Set(femaleData.map(p => p.club))];

    const maleClubs: Record<string, string> = {};
    for (const clubName of maleClubNames) {
      const club = await db.club.create({
        data: {
          name: clubName,
          division: 'male',
          seasonId: maleSeason.id,
          wins: 0,
          losses: 0,
          points: 0,
          gameDiff: 0,
        },
      });
      maleClubs[clubName] = club.id;
    }

    const femaleClubs: Record<string, string> = {};
    for (const clubName of femaleClubNames) {
      const club = await db.club.create({
        data: {
          name: clubName,
          division: 'female',
          seasonId: femaleSeason.id,
          wins: 0,
          losses: 0,
          points: 0,
          gameDiff: 0,
        },
      });
      femaleClubs[clubName] = club.id;
    }

    // ======== CLUB MEMBERSHIPS ========
    // First male player in each club becomes captain
    const maleClubFirstPlayer: Record<string, boolean> = {};
    for (const p of maleData) {
      const isFirst = !maleClubFirstPlayer[p.club];
      maleClubFirstPlayer[p.club] = true;
      await db.clubMember.create({
        data: {
          clubId: maleClubs[p.club],
          playerId: malePlayers[p.gamertag],
          role: isFirst ? 'captain' : 'member',
        },
      });
    }

    const femaleClubFirstPlayer: Record<string, boolean> = {};
    for (const p of femaleData) {
      const isFirst = !femaleClubFirstPlayer[p.club];
      femaleClubFirstPlayer[p.club] = true;
      await db.clubMember.create({
        data: {
          clubId: femaleClubs[p.club],
          playerId: femalePlayers[p.gamertag],
          role: isFirst ? 'captain' : 'member',
        },
      });
    }

    // ======== TOURNAMENTS — 1 active per division ========
    await db.tournament.create({
      data: {
        name: 'Week 1 Tournament',
        weekNumber: 1,
        division: 'male',
        seasonId: maleSeason.id,
        status: 'registration',
        prizePool: 50000,
        location: 'Online - IDM Stage',
      },
    });

    await db.tournament.create({
      data: {
        name: 'Week 1 Tournament',
        weekNumber: 1,
        division: 'female',
        seasonId: femaleSeason.id,
        status: 'registration',
        prizePool: 50000,
        location: 'Online - IDM Stage',
      },
    });

    const malePlayerCount = maleData.length;
    const femalePlayerCount = femaleData.length;
    const maleClubCount = maleClubNames.length;
    const femaleClubCount = femaleClubNames.length;

    return NextResponse.json({
      success: true,
      message: 'Database seeded with IDM League data (all points zeroed)',
      stats: {
        malePlayers: malePlayerCount,
        femalePlayers: femalePlayerCount,
        maleClubs: maleClubCount,
        femaleClubs: femaleClubCount,
      },
    });
  } catch (e: unknown) {
    const error = e as Error;
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
