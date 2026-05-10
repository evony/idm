// ─── DB Resilience Helpers ───
// Utilities for gracefully handling database errors in API routes.
// Adapted for SQLite-only — handles SQLite transient errors (busy, locked).

import { NextResponse } from 'next/server';
import { isSQLite } from './db';

/**
 * Check if an error is a database configuration error
 * (e.g., invalid DATABASE_URL, Prisma can't connect)
 */
export function isDbConfigError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message || '';
    return (
      msg.includes('Database not configured') ||
      msg.includes('DATABASE_URL') ||
      msg.includes('valid SQLite URL') ||
      msg.includes('SQLite') && msg.includes('open') ||
      error.constructor?.name === 'PrismaClientInitializationError'
    );
  }
  return false;
}

/**
 * Return a 503 Service Unavailable response for DB config errors,
 * or re-throw non-DB errors so they can be handled by the caller.
 */
export function handleDbError(error: unknown): NextResponse | never {
  if (isDbConfigError(error)) {
    return NextResponse.json(
      {
        error: 'Database sedang tidak tersedia',
        hint: 'DATABASE_URL belum dikonfigurasi. Hubungi admin.',
      },
      { status: 503 }
    );
  }
  throw error; // Re-throw non-DB errors
}

/**
 * Check if an error is retryable based on the current database provider.
 * SQLite: busy/locked database, file access issues
 */
function isRetryableError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);

  // Common retryable errors
  const commonRetryable =
    msg.includes('P1001') || // Prisma: Can't reach database server
    msg.includes('P1002') || // Prisma: Database server rejected
    msg.includes('P1008') || // Prisma: Operations timed out
    msg.includes('P5012');   // Prisma: Connection pool timeout

  if (commonRetryable) return true;

  // SQLite-specific retryable errors
  return (
    msg.includes('busy') ||
    msg.includes('locked') ||
    msg.includes('SQLITE_BUSY') ||
    msg.includes('SQLITE_LOCKED') ||
    msg.includes('cannot open database') ||
    msg.includes('unable to open database') ||
    msg.includes('SQLITE_CANTOPEN') ||
    msg.includes('disk I/O error') ||
    msg.includes('SQLITE_IOERR')
  );
}

/**
 * Retry wrapper for database operations.
 * Handles SQLite busy/locked database and file access issues.
 * Also handles DB config errors gracefully (returns 503 instead of crashing).
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 500
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // If it's a DB config error, don't retry — it won't fix itself
      if (isDbConfigError(error)) {
        throw error;
      }

      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff: 500ms, 1000ms, 2000ms...
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`[db-resilience] Retry ${attempt + 1}/${maxRetries} after ${delay}ms: ${error instanceof Error ? error.message : String(error)}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * @deprecated Use withDbRetry instead. Kept for backward compatibility.
 */
export const withNeonRetry = withDbRetry;
