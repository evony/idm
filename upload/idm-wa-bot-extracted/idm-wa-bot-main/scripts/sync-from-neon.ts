/**
 * ═══════════════════════════════════════════════════════════════
 * sync-from-neon.ts — READ-ONLY sync from Neon PostgreSQL
 * 
 * ⚠️  SAFETY: This script ONLY READS from Neon PostgreSQL.
 *    It NEVER writes to the production database.
 *    All writes go to the local SQLite sandbox only.
 * ═══════════════════════════════════════════════════════════════
 * 
 * Usage: bun run scripts/sync-from-neon.ts
 */

import { Client } from 'pg';
import { PrismaClient } from '@prisma/client';

const NEON_URL = process.env.NEON_DATABASE_URL!;
if (!NEON_URL) {
  console.error('❌ NEON_DATABASE_URL not set in .env');
  process.exit(1);
}

const pg = new Client({
  connectionString: NEON_URL,
  ssl: { rejectUnauthorized: false },
});

const sqlite = new PrismaClient();

// ─── Order matters for foreign key constraints ───
const SYNC_ORDER = [
  // 1. Independent entities first (no FK dependencies)
  'Admin',
  'ClubProfile',
  'Skin',
  'Achievement',
  'Sponsor',
  'CmsSetting',
  'CmsSection',

  // 2. Season — FIRST PASS: insert without FK refs (championClubId, championPlayerId set null)
  //    These will be updated in a second pass after Player & ClubProfile exist
  'Season',

  // 3. Player (no FK deps)
  'Player',

  // 4. Tournament (depends on Season)
  'Tournament',

  // 5. TournamentPrize (depends on Tournament)
  'TournamentPrize',

  // 6. Team (depends on Tournament)
  'Team',

  // 7. TeamPlayer (depends on Team, Player)
  'TeamPlayer',

  // 8. Club (depends on ClubProfile, Season)
  'Club',

  // 9. ClubMember (depends on ClubProfile, Player)
  'ClubMember',

  // 10. Participation (depends on Player, Tournament)
  'Participation',

  // 11. Match (depends on Tournament, Team, Player)
  'Match',

  // 12. PlayerPoint (depends on Player, Tournament, Match, Season)
  'PlayerPoint',

  // 13. PlayerSeasonStats (depends on Player, Season)
  'PlayerSeasonStats',

  // 14. PlayerAchievement (depends on Player, Achievement, Tournament)
  'PlayerAchievement',

  // 15. Account (depends on Player)
  'Account',

  // 16. Donation (depends on Tournament, Season)
  'Donation',

  // 17. WaRegistration (depends on Tournament)
  'WaRegistration',

  // 18. AuditLog
  'AuditLog',

  // 19. CmsCard (depends on CmsSection)
  'CmsCard',

  // 20. SponsorBanner (depends on Sponsor)
  'SponsorBanner',

  // 21. TournamentSponsor (depends on Tournament, Sponsor)
  'TournamentSponsor',

  // 22. SponsoredPrize (depends on Tournament, Sponsor)
  'SponsoredPrize',

  // 23. MarketplaceItem (depends on Player)
  'MarketplaceItem',

  // 24. PlayerSkin (depends on Account, Skin)
  'PlayerSkin',

  // 25. LeagueMatch (depends on Season, Club)
  'LeagueMatch',

  // 26. PlayoffMatch (depends on Season, Club)
  'PlayoffMatch',

  // 27. WhatsAppBot
  'WhatsAppBot',

  // 28. WhatsAppCommand
  'WhatsAppCommand',

  // 29. WhatsAppLog
  'WhatsAppLog',
];

