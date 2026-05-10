# Task 3a-3b: Add getDivisionTheme() and Fix PlayerProfile Modal

## Summary

Completed both parts of the task successfully.

### Part 1: Added `getDivisionTheme()` to use-division-theme.ts
- Added standalone function before `useDivisionTheme()` hook
- Takes `division: Division | string` parameter, returns `DivisionTheme`
- Same logic as hook but doesn't depend on Zustand store

### Part 2: Fixed PlayerProfile modal
- Added `getDivisionTheme` import
- Removed unused imports (`Progress`, `CircleDot`)
- Replaced store-based division logic with player-based:
  - `storeDivision = useAppStore(s => s.division)` (fallback)
  - `playerDivision = (player.division || storeDivision) as 'male' | 'female'` (player's actual division)
  - `dt = getDivisionTheme(playerDivision)` (theme based on player, not UI)
- Replaced ALL `division === 'male'/'female'` with `playerDivision === 'male'/'female'` (6 locations)
- Updated StatBlock to accept `playerDivision` prop with unconditional hook call pattern
- Passed `playerDivision` to all 4 StatBlock usages

### Lint Result
- Clean pass with zero errors
- Fixed conditional hook call issue in StatBlock
