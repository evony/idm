# Task 4: Swiss Scoring/Advancement Logic

## Agent: Swiss Scoring Agent
## Task ID: 4

## Work Log

### Changes Made to `/home/z/my-project/src/app/api/tournaments/[id]/score/route.ts`

#### 1. Allow draws in Swiss format (Line 156-167)
- Added `isSwissMatch` variable: `const isSwissMatch = match.bracket === 'swiss';`
- Modified draw restriction: Changed from `if (isDraw && !isGroupMatch)` to `if (isDraw && !isGroupMatch && !isSwissMatch)` — Swiss format now allows draws alongside group stage

#### 2. Swiss draw handling with 1pt per player (Line 173-222)
- Expanded the draw handling block to cover both `isGroupMatch` and `isSwissMatch`
- Swiss draws award 1pt per player (vs 0pts for group stage draws)
- Swiss draws create `PlayerPoint` records with `reason: 'match_draw'` and `amount: 1`
- Swiss draws update `Participation.pointsEarned` and `Player.points` accordingly

#### 3. Swiss win point system: 3pts/win (Line 240-252)
- Changed `winPts` from hardcoded `1` to conditional: `tournamentFormat === 'swiss' ? 3 : 1`
- Swiss format gives 3 points per win (vs 1pt for other formats)
- Excluded Swiss from streak bonuses: `isStreakEligible` now also checks `tournamentFormat !== 'swiss'`

#### 4. Swiss advancement call in POST handler (Line 501-509)
- Added call to `handleSwissAdvancement(id, match2.round)` when `bracket === 'swiss' && format === 'swiss'`
- Added call to `advanceSwissPlayoff(id, match2, winnerId, loserId)` when `format === 'swiss' && bracket !== 'swiss'`

#### 5. New function: `handleSwissAdvancement(tournamentId, completedRound)` (Line 768-793)
- Checks if all Swiss matches in the current round are completed
- Calculates `totalSwissRounds = Math.ceil(Math.log2(teamCount)) + 1`
- If `completedRound >= totalSwissRounds` → calls `seedSwissPlayoff()`
- Otherwise → calls `generateNextSwissRound()`

#### 6. New interface: `SwissStanding` (Line 795-803)
- Type with: `teamId`, `wins`, `draws`, `losses`, `points`, `buchholz`

#### 7. New function: `computeSwissStandings(tournamentId)` (Line 805-894)
- Fetches all completed Swiss matches and all tournament teams
- Computes wins/draws/losses/points (3*W + 1*D) for each team
- Handles BYE matches (team2Id = null) as auto-wins with 3 points
- Tracks opponents for buchholz calculation (sum of all opponents' points across ALL Swiss rounds)
- Sorts by: points DESC → buchholz DESC → wins DESC

#### 8. New function: `getPreviousMatchups(tournamentId)` (Line 896-912)
- Returns `Map<string, Set<string>>` of all previous Swiss matchups for no-rematch constraint

#### 9. New function: `getTeamsWithBye(tournamentId)` (Line 914-924)
- Returns `Set<string>` of team IDs that have already received a BYE in previous Swiss rounds
- Used to prevent giving the same team multiple BYEs

#### 10. New function: `generateNextSwissRound(tournamentId, completedRound)` (Line 926-1154)
- Prevents double-generation by checking if next round already exists
- **Swiss pairing algorithm**:
  1. Groups teams by points (descending)
  2. Pairs adjacent teams within each points group
  3. Enforces NO REMATCH: skips opponents already played
  4. Cross-group pairing for unpaired teams (due to no-rematch constraints)
  5. Last resort: allows rematch if no other option exists
  6. Odd teams: BYE assigned to lowest-ranked team without previous BYE
- Creates `Match` records with `bracket: 'swiss'`, `groupLabel: 'SR{round}-{matchNum}'`, `status: 'ready'`
- BYE matches: `team2Id: null`, `score1: 1`, `score2: 0`, `status: 'completed'`, `winnerId: byeTeam`
- BYE points: Awards 3pts per player for BYE auto-wins (with PlayerPoint + Participation + Player updates)
- Recursively calls `handleSwissAdvancement()` after BYE match creation (in case round becomes instantly complete)

#### 11. New function: `seedSwissPlayoff(tournamentId)` (Line 1156-1194)
- Checks if playoff already seeded (SF1.team1Id exists)
- Computes Swiss standings
- Requires at least 4 teams
- Cross-seeding: 1st vs 4th → SF1, 2nd vs 3rd → SF2
- Updates pre-created playoff matches with actual team IDs and `status: 'ready'`

#### 12. New function: `advanceSwissPlayoff(tournamentId, match, winnerId, loserId)` (Line 1196-1244)
- Handles SF1 → Final (team1) + 3rd (team1)
- Handles SF2 → Final (team2) + 3rd (team2)
- Updates match status to 'ready' when both teams are set
- Final and 3rd place matches need no further advancement

## Stage Summary
- Swiss format fully integrated into the score submission API
- Points: 3 per win, 1 per draw, 0 per loss (matching Swiss tournament standards)
- Draw support enabled for Swiss matches
- Streak bonuses excluded from Swiss format
- Automatic round generation when current Swiss round completes
- Swiss pairing algorithm with points-based grouping and no-rematch constraint
- BYE handling with anti-duplicate-BYE protection
- Buchholz tiebreaker (sum of opponents' points across all rounds)
- Playoff seeding: Top 4 teams cross-seeded into SF1 (1v4) and SF2 (2v3)
- All existing code preserved — only additive changes made
- Lint passes clean, dev server running without errors
