# Worklog

## Task 4 — Replace gold/neon card colors with division-specific tokens in dashboard.tsx

**File**: `/home/z/my-project/src/components/idm/dashboard.tsx`

### Changes Made

All gold/neon color references replaced with `dt.*` division-theme tokens from `useDivisionTheme()`:

| # | Location | Old | New | Notes |
|---|----------|-----|-----|-------|
| 1 | Line 219 — Prize Pool box | `card-gold bg-yellow-500/5 border border-yellow-500/10` | `${dt.cardPrize} ${dt.prizeBg} ${dt.prizeBorder}` | Division-aware prize pool card |
| 2 | Line 222 — Prize Pool amount | `text-gradient-gold` | `${dt.gradientText}` | Division gradient for prize text |
| 3 | Line 309 — Latest Match Result | `card-champion` | `${dt.cardChampion}` | Animated shimmer border per division |
| 4 | Line 324 — MVP area bg | `bg-yellow-500/5` | `${dt.bgSubtle}` | Division subtle background |
| 5 | Line 326 — MVP label text | `text-yellow-500` | `${dt.text}` | Division color for MVP text (Crown icon kept gold) |
| 6 | Line 375 — Donation prize pool | `card-gold bg-yellow-500/5 border border-yellow-500/10` | `${dt.cardPrize} ${dt.prizeBg} ${dt.prizeBorder}` | Same as #1 |
| 7 | Line 377 — Total Prize Pool text | `text-gradient-gold` | `${dt.gradientText}` | Same as #2 |
| 8 | Line 386 — Rank #1 donor | `glow-champion` | `${dt.glowChampion}` | Division pulsing glow (kept yellow for medal) |
| 9 | Line 435 — Rank #1 player | `glow-champion` | `${dt.glowChampion}` | Same as #8 |
| 10 | Line 477 — Rank #1 club card | `card-gold glow-champion` | `${dt.cardGold} ${dt.glowChampion}` | Division neon border + glow |
| 11 | Line 503 — Champion club points | `text-gradient-gold` | `dt.gradientText` | Division gradient for #1 club |
| 12 | Line 543 — MVP player event bg | `bg-yellow-500/5 border border-yellow-500/10` | `${dt.bgSubtle} ${dt.borderSubtle}` | Division subtle bg/border |
| 13 | Line 544 — MVP icon bg | `bg-yellow-500/10` | `${dt.iconBg}` | Division icon background |
| 14 | Line 549 — MVP player name | `text-yellow-500` | `dt.text` | Division text color |
| 15 | Line 591 — Upcoming match bg | `bg-idm-amber/5 border border-idm-amber/10` | `${dt.bgSubtle} ${dt.borderSubtle}` | Division subtle bg/border |
| 16 | Line 592 — Zap icon bg | `bg-idm-amber/10` | `${dt.iconBg}` | Division icon background |
| 17 | Line 593 — Zap icon color | `text-idm-amber` | `${dt.text}` | Division text color |
| 18 | Line 597 — Club names in upcoming | `text-idm-amber` | `dt.text` | Division text color |
| 19 | Line 601 — BO3 badge | `bg-idm-amber/10 text-idm-amber` | `${dt.badgeBg}` | Division badge background |

### Preserved (intentionally kept gold/yellow)
- `text-yellow-500` on Crown icons (trophy/MVP indicators)
- `bg-yellow-500/20 text-yellow-500` on rank #1 circles (gold/silver/bronze medal system)
- `text-yellow-500` / `text-gray-400` / `text-amber-600` for rank 1/2/3 icons in leaderboard

### Verification
- ESLint: passes cleanly
- No remaining `text-gradient-gold`, `card-gold`, `card-champion`, `glow-champion`, `bg-yellow-500/5`, `bg-idm-amber` references in the file (except medal/rank indicators)
