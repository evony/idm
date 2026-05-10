/**
 * IDM WA Bot — Prisma Database Client
 * Shares the same Neon PostgreSQL database with the main Next.js app
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: ['warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Keep-alive ping for Neon PostgreSQL (every 4 min, prevents 5-min cold start)
setInterval(async () => {
  try {
    await db.$queryRaw`SELECT 1`
  } catch {}
}, 4 * 60 * 1000)
