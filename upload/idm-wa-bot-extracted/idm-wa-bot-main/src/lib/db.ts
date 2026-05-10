// ─── Database Client ───
// Supports both PostgreSQL (Neon / Vercel) and SQLite (local dev).
// The provider is determined by DATABASE_URL at runtime.
// Neon PostgreSQL is used in production; SQLite is for local sandbox.

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const isPostgresUrl = (process.env.DATABASE_URL || '').startsWith('postgres')

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

export const db =
  globalForPrisma.prisma ??
  createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

/** Export provider info so other modules (e.g., db-resilience) can adapt behavior */
export const isSQLite = !isPostgresUrl
export const isPostgreSQL = isPostgresUrl
