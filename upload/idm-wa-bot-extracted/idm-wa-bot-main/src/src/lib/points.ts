// ============================================
// IDM LEAGUE - POINTS & RANKING SYSTEM
// ============================================

import { db } from '@/lib/db';

// ===== TIER UPGRADE THRESHOLDS =====
// Based on accumulated points, players can be promoted:
// B → A: 15 points
// A → S: 35 points
// S is the highest tier, no further upgrade

export const TIER_THRESHOLDS = {
  B_TO_A: 15,
  A_TO_S: 35,
} as const;

export const TIER_ORDER = { S: 3, A: 2, B: 1 } as const;

export type Tier = 'S' | 'A' | 'B';

/**
 * Calculate the target tier for a player based on their total points.
 * Only upgrades, never downgrades (manual override stays).
 */
export function calculateTargetTier(currentPoints: number): Tier {
  if (currentPoints >= TIER_THRESHOLDS.A_TO_S) return 'S';
  if (currentPoints >= TIER_THRESHOLDS.B_TO_A) return 'A';
  return 'B';
}

/**
 * Check if a player should be upgraded and return upgrade info.
 */
export function getTierUpgradeInfo(currentTier: Tier, currentPoints: number): {
  shouldUpgrade: boolean;
  currentTier: Tier;
  targetTier: Tier;
  pointsToNext: number;
  nextThreshold: number | null;
} {
  const targetTier = calculateTargetTier(currentPoints);
  const shouldUpgrade = TIER_ORDER[targetTier] > TIER_ORDER[currentTier];

  let nextThreshold: number | null = null;
  let pointsToNext = 0;

  if (currentTier === 'B') {
    nextThreshold = TIER_THRESHOLDS.B_TO_A;
    pointsToNext = Math.max(0, TIER_THRESHOLDS.B_TO_A - currentPoints);
  } else if (currentTier === 'A') {
    nextThreshold = TIER_THRESHOLDS.A_TO_S;
    pointsToNext = Math.max(0, TIER_THRESHOLDS.A_TO_S - currentPoints);
  }

  return { shouldUpgrade, currentTier, targetTier, pointsToNext, nextThreshold };
}

/**
 * Award points to a player with full audit trail via PlayerPoint record.
 * Also updates the player's total points.
 */
export async function awardPoints(params: {
  playerId: string;
  amount: number;
  reason: string;
  description: string;
  tournamentId?: string;
  matchId?: string;
}) {
  const { playerId, amount, reason, description, tournamentId, matchId } = params;

  // Create audit record
  await db.playerPoint.create({
    data: {
      playerId,
      amount,
      reason,
      description,
      tournamentId: tournamentId || null,
      matchId: matchId || null,
    },
  });

  // Update player total points
  const player = await db.player.findUnique({ where: { id: playerId } });
  if (player) {
    await db.player.update({
      where: { id: playerId },
      data: { points: player.points + amount },
    });
  }
}

/**
 * Process tier upgrade for a player based on their current points.
 * Only upgrades if threshold is met. Creates a PlayerPoint audit record for bonus points on upgrade.
 * Returns upgrade info or null if no upgrade.
 */
export async function processTierUpgrade(playerId: string): Promise<{
  upgraded: boolean;
  fromTier: Tier;
  toTier: Tier;
} | null> {
  const player = await db.player.findUnique({ where: { id: playerId } });
  if (!player) return null;

  const currentTier = player.tier as Tier;
  const info = getTierUpgradeInfo(currentTier, player.points);

  if (!info.shouldUpgrade) return null;

  // Perform upgrade
  await db.player.update({
    where: { id: playerId },
    data: { tier: info.targetTier },
  });

  return { upgraded: true, fromTier: currentTier, toTier: info.targetTier };
}

/**
 * Process tier upgrades for all players in a division.
 * Returns list of players who were upgraded.
 */
export async function processAllTierUpgrades(division?: string): Promise<{
  playerId: string;
  gamertag: string;
  fromTier: Tier;
  toTier: Tier;
}[]> {
  const where: Record<string, string> = {};
  if (division) where.division = division;

  const players = await db.player.findMany({ where });

  const upgraded: { playerId: string; gamertag: string; fromTier: Tier; toTier: Tier }[] = [];

  for (const player of players) {
    const result = await processTierUpgrade(player.id);
    if (result?.upgraded) {
      upgraded.push({
        playerId: player.id,
        gamertag: player.gamertag,
        fromTier: result.fromTier,
        toTier: result.toTier,
      });
    }
  }

  return upgraded;
}

/**
 * Recalculate all player points from scratch using PlayerPoint audit trail.
 * This is a safety net for data integrity.
 */
export async function recalculateAllPoints(division?: string) {
  const where: Record<string, string> = {};
  if (division) where.division = division;

  const players = await db.player.findMany({ where });

  const results: {
    playerId: string;
    gamertag: string;
    oldPoints: number;
    newPoints: number;
    diff: number;
  }[] = [];

  for (const player of players) {
    const pointRecords = await db.playerPoint.findMany({
      where: { playerId: player.id },
    });

    const calculatedPoints = pointRecords.reduce((sum, r) => sum + r.amount, 0);
    const diff = calculatedPoints - player.points;

    if (diff !== 0) {
      await db.player.update({
        where: { id: player.id },
        data: { points: calculatedPoints },
      });
    }

    results.push({
      playerId: player.id,
      gamertag: player.gamertag,
      oldPoints: player.points,
      newPoints: calculatedPoints,
      diff,
    });
  }

  return results;
}
