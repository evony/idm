import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Division } from "@/lib/store"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert a Division (which may be "semua") to a strict "male" | "female".
 * When division is "semua", defaults to "male".
 * Used when passing division to functions/components that only accept a single division.
 */
export function toStrictDivision(division: Division | string): 'male' | 'female' {
  if (division === 'female') return 'female';
  return 'male'; // 'male' or 'semua' or any other value defaults to male
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
 * Get avatar URL - uses database avatar if available, otherwise generates an SVG placeholder
 * Generates inline SVG data URI to avoid broken image refs (no more /avatars/ dependency)
 */
export function getAvatarUrl(gamertag: string, division: 'male' | 'female', dbAvatar?: string | null): string {
  // Priority: 1) Database avatar field, 2) Generated SVG placeholder
  if (dbAvatar) {
    // Cloudinary URLs already include a version path (/v1234567/) which acts as a cache buster.
    // Do NOT append Date.now() — it causes React hydration mismatches (SSR vs client URL differs).
    return dbAvatar;
  }

  const hash = hashString(gamertag);
  const hue = division === 'male' ? 220 + (hash % 20) : 285 + (hash % 25); // vivid blue range / magenta-pink range
  // Two-letter initials: split by space first, else first two chars
  const words = gamertag.trim().split(/[\s_]+/);
  const initials = words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : gamertag.slice(0, 2).toUpperCase();
  // Full-bleed style: no circle, gradient background, large centered initials — looks like a photo placeholder
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:hsl(${hue},35%,18%)"/><stop offset="50%" style="stop-color:hsl(${hue},30%,14%)"/><stop offset="100%" style="stop-color:hsl(${hue},35%,10%)"/></linearGradient></defs><rect width="200" height="200" fill="url(#bg)"/><text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="56" font-weight="900" letter-spacing="4" fill="hsl(${hue},50%,55%)">${initials}</text><text x="50%" y="68%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="12" font-weight="600" letter-spacing="6" fill="hsl(${hue},40%,35%)">${gamertag.toUpperCase()}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Club logo — generates inline SVG data URI placeholder when no database logo exists.
 * All real clubs should have logos uploaded to Cloudinary via admin panel.
 * Legacy CLUB_LOGO_MAP removed — local /clubs/ images no longer exist.
 */
export function getClubLogoUrl(clubName: string, dbLogo?: string | null): string {
  // Priority: 1) Database logo field (Cloudinary URL), 2) Generated data URI placeholder
  if (dbLogo) {
    // Cloudinary URLs already include version-based cache busting (e.g., /v1234567/),
    // so no additional cb= parameter is needed. Adding Date.now() causes hydration
    // mismatches because it generates different values on server vs client.
    return dbLogo;
  }

  // Generate inline SVG data URI
  const initials = clubName
    .split(/[\s_]+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);
  const hash = hashString(clubName);
  const hue = hash % 360;
  const fontSize = initials.length <= 2 ? 72 : 56;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:hsl(${hue},45%,18%)"/><stop offset="100%" style="stop-color:hsl(${hue},45%,18%);stop-opacity:0.7"/></linearGradient></defs><rect width="200" height="200" rx="24" fill="url(#bg)"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="${fontSize}" font-weight="900" fill="hsl(${hue},65%,70%)" letter-spacing="2">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Check if a URL is a generated placeholder (data URI) that shouldn't go through image optimizer
 */
export function isClubLogoPlaceholder(url: string): boolean {
  return url.startsWith('data:');
}

/**
 * Optimize a Cloudinary URL by injecting transformation parameters.
 * Adds f_auto (format auto → WebP/AVIF), q_auto:eco (eco quality), and width constraints.
 * Optionally adds c_limit (resize only if larger than specified width) to save bandwidth.
 *
 * Before: https://res.cloudinary.com/.../image/upload/v123/cms/photo.jpg  (2-5MB)
 * After:  https://res.cloudinary.com/.../image/upload/f_auto,q_auto:eco,w_200,c_limit/v123/cms/photo.jpg  (5-30KB)
 *
 * @param url    Original Cloudinary URL
 * @param width  Target width in pixels (default: 200, capped at 1920)
 * @param crop   Cloudinary crop mode (default: 'limit' = only resize if larger)
 * @returns      Optimized Cloudinary URL, or original URL if not a Cloudinary URL
 */
export function getOptimizedCloudinaryUrl(
  url: string | null | undefined,
  width: number = 200,
  crop: 'limit' | 'fill' | 'scale' | 'fit' = 'limit'
): string {
  if (!url || !url.includes('res.cloudinary.com')) return url || '';
  // Guard: if URL already has Cloudinary transformation params, don't double-transform
  if (url.includes('/image/upload/f_') || url.includes('/image/upload/q_')) return url;
  const cappedWidth = Math.min(Math.max(width, 50), 1920);
  return url.replace(
    '/image/upload/',
    `/image/upload/f_auto,q_auto:eco,w_${cappedWidth},c_${crop}/`
  );
}

/**
 * Check if a URL is a Cloudinary URL (for conditional optimization)
 */
export function isCloudinaryUrl(url: string | null | undefined): boolean {
  return !!url && url.includes('res.cloudinary.com');
}

/**
 * Convert hex color + alpha to rgba() string.
 * Avoids 8-digit hex (#rrggbbaa) which is invalid in some browsers.
 *
 * @param hex  6-digit hex color, e.g. "#d4a853"
 * @param alpha  0–100 opacity percentage (20 = 12.5%, 40 = 25%, etc.)
 * @returns  rgba() string, e.g. "rgba(212,168,83,0.125)"
 */
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const a = Math.round((alpha / 255) * 1000) / 1000; // normalize 0-255 → 0-1
  return `rgba(${r},${g},${b},${a})`;
}

/**
 * Format number as IDR currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

/**
 * Format number as abbreviated IDR currency for compact displays (mobile).
 * Examples: 240000 → "Rp. 240K", 1200000 → "Rp. 1.2M", 50000 → "Rp. 50K"
 */
export function formatCurrencyShort(amount: number): string {
  if (amount >= 1_000_000_000) {
    const val = amount / 1_000_000_000;
    return `Rp. ${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000;
    return `Rp. ${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    const val = amount / 1_000;
    return `Rp. ${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}K`;
  }
  return `Rp. ${amount}`;
}

/**
 * Normalize club to a display string regardless of input format.
 * The /api/players/search endpoint returns club as {id, name, logo},
 * while /api/stats returns club as a string. This helper ensures
 * consistent string rendering across all components.
 */
export function clubToString(club: string | { id: string; name: string; logo?: string | null } | null | undefined): string {
  if (!club) return '';
  if (typeof club === 'string') return club;
  return club.name || '';
}

/**
 * Parse a datetime string as WITA (UTC+8) local time.
 *
 * PROBLEM: Prisma stores `scheduledAt` with a Z suffix (e.g. "2026-05-07T20:30:00.000Z"),
 * but the admin intended 20:30 WITA, not 20:30 UTC. When `new Date()` parses a Z-suffixed
 * string, it interprets it as UTC and converts to the browser's local timezone (WITA +8),
 * shifting the time by +8 hours (e.g. 20:30 → 04:30 next day).
 *
 * FIX: Strip the Z suffix before parsing, so JavaScript treats the string as local time.
 * This correctly displays the time the admin entered.
 */
export function parseWitaDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  // Remove trailing Z (and any milliseconds before it) so JS treats it as local/WITA time
  const normalized = String(raw).replace(/(\.\d{3})?Z$/, '');
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Transform season name for Tarkam display.
 * "IDM League Season 1 - Male" → "IDM TARKAM Season 1"
 * "Season 2 - Female" → "IDM TARKAM Season 2"
 * Falls back to "IDM TARKAM Season {number}" if name doesn't match pattern.
 */
export function formatTarkamSeasonName(rawName: string, seasonNumber?: number): string {
  if (!rawName) return seasonNumber ? `IDM TARKAM Season ${seasonNumber}` : 'IDM TARKAM';
  return rawName
    .replace(/IDM\s+League\s+Season\s+/i, 'IDM TARKAM Season ')
    .replace(/\s*[-–]\s*(Male|Female|male|female)\s*$/i, '')
    .replace(/^Season\s+/i, 'IDM TARKAM Season ')
    .trim();
}
