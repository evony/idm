# Task 2 - Bug Fix Agent

## Task: Fix bugs in my-status API

### Bugs Fixed

1. **Support completed tournaments**: Added `'completed'` to the tournament status filter. When a tournament is completed, the response now includes `isCompleted: true` and `completedAt` timestamp in the tournament data.

2. **Search by both name AND gamertag**: When only `name` param is provided (no `gamertag`), the API now uses Prisma OR condition to search by both `player.name` and `player.gamertag` fields. The `isActive` and `division` filters are embedded within each OR branch to maintain correct filtering behavior.

3. **Include participation data for completed tournaments**: When the tournament is completed and the player had a team, the response now includes:
   - `participation` object with `{ pointsEarned, isWinner, isMvp, status }`
   - `teamRank` at top level (= myTeam.rank)
   - `prizeInfo` object with `{ pointsEarned, isWinner, isMvp, teamRank }`

### Files Modified
- `/src/app/api/tournaments/my-status/route.ts` — All three bug fixes applied

### Verification
- Lint: clean (zero errors)
- Dev server: running without errors
- API: Returns 200 with correct data, `isCompleted` field present in tournament response
