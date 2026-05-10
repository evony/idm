# Task 3 — Upgrade community-stats.tsx with alive/aesthetic visual enhancements

## Summary
Upgraded the `community-stats.tsx` component with visual enhancements to make it feel more "alive and aesthetic" in line with the landing page design.

## Changes Made
File: `src/components/idm/community-dashboard/community-stats.tsx`

1. **Count-Up Animation**: Added `counter-pop` CSS class to the stat value `<p>` element — triggers a spring entrance animation already defined in globals.css
2. **Shimmer Hover Effect**: Added `stat-card-shimmer` CSS class to each stat card — gold shimmer sweep on hover, already defined in globals.css
3. **Hover Border Glow**: Added `hover:border-idm-gold-warm/30 hover:shadow-[0_0_12px_rgba(212,168,83,0.15)]` classes for warm gold border glow on hover
4. **Gold Top Accent Line**: Added an absolute-positioned 1px gradient line at the top of each card that fades in on hover (`opacity-0 group-hover:opacity-100`) — requires `relative overflow-hidden` on the parent card div
5. **Staggered Entrance**: Kept existing `animate-fade-enter-sm` with stagger delay (already in place)

## No Functionality Changes
All data logic, props interface, and rendering behavior remain identical. Only visual/animation classes were added.
