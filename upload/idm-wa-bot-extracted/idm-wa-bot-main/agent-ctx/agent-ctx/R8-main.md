# Task R8: Club Profile "Pemenang Liga Season X" Badge

## Summary
Re-applied the champion season badge fix to the IDM League project. This involved:

### Changes Made

1. **Created `/src/app/api/clubs/unified-profile/route.ts`** — New API endpoint that returns club profile data with `championSeasons` included. Accepts `clubId` query param and queries `db.season.findMany({ where: { championClubId: club.id } })`.

2. **Edited `/src/app/api/league/route.ts`** — Added champion seasons query and mapping for all clubs. Queries `db.season.findMany({ where: { championClubId: { in: clubIds } } })` and builds a `championSeasonsMap` to efficiently attach champion seasons to each club in the response.

3. **Edited `/src/app/api/stats/route.ts`** — Added champion seasons query in parallel with other queries, and maps champion seasons to each club in the response using `championSeasonRows.filter(cs => cs.championClubId === c.id)`.

4. **Edited `/src/types/stats.ts`** — Added `championSeasons?: { id: string; name: string; number: number }[]` to the `ClubData` interface.

5. **Edited `/src/components/idm/league-view.tsx`** — Added `championSeasons` to the `LeagueClub` interface.

6. **Edited `/src/components/idm/club-profile.tsx`** — Three changes:
   - Added `championSeasons` to the `club` prop type
   - Added "Pemenang Liga IDM" badge in the header area (below division/undefeated badges)
   - Added champion season badge list in the "Prestasi" (Achievements) section showing "Pemenang Liga Season X" for each season won

### Color Choice
Used `idm-amber` instead of `idm-gold-warm` (which doesn't exist in the theme) for the champion badges.

### Lint Result
`bun run lint` passed with zero errors.
