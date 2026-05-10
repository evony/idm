import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Deterministic hash from string for procedural generation
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Get avatar URL - uses database avatar if available, otherwise generates a fallback
 * Returns a path like /avatars/avatar-male-1.png as fallback
 */
export function getAvatarUrl(gamertag: string, division: 'male' | 'female', dbAvatar?: string | null): string {
  // Priority: 1) Database avatar field, 2) Fallback
  if (dbAvatar) return dbAvatar;
  const index = (hashString(gamertag) % 3) + 1;
  return `/avatars/avatar-${division}-${index}.png`;
}

/**
 * Club logo mapping — returns path to AI-generated club logo image
 * Falls back to a generic club logo if name not found
 */
const CLUB_LOGO_MAP: Record<string, string> = {
  'Neon Blaze': '/clubs/neon-blaze.png',
  'Phantom Step': '/clubs/phantom-step.png',
  'Rhythm Force': '/clubs/rhythm-force.png',
  'Crystal Wave': '/clubs/crystal-wave.png',
  'Shadow Dance': '/clubs/shadow-dance.png',
  'Thunder Beat': '/clubs/thunder-beat.png',
  'Velvet Groove': '/clubs/velvet-groove.png',
  'Star Rise': '/clubs/star-rise.png',
  'Lunar Flow': '/clubs/lunar-flow.png',
  // Winner teams from demo data
  'Team Rhythm': '/clubs/rhythm-force.png',
  'Team Flow': '/clubs/lunar-flow.png',
  'Team Grace': '/clubs/crystal-wave.png',
  'Team Velvet': '/clubs/velvet-groove.png',
};

export function getClubLogoUrl(clubName: string, dbLogo?: string | null): string {
  // Priority: 1) Database logo field, 2) Mapping, 3) Fallback
  if (dbLogo) return dbLogo;
  return CLUB_LOGO_MAP[clubName] || '/clubs/neon-blaze.png';
}

/**
 * Format number as IDR currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}
