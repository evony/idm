// ═══════════════════════════════════════════════════════════
// IDM LEAGUE — Sync Neon PostgreSQL → Local SQLite Sandbox
// Optimized: fetch all data, then bulk write to SQLite
// ═══════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client'
import pg from 'pg'

const NEON_URL = process.env.NEON_DATABASE_URL
if (!NEON_URL) {
  console.error('❌ NEON_DATABASE_URL not set in .env')
  process.exit(1)
}

const pool = new pg.Pool({
  connectionString: NEON_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
  connectionTimeoutMillis: 30000,
  query_timeout: 30000,
})

const db = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
})

async function fetchAll(table: string): Promise<any[]> {
  try {
    const result = await pool.query(`SELECT * FROM "${table}"`)
    return result.rows
  } catch (e: any) {
    if (e.code === '42P01') {
      console.log(`  ⏭️ ${table}: table does not exist, skipping`)
      return []
    }
    throw e
  }
}

// Sanitize: convert Neon/PostgreSQL types to Prisma-compatible values
// IMPORTANT: Keep booleans as true/false (NOT 0/1) — Prisma expects JS booleans
// Dates from pg come as strings (not Date objects), which Prisma accepts
function sanitize(row: any): any {
  const out: any = {}
  for (const [key, value] of Object.entries(row)) {
    if (value === null || value === undefined) {
      out[key] = null
    } else if (typeof value === 'boolean') {
      out[key] = value // Keep as boolean! Prisma handles SQLite conversion
    } else if (value instanceof Date) {
      out[key] = value.toISOString()
    } else if (typeof value === 'bigint') {
      out[key] = Number(value)
    } else if (Buffer.isBuffer(value)) {
      out[key] = value.toString('hex')
    } else {
      out[key] = value // strings, numbers pass through
    }
  }
  return out
}

