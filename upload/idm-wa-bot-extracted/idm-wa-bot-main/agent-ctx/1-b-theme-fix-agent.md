# Task 1-b: Fix hardcoded dark colors in dashboard components (Group 2)

## Agent: Theme Fix Agent (Group 2)

## Summary
Converted all hardcoded dark colors in 6 dashboard components to theme-aware CSS variables so they render properly in both light and dark modes.

## Files Modified
1. `src/components/dashboard/stats-cards.tsx`
2. `src/components/dashboard/match-spotlight.tsx`
3. `src/components/dashboard/leaderboard.tsx`
4. `src/components/dashboard/podium.tsx`
5. `src/components/dashboard/bracket-view.tsx`
6. `src/components/dashboard/highlights.tsx`

## Key Replacements Applied
- **Backgrounds**: `bg-[#0d0f14]` → `bg-card`, `bg-[#12141a]` → `bg-muted`
- **Gradients**: `from-[#0d0f14]` → `from-background`, `via-[#0d0f14]` → `via-background`, `to-[#0d0f14]` → `to-background`
- **Text**: `text-white/90` → `text-foreground`, `text-white/30` → `text-muted-foreground/60`, etc.
- **Borders**: `border-white/[0.06]` → `border-border`, `border-white/[0.04]` → `border-border/60`
- **Hover states**: `hover:bg-white/[0.03]` → `hover:bg-muted/20`, `hover:border-white/[0.1]` → `hover:border-border`
- **Input styling**: `placeholder:text-white/25` → `placeholder:text-muted-foreground/50`, `focus-visible:ring-white/10` → `focus-visible:ring-ring/30`
- **Inline styles**: `rgba(255,255,255,0.05)` → `hsl(var(--muted) / 0.5)`, `rgba(255,255,255,0.4)` → `hsl(var(--muted-foreground) / 0.6)`

## Verification
- Grep confirmed zero remaining hardcoded dark colors in all 6 files
- `bun run lint` passes cleanly
