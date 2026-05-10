# Task 2-h: Redesign 6 Dashboard Components (metaco.gg style)

## Summary
Redesigned Highlights, BracketView, SeasonProgress, ActivityFeed, MatchHistory, and Podium components with metaco.gg's image-first cinematic design philosophy.

## Files Modified
1. `/home/z/my-project/src/components/dashboard/highlights.tsx` — Image backgrounds, gradient overlays, icon glow, taller cards
2. `/home/z/my-project/src/components/dashboard/bracket-view.tsx` — Bracket-tree header, winner accent bars, Star MVP icon
3. `/home/z/my-project/src/components/dashboard/season-progress.tsx` — Full bg image, glow progress bar, pulse animation, glassmorphism pills
4. `/home/z/my-project/src/components/dashboard/activity-feed.tsx` — Image header, left accent lines, better timestamps
5. `/home/z/my-project/src/components/dashboard/match-history.tsx` — Match-versus header, Swords VS, Star badge MVP
6. `/home/z/my-project/src/components/dashboard/podium.tsx` — Champions podium bg, differentiated heights, Crown/Trophy/Medal icons

## Key Design Decisions
- All image backgrounds use `backgroundImage: url(...)` with gradient overlays
- Image overlay text uses `text-white` where on dark gradients (per established pattern)
- Non-overlay text uses theme-aware classes (text-foreground, text-muted-foreground, etc.)
- No changes to props or interfaces — fully backward compatible
- ESLint passes cleanly, dev server compiles successfully
