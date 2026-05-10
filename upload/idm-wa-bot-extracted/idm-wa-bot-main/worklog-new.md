---
Task ID: 1
Agent: Main Agent
Task: Regenerate all dashboard images with accurate game idol character art style for 10/10 similarity

Work Log:
- Audited all 17 existing background images and 15+ components using them
- Identified that images were generic/abstract, not matching game idol character style
- Regenerated all 17 background images with detailed "ensemble stars game art style" prompts featuring:
  - Male idol characters with silver-white hair, black leather outfits, silver chains
  - Female idol characters with pink-lavender twin-tails, white-gold stage outfits, star accessories
  - Concert stage environments, VS versus screens, tournament brackets, donation events
  - Consistent anime illustration style matching Japanese idol game aesthetics
- Generated 6 new avatar character images (3 tiers × 2 divisions):
  - avatar-male-s.png (S-tier: silver hair, black leather, confident)
  - avatar-male-a.png (A-tier: blue-streaked hair, teal outfit, serious)
  - avatar-male-b.png (B-tier: brown messy hair, simple white outfit, kind)
  - avatar-female-s.png (S-tier: pink twin-tails, white-gold outfit, sweet)
  - avatar-female-a.png (A-tier: amber ponytail, orange-red outfit, cheerful)
  - avatar-female-b.png (B-tier: short black hair, pastel outfit, shy)
- Updated component gradient overlays to show more character art (reduced from 90% → 70% opacity)
- Updated player-list.tsx to use game character avatar images instead of initial letters
- Updated leaderboard.tsx to use game character avatar images with tier-based borders
- Updated match-spotlight.tsx team avatars to use game character images
- Updated podium.tsx avatar circles to use game character images
- Updated champions-face-off.tsx avatar circles to use game character images
- Updated club-list.tsx mini member avatars to use game character images
- Added stronger text shadows for readability over lighter overlays
- All 23 images verified present, lint passes, dev server compiles cleanly

Stage Summary:
- Total images: 23 (17 backgrounds + 6 character avatars)
- All images regenerated with ensemble stars / anime idol game art style
- 6 components updated to display game character avatar images
- Gradient overlays lightened to make character art visible
- Text readability maintained with stronger drop shadows