async function main() {
  console.log('🔗 Connecting to Neon PostgreSQL (READ-ONLY)...');
  await pg.connect();
  console.log('✅ Connected to Neon PostgreSQL');

  console.log('🔗 Connecting to local SQLite...');
  await sqlite.$connect();
  console.log('✅ Connected to local SQLite\n');

  // ─── First, wipe local SQLite clean ───
  console.log('🧹 Clearing local SQLite database...');
  const deleteOrder = [...SYNC_ORDER].reverse();
  for (const table of deleteOrder) {
    try {
      const modelName = table.charAt(0).toLowerCase() + table.slice(1);
      const model = (sqlite as any)[modelName];
      if (model && typeof model.deleteMany === 'function') {
        await model.deleteMany();
      }
    } catch (e) {
      // Table might not exist, skip
    }
  }
  console.log('✅ Local SQLite cleared\n');

  let totalInserted = 0;

  for (const table of SYNC_ORDER) {
    try {
      // Read from Neon
      const result = await pg.query(`SELECT * FROM "${table}"`);
      const rows = result.rows;

      if (rows.length === 0) {
        console.log(`⏭️  ${table}: 0 rows (skipped)`);
        continue;
      }

      // Get column names
      const cols = result.fields.map(f => f.name);

      // Map to Prisma model name (camelCase)
      const modelName = table.charAt(0).toLowerCase() + table.slice(1);
      const model = (sqlite as any)[modelName];

      if (!model || typeof model.createMany !== 'function') {
        console.log(`⚠️  ${table}: Prisma model not found, skipping ${rows.length} rows`);
        continue;
      }

      // Transform rows for SQLite compatibility
      const transformedRows = rows.map((row: any) => {
        const obj: any = {};
        for (const col of cols) {
          let val = row[col];

          // Convert PostgreSQL timestamps to ISO strings for SQLite
          if (val instanceof Date) {
            val = val.toISOString();
          }

          // Handle JSON fields (stored as text in SQLite)
          if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
            val = JSON.stringify(val);
          }

          obj[col] = val;
        }

        // ─── Special handling: Season first pass ───
        // Remove FK fields that reference not-yet-inserted tables
        // These will be set in the second pass update below
        if (table === 'Season') {
          // Store original values for second pass (keep in _meta)
          obj._championClubId = obj.championClubId;
          obj._championPlayerId = obj.championPlayerId;
          obj.championClubId = null;
          obj.championPlayerId = null;
        }

        return obj;
      });

      // Insert in batches of 50
      const BATCH_SIZE = 50;
      let inserted = 0;

      // Clean up _meta fields before inserting (Prisma won't know them)
      const cleanRows = transformedRows.map((row: any) => {
        const { _championClubId, _championPlayerId, ...rest } = row;
        return rest;
      });

      for (let i = 0; i < cleanRows.length; i += BATCH_SIZE) {
        const batch = cleanRows.slice(i, i + BATCH_SIZE);
        try {
          await model.createMany({ data: batch, skipDuplicates: true });
          inserted += batch.length;
        } catch (batchErr: any) {
          // If batch fails, try one by one
          for (const row of batch) {
            try {
              await model.create({ data: row });
              inserted++;
            } catch (singleErr: any) {
              console.error(`  ❌ ${table} row failed: ${singleErr.message?.substring(0, 120)}`);
            }
          }
        }
      }

      totalInserted += inserted;
      console.log(`✅ ${table}: ${inserted}/${rows.length} rows synced`);
    } catch (err: any) {
      console.error(`❌ ${table}: ${err.message?.substring(0, 150)}`);
    }
  }

  console.log(`\n🎉 Sync complete! Total rows inserted: ${totalInserted}`);

  // ─── Second pass: Update Season champion FKs ───
  console.log('\n🔄 Second pass: Updating Season champion FKs...');
  const seasonResult = await pg.query('SELECT id, "championClubId", "championPlayerId" FROM "Season" WHERE "championClubId" IS NOT NULL OR "championPlayerId" IS NOT NULL');
  let updatedSeasons = 0;
  for (const row of seasonResult.rows) {
    try {
      await sqlite.season.update({
        where: { id: row.id },
        data: {
          championClubId: row.championClubId,
          championPlayerId: row.championPlayerId,
        },
      });
      updatedSeasons++;
    } catch (e: any) {
      console.error(`  ❌ Season ${row.id} update failed: ${e.message?.substring(0, 100)}`);
    }
  }
  console.log(`✅ Updated ${updatedSeasons} seasons with champion FKs`);

  // ─── Verify counts ───
  console.log('\n📊 Verification:');
  for (const table of ['Player', 'Club', 'ClubProfile', 'Season', 'Tournament', 'Admin', 'Match', 'Team', 'CmsSetting', 'Achievement', 'Skin', 'Sponsor']) {
    const modelName = table.charAt(0).toLowerCase() + table.slice(1);
    const model = (sqlite as any)[modelName];
    if (model && typeof model.count === 'function') {
      const count = await model.count();
      console.log(`  ${table}: ${count}`);
    }
  }

  await pg.end();
  await sqlite.$disconnect();
  console.log('\n👋 Done. Neon PG connection closed (untouched). SQLite synced.');
}

main().catch((err) => {
  console.error('💥 FATAL:', err);
  process.exit(1);
});
