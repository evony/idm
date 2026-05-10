/**
 * IDM League - Unified Points System
 * 
 * This module contains all point calculation logic to ensure consistency
 * between frontend display and backend calculations.
 * 
 * === POINTS FORMULA ===
 * Base Points:
 * - Participation: 0 pts (no points for just participating)
 * - Win: +1 pts per win
 * - Loss: 0 pts
 * 
 * Streak Bonus (NOT applicable for single elimination):
 * - 4 win streak: +2 pts
 * - 5+ win streak: +5 pts (max)
 * 
 * Tier Multiplier: DISABLED (all 1.0x, no bonus)
 * 
 * MVP: Awarded only at tournament finalization (per week), NOT per match
 */

export interface PointsBreakdown {
  participation: number;      // 0 pts (no participation points)
  wins: number;               // 1 pt per win
  mvp: number;                // 0 pts here — MVP awarded at finalization only
  streakBonus: number;        // 2-5 pts based on streak (non-SE only)
  tierMultiplier: number;     // Always 1.0 (disabled)
  total: number;
}

export interface PlayerStats {
  matches: number;
  totalWins: number;
  totalMvp: number;
  streak: number;
  tier: string;
  format?: string; // Tournament format — streak bonus only for non-single-elimination
}

/**
 * Calculate streak bonus points
 * - 4 streak: +2 pts
 * - 5+ streak: +5 pts (max)
 * 
 * NOT applicable for single elimination format
 */
export function calculateStreakBonus(streak: number, format?: string): number {
  // Single elimination: no streak bonus
  if (format === 'single_elimination') return 0;
  
  if (streak < 4) return 0;
  if (streak >= 5) return 5;
  return 2; // 4 streak = +2 pts
}

/**
 * Get tier multiplier — DISABLED, always returns 1.0
 */
export function getTierMultiplier(_tier: string): number {
  return 1.0; // Tier multiplier disabled
}

/**
 * Calculate full points breakdown for a player
 */
export function calculatePointsBreakdown(stats: PlayerStats): PointsBreakdown {
  const participation = 0;                            // No participation points
  const wins = stats.totalWins * 1;                   // 1 pt per win
  const mvp = 0;                                      // MVP awarded at finalization only
  const streakBonus = calculateStreakBonus(stats.streak, stats.format);
  const tierMultiplier = 1.0;                          // Tier multiplier disabled
  
  const basePoints = participation + wins + mvp;
  const total = Math.floor(basePoints * tierMultiplier) + streakBonus;
  
  return {
    participation,
    wins,
    mvp,
    streakBonus,
    tierMultiplier,
    total,
  };
}

/**
 * Recalculate total points for a player from scratch
 * Use this to ensure consistency after data changes
 */
export function recalculateTotalPoints(stats: PlayerStats): number {
  return calculatePointsBreakdown(stats).total;
}

/**
 * Points earned for winning a match
 * Win: +1 pt (participation = 0)
 * No tier multiplier
 */
export function getWinPoints(_tier: string): number {
  return 1; // +1 pt for winning
}

/**
 * Points earned for losing a match
 * Loss: 0 pts (participation = 0)
 */
export function getLossPoints(_tier: string): number {
  return 0; // 0 pts for losing
}

/**
 * Points earned for MVP per match — DISABLED
 * MVP is now awarded only at tournament finalization (per week)
 */
export function getMvpPoints(): number {
  return 0; // No per-match MVP points
}

/**
 * Calculate new streak after a match result
 */
export function calculateNewStreak(currentStreak: number, won: boolean): number {
  if (won) {
    return currentStreak + 1;
  }
  return 0; // Loss resets streak
}

/**
 * Season phases
 */
export const SEASON_PHASES = {
  REGISTRATION: 'registration',   // Week 1-2: Team formation, player registration
  COMPETITION: 'competition',     // Week 3-10: Weekly tournaments, league matches
  PLAYOFFS: 'playoffs',          // Week 11-12: Final brackets, championship
} as const;

export type SeasonPhase = typeof SEASON_PHASES[keyof typeof SEASON_PHASES];

/**
 * Determine current season phase based on week
 */
export function getSeasonPhase(currentWeek: number, totalWeeks: number): SeasonPhase {
  if (currentWeek <= 2) return SEASON_PHASES.REGISTRATION;
  if (currentWeek <= totalWeeks - 2) return SEASON_PHASES.COMPETITION;
  return SEASON_PHASES.PLAYOFFS;
}
