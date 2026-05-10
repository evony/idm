# Task 6 - full-stack-developer

## Task: Replace hardcoded gold card/frame CSS classes with division-specific `dt.*` theme classes

## Work Done

### dashboard.tsx (15 replacements)
- `card-glow-hover` → `${dt.cardGlowHover}` in 3 season progress stat boxes
- `card-premium card-lift` → `${dt.cardPremium} card-lift` in donation tracker & upcoming matches cards
- `card-glow-hover` → `${dt.cardGlowHover}` in upcoming match item
- `card-premium` → `dt.cardPremium` in leaderboard/clubs/activity tab cards (3 occurrences)
- `card-glow-hover` → `${dt.cardGlowHover}` in clubs tab (2 occurrences: idx<4 and fallback)
- `card-glow-hover` → `${dt.cardGlowHover}` in 5 activity feed items (match, player, streak, donation, upcoming)

### player-card.tsx (5 replacements)
- `card-champion` → `dt.cardChampion` (rank 1 card wrapper)
- `card-premium` → `dt.cardPremium` (rank 2/3 card wrappers, 2 occurrences)
- `card-glow-hover` → `${dt.cardGlowHover}` (rank >3 fallback)
- `glow-champion` → `${dt.glowChampion}` (rank badge + avatar glow, 2 occurrences)
- `text-gradient-gold` → `dt.gradientText` (champion name + points, 2 occurrences)

## Verification
- `bun run lint` passes clean
- No remaining `card-premium`, `card-champion`, `card-glow-hover`, `glow-champion`, or `text-gradient-gold` hardcoded in either file
- `card-lift`, `interactive-scale` classes preserved (layout/animation, not color)
- Universal gold elements preserved (yellow-500 for MVP crown, rank #1 badge, prize pool)
