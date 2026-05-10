import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// Helper to calculate Levenshtein distance for typo detection
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Check if names are too similar
function areNamesSimilar(name1: string, name2: string): boolean {
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();

  // Exact match (case-insensitive)
  if (n1 === n2) return true;

  // One is substring of another (e.g., "ipin" vs "ipinnn")
  if (n1.includes(n2) || n2.includes(n1)) {
    const lengthDiff = Math.abs(n1.length - n2.length);
    // Allow if difference is just 1-2 characters (typo territory)
    if (lengthDiff <= 2) return true;
  }

  // Levenshtein distance for typo detection
  const distance = levenshteinDistance(n1, n2);
  const maxLen = Math.max(n1.length, n2.length);
  const similarityRatio = 1 - distance / maxLen;

  // If 80% similar, consider it a potential duplicate
  if (similarityRatio >= 0.8 && maxLen >= 3) return true;

  return false;
}

// Normalize phone number for comparison
function normalizePhone(phone: string | null): string {
  if (!phone) return '';
  // Remove all non-digit characters
  return phone.replace(/\D/g, '');
}

// Normalize city for comparison
function normalizeCity(city: string): string {
  return city.toLowerCase().trim();
}

// Duplicate check result
interface DuplicateCheck {
  isBlocked: boolean;        // Cannot register (exact duplicate with WA/city)
  isHighRisk: boolean;       // Name + city or name + WA match
  similarPlayers: Array<{
    id: string;
    name: string;
    gamertag: string;
    division: string;
    city: string;
    phone: string | null;
    matchType: 'exact_name' | 'similar_name' | 'phone_match';
    matchDetails: {
      nameMatch: boolean;
      cityMatch: boolean;
      phoneMatch: boolean;
      nameDifferent: boolean; // For phone match with different name
    };
  }>;
  message: string;
}

// Comprehensive duplicate check
function checkDuplicates(
  name: string,
  city: string,
  phone: string | null,
  division: string,
  existingPlayers: Array<{ id: string; name: string; gamertag: string; division: string; city: string; phone: string | null }>
): DuplicateCheck {
  const normalizedName = name.toLowerCase().trim();
  const normalizedCity = normalizeCity(city);
  const normalizedPhone = normalizePhone(phone);

  const similarPlayers: DuplicateCheck['similarPlayers'] = [];

  // ====== PASS 1: Check name-based duplicates ======
  for (const player of existingPlayers) {
    const playerNameLower = player.name.toLowerCase().trim();
    const playerCityLower = normalizeCity(player.city);
    const playerPhoneNorm = normalizePhone(player.phone);

    // Check name similarity
    const nameMatch = playerNameLower === normalizedName; // Exact name match (case-insensitive)
    const nameSimilar = areNamesSimilar(name, player.name); // Similar name (typo)

    if (!nameMatch && !nameSimilar) continue; // Skip if name doesn't match at all

    // Check city match
    const cityMatch = playerCityLower === normalizedCity;

    // Check phone match (only if both have phone numbers with at least 8 digits)
    const phoneMatch = normalizedPhone && playerPhoneNorm && playerPhoneNorm.length >= 8 && normalizedPhone.length >= 8 && (
      normalizedPhone === playerPhoneNorm ||
      normalizedPhone.endsWith(playerPhoneNorm.slice(-8)) ||
      playerPhoneNorm.endsWith(normalizedPhone.slice(-8))
    );

    // Determine match type
    const matchType = nameMatch ? 'exact_name' : 'similar_name';

    similarPlayers.push({
      id: player.id,
      name: player.name,
      gamertag: player.gamertag,
      division: player.division,
      city: player.city,
      phone: player.phone,
      matchType,
      matchDetails: {
        nameMatch,
        cityMatch,
        phoneMatch,
        nameDifferent: false,
      },
    });
  }

  // ====== PASS 2: Check phone-based duplicates (same phone, different name) ======
  if (normalizedPhone) {
    for (const player of existingPlayers) {
      const playerPhoneNorm = normalizePhone(player.phone);
      const playerCityLower = normalizeCity(player.city);

      // Skip if player has no phone number
      if (!playerPhoneNorm) continue;

      // Check if phone matches (only if both have at least 8 digits)
      const phoneMatch = normalizedPhone === playerPhoneNorm ||
        (playerPhoneNorm.length >= 8 && normalizedPhone.length >= 8 && (
          normalizedPhone.endsWith(playerPhoneNorm.slice(-8)) ||
          playerPhoneNorm.endsWith(normalizedPhone.slice(-8))
        ));

      if (!phoneMatch) continue;

      // Check if already added in name-based check
      const alreadyAdded = similarPlayers.some(p => p.id === player.id);
      if (alreadyAdded) continue;

      // Check city match
      const cityMatch = playerCityLower === normalizedCity;

      // This is a phone match with different name
      similarPlayers.push({
        id: player.id,
        name: player.name,
        gamertag: player.gamertag,
        division: player.division,
        city: player.city,
        phone: player.phone,
        matchType: 'phone_match',
        matchDetails: {
          nameMatch: false,
          cityMatch,
          phoneMatch: true,
          nameDifferent: true,
        },
      });
    }
  }

  // ====== Determine risk level and message ======

  // BLOCK: Exact name match (case-insensitive)
  const exactNamePlayer = similarPlayers.find(p => p.matchDetails.nameMatch);

  if (exactNamePlayer) {
    return {
      isBlocked: true,
      isHighRisk: true,
      similarPlayers: [exactNamePlayer],
      message: `Pendaftaran diblokir! Nama "${name}" sudah terdaftar dengan gamertag "${exactNamePlayer.gamertag}". Jika ini adalah Anda, silakan hubungi admin.`,
    };
  }

  // BLOCK: Same phone number
  const phoneMatchPlayer = similarPlayers.find(p => p.matchDetails.phoneMatch);

  if (phoneMatchPlayer) {
    return {
      isBlocked: true,
      isHighRisk: true,
      similarPlayers: [phoneMatchPlayer],
      message: `Pendaftaran diblokir! Nomor WhatsApp ini sudah terdaftar dengan nama "${phoneMatchPlayer.name}" (gamertag: "${phoneMatchPlayer.gamertag}"). Jika ini adalah Anda, silakan hubungi admin.`,
    };
  }

  // WARNING: Similar name only (no exact name match, no phone match)
  if (similarPlayers.length > 0) {
    return {
      isBlocked: false,
      isHighRisk: false,
      similarPlayers,
      message: `Terdapat nama yang mirip: ${similarPlayers.map(p => p.name).join(', ')}. Yakin nama ini berbeda?`,
    };
  }

  return {
    isBlocked: false,
    isHighRisk: false,
    similarPlayers: [],
    message: '',
  };
}

