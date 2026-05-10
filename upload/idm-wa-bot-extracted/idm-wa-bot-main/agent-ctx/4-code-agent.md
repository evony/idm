# Task 4 — Code Agent Work Record

## Task: Fix upcoming match display and add empty states in dashboard

### File Modified
- `/home/z/my-project/src/components/idm/dashboard.tsx`

### Changes Made

#### Fix 1: MatchRow upcoming match display
- Added `isUpcoming` flag when `status === 'upcoming'`
- Changed `isCompleted` from `status === 'completed' || (score1 !== score2)` to `status === 'completed' || (!isUpcoming && score1 !== score2)` — prevents upcoming matches from being treated as completed
- Set `winner1`/`winner2` to `false` when upcoming
- Added `displayScore1`/`displayScore2` showing '-' for upcoming matches instead of raw score (0)
- Removed opacity dimming for both teams when upcoming (no winner yet, both shown at full opacity)
- Right-side "VS" badge already worked correctly — no change needed

#### Fix 2: Empty states for dashboard sections
1. **Recent Matches (Overview)**: Changed from `{data.recentMatches?.length > 0 && (...)}` to ternary with empty state showing Music icon + "Belum ada hasil match"
2. **Top Players Podium**: Changed from always-rendering grid to ternary with empty state showing Users icon + "Belum ada peserta terdaftar"
3. **Donations (Donatur Teratas)**: Changed from direct `.map()` to ternary with empty state showing Gift icon + "Belum ada donasi"
4. **Clubs (Standings tab)**: Wrapped table in ternary with empty state showing Shield icon + "Belum ada club terdaftar"
5. **Matches tab**: Already had empty state — unchanged

All empty states use consistent pattern:
```tsx
<div className={`p-6 rounded-xl ${dt.bgSubtle} ${dt.border} text-center`}>
  <Icon className={`w-8 h-8 mx-auto mb-2 opacity-30 ${dt.text}`} />
  <p className="text-sm text-muted-foreground">{message}</p>
  <p className="text-[10px] text-muted-foreground/70 mt-1">{subMessage}</p>
</div>
```

### Verification
- `bun run lint` passes with zero errors
- All existing functionality preserved
- All Indonesian language text preserved
