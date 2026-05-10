# Task ID 2 — Add Platinum Skin Visual to MVP Card

## Task
Add Platinum skin visual (#E5E4E2) to the MVP card in the highlights section of the Tarkam IDM League project.

## File Modified
- `/home/z/my-project/src/components/idm/landing/highlights-section.tsx`

## Changes Made

### 1. Added PLATINUM constants (lines 122-133)
```typescript
const PLATINUM = {
  frame: '#E5E4E2',
  nameLight: '#F5F5F5',
  nameMid: '#E5E4E2',
  nameDark: '#B0B0B0',
  badgeBg: 'rgba(229,228,226,0.2)',
  badgeText: '#F5F5F5',
  glow: 'rgba(229,228,226,0.5)',
  icon: '⭐',
  rgb: '229,228,226',
} as const;
```

### 2. Modified MvpCard component (non-empty state only)

| Element | Before | After |
|---------|--------|-------|
| Outer card background | Division-only gradient | Platinum-primary gradient with division secondary |
| Outer card border | `rgba(${colorRgb},0.15)` | `rgba(${PLATINUM.rgb},0.2)` |
| Outer card shadow | Division-only | Platinum-primary shadow |
| Accent bar | Solid division color | Platinum↔Division gradient with platinum glow |
| Inner avatar card border | Division border | Platinum border |
| Inner avatar card shadow | Division shadow | Platinum + division combined shadow |
| Inner avatar card background | Division gradient | Platinum-primary gradient with division hint |
| Bottom accent glow | Division-only radial | Platinum + division radial |
| MVP badge (top-right) | Gold Crown (w-7) | Platinum ⭐ star (w-8) with gradient + glow |
| Division label (top-left) | Division-colored badge | Platinum badge with ⭐ prefix |
| Player gamertag | White primary text | Platinum #E5E4E2 with platinum text-shadow glow |
| Tier badge | Division background | Platinum-tinted background + border |
| Points badge | Division background | Platinum-tinted background + border |

### 3. Empty state — UNCHANGED
Empty state cards still use pure division colors (cyan for male, pink for female).

### 4. Click handler — PRESERVED
`setSelectedPlayer` still works correctly on the card click.

## Design Principle
**Platinum is PRIMARY visual identity, division color is SECONDARY accent.** The MVP card clearly looks "Platinum" while still showing which division the player is from through subtle division color hints.

## Verification
- Lint: ✅ Passes clean
- Dev server: ✅ Running without errors
- Worklog: ✅ Updated at `/home/z/my-project/worklog.md`