// GET - Check for duplicate names (for real-time validation)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const city = searchParams.get('city');
  const phone = searchParams.get('phone');
  const division = searchParams.get('division');

  if (!name || !name.trim()) {
    return NextResponse.json({ exists: false, similar: [], isBlocked: false });
  }

  const allPlayers = await db.player.findMany({
    where: {
      ...(division && { division }),
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      gamertag: true,
      division: true,
      city: true,
      phone: true,
    },
  });

  const result = checkDuplicates(name, city || '', phone, division || '', allPlayers);

  return NextResponse.json({
    exists: result.similarPlayers.length > 0,
    similar: result.similarPlayers,
    isBlocked: result.isBlocked,
    isHighRisk: result.isHighRisk,
    message: result.message,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, joki, phone, city, clubId, division, force } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nama/Nick wajib diisi' }, { status: 400 });
    }
    if (!city || !city.trim()) {
      return NextResponse.json({ error: 'Kota wajib diisi' }, { status: 400 });
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'No. WhatsApp wajib diisi' }, { status: 400 });
    }
    if (!division || !['male', 'female'].includes(division)) {
      return NextResponse.json({ error: 'Division wajib dipilih (male/female)' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const trimmedCity = city.trim();
    const trimmedPhone = phone.trim();

    // Check for similar/existing names with city and phone
    const existingPlayers = await db.player.findMany({
      where: {
        division,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        gamertag: true,
        division: true,
        city: true,
        phone: true,
      },
    });

    const duplicateCheck = checkDuplicates(trimmedName, trimmedCity, trimmedPhone, division, existingPlayers);

    // If blocked, return error (cannot force)
    if (duplicateCheck.isBlocked) {
      return NextResponse.json({
        blocked: true,
        error: duplicateCheck.message,
        similarPlayers: duplicateCheck.similarPlayers,
      }, { status: 409 }); // 409 Conflict
    }

    // If similar names exist and force is not set, return warning
    if (duplicateCheck.similarPlayers.length > 0 && !force) {
      return NextResponse.json({
        warning: true,
        isHighRisk: duplicateCheck.isHighRisk,
        message: duplicateCheck.message,
        similarPlayers: duplicateCheck.similarPlayers,
      }, { status: 200 });
    }

    // Generate unique gamertag from name
    const baseTag = trimmedName.replace(/\s+/g, '');
    let gamertag = baseTag;
    let counter = 1;

    // Check for existing gamertag and make unique if needed
    while (true) {
      const existing = await db.player.findUnique({ where: { gamertag } });
      if (!existing) break;
      counter++;
      gamertag = `${baseTag}${counter}`;
    }

    // Validate club if provided
    if (clubId) {
      const club = await db.club.findUnique({ where: { id: clubId } });
      if (!club) {
        return NextResponse.json({ error: 'Club tidak ditemukan' }, { status: 400 });
      }
    }

    // Create player with pending registration status
    const player = await db.player.create({
      data: {
        name: trimmedName,
        gamertag,
        division,
        tier: 'B', // Default tier for new registrations
        city: trimmedCity,
        joki: joki?.trim() || null,
        phone: trimmedPhone,
        registrationStatus: 'pending',
        isActive: true,
      },
    });

    // If club is selected, add as club member
    if (clubId) {
      await db.clubMember.create({
        data: {
          clubId,
          playerId: player.id,
          role: 'member',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Pendaftaran berhasil! Menunggu persetujuan admin.',
      player: {
        id: player.id,
        name: player.name,
        gamertag: player.gamertag,
        division: player.division,
        city: player.city,
        registrationStatus: player.registrationStatus,
      },
    }, { status: 201 });
  } catch (e: unknown) {
    const error = e as Error;
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Gagal mendaftar. Silakan coba lagi.' }, { status: 500 });
  }
}
