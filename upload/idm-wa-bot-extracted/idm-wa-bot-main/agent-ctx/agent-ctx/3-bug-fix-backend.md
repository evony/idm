# Task 3: Fix Backend Bugs (Bug 2 and Bug 4)

## Summary

Fixed two critical backend bugs in the tournament management system.

### Bug 2: Tournament stuck at `team_generation` with 0 teams from incomplete rollback

**Root Cause**: The safety check in `/src/app/api/tournaments/[id]/route.ts` had two issues:

1. **Status reset interference**: The safety check at lines 280-315 would reset `currentTournament.status = 'approval'` when detecting inconsistent states. This changed `currentIdx`, which caused Phase 4's condition (`currentIdx >= team_generation`) to evaluate as FALSE on subsequent revert attempts — skipping necessary team deletion cleanup.

2. **No orphaned data handling for target state**: When a partial rollback completed (some teams deleted, status updated to 'approval' by the final status update), a second revert attempt wouldn't clean up remaining orphaned teams because Phase 4's condition required `currentIdx >= team_generation`, but `currentIdx` was already at 'approval' (2) which is less than 'team_generation' (3).

3. **Safety check didn't consider target state**: The original safety check only detected inconsistencies based on current status (e.g., "at bracket_generation with 0 teams"), but didn't proactively clean up data inconsistent with the TARGET revert status.

**Fix Applied** (3 changes in route.ts):

1. **Safety check rewrite (lines 280-333)**: 
   - Removed all `currentTournament.status = 'approval'` and `await db.tournament.update({ status: 'approval' })` from the safety check
   - Added target-state-aware cleanup: when `targetIdx < team_generation`, proactively delete orphaned teams and matches
   - Added target-state-aware cleanup: when `targetIdx < bracket_generation`, proactively delete orphaned matches
   - Kept detection for truly inconsistent states (bracket_generation+ with 0 teams and 0 matches) but WITHOUT resetting status
   - Added comment explaining why status must NOT be reset in safety check

2. **Moved `targetIdx` definition before safety check (line 280)**:
   - Safety check now uses `targetIdx` to make target-state-aware decisions
   - Removed duplicate `targetIdx` definition from later in the code

3. **Added post-phase orphaned data cleanup (lines 700-732)**:
   - After all revert phases (Phase 0-6), a final safety net checks for remaining orphaned data
   - If `targetIdx < team_generation`: checks for remaining teams and matches, cleans up if found, resets participations
   - If `targetIdx < bracket_generation`: checks for remaining matches, cleans up if found
   - This handles the case where a previous partial revert changed the status but left orphaned data, causing phase conditions to skip cleanup
   - All operations are idempotent (deleteMany on 0 records is a no-op)

### Bug 4: Finalization returns 400 error

**Root Cause**: The finalize endpoint at `/src/app/api/tournaments/[id]/finalize/route.ts` required `tournament.status === 'finalization'` to proceed. When the tournament was at `main_event` with all matches completed, the admin had to manually advance the status to `finalization` first — a confusing UX that resulted in a 400 error with an unhelpful message.

**Fix Applied** (lines 37-88 in finalize/route.ts):

1. **Auto-advance from `main_event` to `finalization`**: When tournament status is `main_event`:
   - If all playable matches are completed (no pending/ready/live matches with both teams) AND at least one completed match exists → auto-advance status to 'finalization' and proceed with finalization
   - If incomplete matches remain → return 400 with specific error listing match statuses
   - If no completed matches → return 400 with specific error about needing to play matches first

2. **Improved error messages**: Each possible tournament status now has a specific, actionable error message:
   - `team_generation`: "Generate bracket terlebih dahulu, lalu mainkan dan selesaikan semua match."
   - `bracket_generation`: "Mulai event (main_event) dan selesaikan semua match terlebih dahulu."
   - `approval`: "Setujui peserta dan generate tim terlebih dahulu."
   - `registration`: "Buka registrasi dan setujui peserta terlebih dahulu."
   - `setup`: "Lengkapi setup tournament terlebih dahulu."
   - `completed`: "Tournament sudah difinalisasi. Tidak bisa finalisasi ulang."
   - Default: "Lanjutkan proses tournament hingga fase main_event, selesaikan semua match, lalu finalisasi."

3. **Kept redundant safety checks**: The existing `playableIncomplete` and `completedMatches` checks after the status validation remain as safety nets.

## Files Modified

- `/src/app/api/tournaments/[id]/route.ts` — Safety check rewrite, targetIdx relocation, post-phase orphaned data cleanup
- `/src/app/api/tournaments/[id]/finalize/route.ts` — Auto-advance logic, improved error messages

## Lint & Server

- Lint: clean (zero errors)
- Dev server: running without errors
