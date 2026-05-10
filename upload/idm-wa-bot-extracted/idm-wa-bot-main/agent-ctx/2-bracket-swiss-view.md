# Task 2: Add SwissView Component to BracketView

## Agent: Main Agent
## Task: Add SwissView component and update BracketView to support `swiss` bracket type

## Work Log

### Changes Made to `/home/z/my-project/src/components/idm/bracket-view.tsx`

1. **Line 6** — Added `ChevronDown` and `ChevronUp` to the `lucide-react` import
   - `import { Crown, Music, Trophy, ZoomIn, ZoomOut, Maximize2, ChevronDown, ChevronUp } from 'lucide-react';`

2. **Line 41** — Added `'swiss'` to the `BracketViewProps` bracketType union type
   - `bracketType: 'single_elimination' | 'double_elimination' | 'group_stage' | 'round_robin' | 'swiss';`

3. **Lines 695–1041** — Added new `SwissView` component BEFORE the main `BracketView` component. The component includes:
   - **Swiss Standings Table** (premium MPL style):
     - Calculates standings from all matches with `bracket === 'swiss'`
     - Stats: W, D, L, Pts (W=3, D=1, L=0), Buchholz (sum of opponents' points), GW, GL
     - Sort: Points DESC → Buchholz DESC → Games Won DESC
     - Top 4 rows highlighted with division color (qualify for playoff), 🏆 badge
     - Cut-line separator after rank 4 (dashed gold line)
     - Legend footer explaining abbreviations
     - Responsive: BH, GW, GL columns hidden on small screens
   - **Round-by-Round Match Cards**:
     - Swiss matches grouped by round with collapsible/expandable sections
     - Round labels: "🇨🇭 Swiss Round 1", "🇨🇭 Swiss Round 2", etc.
     - Match cards in responsive grid (1-2-3 cols)
     - W/D/L score badges (green/yellow/red) on completed match team rows
     - ChevronDown/ChevronUp icons for toggle
   - **Playoff Section** (if any matches with `bracket !== 'swiss'`):
     - Same styling as GroupStageView's playoff section
     - Gold accent border and header with 🏆 Playoff label

4. **Lines 1427–1434** — Added `swiss` render case in BracketView:
   - `if (bracketType === 'swiss') { return <SwissView matches={matches} roundsData={roundsData} />; }`

5. **Line 1063** — Added `'swiss'` to the auto-split exclusion in `roundsData` useMemo:
   - `if (Object.keys(grouped).length === 1 && bracketType !== 'group_stage' && bracketType !== 'round_robin' && bracketType !== 'swiss')`

## Stage Summary
- SwissView component fully implemented with premium MPL-style standings table, round-by-round collapsible match cards, and playoff section
- BracketView now supports `swiss` bracket type alongside existing types
- No existing components were modified (only additions and targeted updates)
- Lint passes clean, dev server compiles without errors