async function main() {
  console.log('══════════════════════════════════════════════════════')
  console.log('  IDM LEAGUE — Neon → SQLite Sandbox Sync')
  console.log('  READ-ONLY from Neon — Production DB is SAFE')
  console.log('══════════════════════════════════════════════════════\n')

  // Test Neon connection
  console.log('🔌 Connecting to Neon PostgreSQL...')
  try {
    await pool.query('SELECT 1')
    console.log('  ✅ Neon connected!\n')
  } catch (e: any) {
    console.error('  ❌ Neon failed:', e.message)
    process.exit(1)
  }

  // Fetch all data from Neon
  console.log('📥 Fetching data from Neon...\n')
  const data: Record<string, any[]> = {}

  const tables = [
    'Admin', 'Player', 'Account', 'Skin', 'PlayerSkin',
    'ClubProfile', 'Season', 'Club', 'ClubMember',
    'Tournament', 'Team', 'TeamPlayer', 'Match', 'Participation',
    'Donation', 'TournamentPrize', 'Sponsor', 'TournamentSponsor',
    'SponsoredPrize', 'SponsorBanner', 'LeagueMatch', 'PlayoffMatch',
    'PlayerPoint', 'Achievement', 'PlayerAchievement', 'PlayerSeasonStats',
    'MarketplaceItem', 'CmsSection', 'CmsCard', 'CmsSetting',
    'AuditLog', 'WaRegistration', 'WhatsAppBot', 'WhatsAppCommand', 'WhatsAppLog',
  ]

  for (const table of tables) {
    const rows = await fetchAll(table)
    data[table] = rows
    if (rows.length > 0) console.log(`  📋 ${table}: ${rows.length} rows`)
  }
  console.log('\n✅ All data fetched from Neon!\n')

  // Close Neon connection early — we're done reading
  await pool.end()

  // Clear local SQLite data
  console.log('🗑️  Clearing local SQLite data...')
  try {
    await db.$transaction([
      db.whatsAppLog.deleteMany(),
      db.whatsAppCommand.deleteMany(),
      db.whatsAppBot.deleteMany(),
      db.waRegistration.deleteMany(),
      db.auditLog.deleteMany(),
      db.cmsCard.deleteMany(),
      db.cmsSection.deleteMany(),
      db.cmsSetting.deleteMany(),
      db.marketplaceItem.deleteMany(),
      db.sponsorBanner.deleteMany(),
      db.sponsoredPrize.deleteMany(),
      db.tournamentSponsor.deleteMany(),
      db.sponsor.deleteMany(),
      db.playerAchievement.deleteMany(),
      db.achievement.deleteMany(),
      db.playerPoint.deleteMany(),
      db.playerSeasonStats.deleteMany(),
      db.clubMember.deleteMany(),
      db.leagueMatch.deleteMany(),
      db.playoffMatch.deleteMany(),
      db.club.deleteMany(),
      db.participation.deleteMany(),
      db.teamPlayer.deleteMany(),
      db.match.deleteMany(),
      db.team.deleteMany(),
      db.tournamentPrize.deleteMany(),
      db.tournament.deleteMany(),
      db.donation.deleteMany(),
      db.playerSkin.deleteMany(),
      db.skin.deleteMany(),
      db.account.deleteMany(),
      db.season.deleteMany(),
      db.clubProfile.deleteMany(),
      db.player.deleteMany(),
      db.admin.deleteMany(),
    ])
    console.log('  ✅ Local data cleared\n')
  } catch (e: any) {
    console.warn('  ⚠️ Clear issue:', e.message, '\n')
  }

  // Write to SQLite (dependency order)
  console.log('📤 Writing to local SQLite...\n')
  const results: Record<string, number> = {}

  const writeOrder: [string, (d: any) => Promise<any>][] = [
    ['Admin', (d) => db.admin.upsert({ where: { id: d.id }, update: d, create: d })],
    ['Player', (d) => db.player.upsert({ where: { id: d.id }, update: d, create: d })],
    ['Account', (d) => db.account.upsert({ where: { id: d.id }, update: d, create: d })],
    ['Skin', (d) => db.skin.upsert({ where: { id: d.id }, update: d, create: d })],
    ['PlayerSkin', (d) => db.playerSkin.upsert({ where: { id: d.id }, update: d, create: d })],
    ['ClubProfile', (d) => db.clubProfile.upsert({ where: { id: d.id }, update: d, create: d })],
    ['Season', (d) => db.season.upsert({ where: { id: d.id }, update: d, create: d })],
    ['Club', (d) => db.club.upsert({ where: { id: d.id }, update: d, create: d })],
    ['ClubMember', (d) => db.clubMember.upsert({ where: { id: d.id }, update: d, create: d })],
    ['Tournament', (d) => db.tournament.upsert({ where: { id: d.id }, update: d, create: d })],
    ['Team', (d) => db.team.upsert({ where: { id: d.id }, update: d, create: d })],
    ['TeamPlayer', (d) => db.teamPlayer.upsert({ where: { id: d.id }, update: d, create: d })],
    ['Match', (d) => db.match.upsert({ where: { id: d.id }, update: d, create: d })],
    ['Participation', (d) => db.participation.upsert({ where: { id: d.id }, update: d, create: d })],
    ['Donation', (d) => db.donation.upsert({ where: { id: d.id }, update: d, create: d })],
    ['TournamentPrize', (d) => db.tournamentPrize.upsert({ where: { id: d.id }, update: d, create: d })],
    ['Sponsor', (d) => db.sponsor.upsert({ where: { id: d.id }, update: d, create: d })],
    ['TournamentSponsor', (d) => db.tournamentSponsor.upsert({ where: { id: d.id }, update: d, create: d })],
    ['SponsoredPrize', (d) => db.sponsoredPrize.upsert({ where: { id: d.id }, update: d, create: d })],
    ['SponsorBanner', (d) => db.sponsorBanner.upsert({ where: { id: d.id }, update: d, create: d })],
    ['LeagueMatch', (d) => db.leagueMatch.upsert({ where: { id: d.id }, update: d, create: d })],
    ['PlayoffMatch', (d) => db.playoffMatch.upsert({ where: { id: d.id }, update: d, create: d })],
    ['PlayerPoint', (d) => db.playerPoint.upsert({ where: { id: d.id }, update: d, create: d })],
    ['Achievement', (d) => db.achievement.upsert({ where: { id: d.id }, update: d, create: d })],
    ['PlayerAchievement', (d) => db.playerAchievement.upsert({ where: { id: d.id }, update: d, create: d })],
    ['PlayerSeasonStats', (d) => db.playerSeasonStats.upsert({ where: { id: d.id }, update: d, create: d })],
    ['MarketplaceItem', (d) => db.marketplaceItem.upsert({ where: { id: d.id }, update: d, create: d })],
    ['CmsSection', (d) => db.cmsSection.upsert({ where: { id: d.id }, update: d, create: d })],
    ['CmsCard', (d) => db.cmsCard.upsert({ where: { id: d.id }, update: d, create: d })],
    ['CmsSetting', (d) => db.cmsSetting.upsert({ where: { id: d.id }, update: d, create: d })],
    ['AuditLog', (d) => db.auditLog.upsert({ where: { id: d.id }, update: d, create: d })],
    ['WaRegistration', (d) => db.waRegistration.upsert({ where: { id: d.id }, update: d, create: d })],
    ['WhatsAppBot', (d) => db.whatsAppBot.upsert({ where: { id: d.id }, update: d, create: d })],
    ['WhatsAppCommand', (d) => db.whatsAppCommand.upsert({ where: { id: d.id }, update: d, create: d })],
    ['WhatsAppLog', (d) => db.whatsAppLog.upsert({ where: { id: d.id }, update: d, create: d })],
  ]

  for (const [table, upsertFn] of writeOrder) {
    const rows = data[table]
    if (!rows || rows.length === 0) continue

    let synced = 0
    let errors = 0
    let firstError = ''
    for (const row of rows) {
      const d = sanitize(row)
      try {
        await upsertFn(d)
        synced++
      } catch (e: any) {
        errors++
        if (!firstError) firstError = e.message.substring(0, 120)
      }
    }
    results[table] = synced
    const icon = errors > 0 ? '⚠️' : '✅'
    console.log(`  ${icon} ${table}: ${synced}/${rows.length}${errors > 0 ? ` (${errors} errors — ${firstError})` : ''}`)
  }

  console.log('\n══════════════════════════════════════════════════════')
  console.log('  SYNC COMPLETE')
  console.log('══════════════════════════════════════════════════════')
  let total = 0
  for (const [, count] of Object.entries(results)) {
    total += count
  }
  console.log(`  📊 Total rows synced: ${total}`)
  console.log('  🔒 Neon production DB: NOT modified (read-only)')
  console.log('══════════════════════════════════════════════════════')

  await db.$disconnect()
}

main().catch((e) => {
  console.error('❌ Sync failed:', e)
  process.exit(1)
})
