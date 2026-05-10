# Task 5: Add Countdown Timer + Improve Hero CTA Buttons

**Agent**: Code Agent  
**Status**: Completed

## Work Log

### 1. Added Countdown Timer to Hero Section
- Added `countdown` state with `useState` inside `LandingPage` component (`{ days, hours, minutes, seconds }`)
- Implemented `useEffect` with `setInterval` that updates every second
- Countdown calculates next Saturday 20:00 WITA (Asia/Makassar, UTC+8)
- Auto-resets weekly: if past Saturday 20:00, counts to next Saturday
- WITA timezone conversion handles local timezone offset correctly
- UI placed AFTER the tagline paragraph and BEFORE the CTA buttons
- Displays "Next Tournament Starts In" label above (text-[10px] text-[#d4a853]/40 uppercase tracking-[0.4em])
- 4 glass-gold styled boxes for Days/Hours/Min/Sec with colon dividers
- Each box uses `glass rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 min-w-[48px] sm:min-w-[56px]`
- Numbers: `text-[#d4a853] text-lg sm:text-2xl font-bold font-mono` with zero-padded format
- Labels: `text-[9px] sm:text-[10px] text-[#d4a853]/50 mt-1 uppercase tracking-wider`
- Wrapped in `motion.div variants={fadeUp}` with `className="mb-8"`

### 2. Replaced Hero CTA Buttons with Hall of Fame Inspired Buttons
- **Primary Button (Gold gradient)**: "MULAI BERMAIN" with Play icon
  - `bg-gradient-to-r from-[#d4a853] via-[#b8941e] to-[#d4a853]` gold gradient
  - `text-[#0c0a06] font-black text-sm tracking-wider` dark text
  - `shadow-[0_0_30px_rgba(212,168,83,0.2)] hover:shadow-[0_0_60px_rgba(212,168,83,0.4)]`
  - Shimmer sweep effect: absolute div with `animate-shimmer` class
  - Calls `enterApp('male')` on click
  
- **Secondary Button (Glass-gold outline)**: "LIHAT LEADERBOARD" with Crown icon
  - `border border-[#d4a853]/30 text-[#d4a853] font-bold`
  - `hover:border-[#d4a853]/60 hover:shadow-[0_0_30px_rgba(212,168,83,0.15)]`
  - `backdrop-blur-sm bg-[#d4a853]/5` glass effect
  - Scrolls to champions section on click via `scrollToSection('champions')`

- Both buttons use `motion.div whileHover whileTap` wrappers
- Old division entry buttons (Male/Female) completely removed
- `enterApp` function remains available for the primary button

### 3. Added Shimmer Animation to globals.css
- Added `@keyframes shimmer-sweep` with `translateX(-100%)` to `translateX(100%)`
- Added `.animate-shimmer` class with `animation: shimmer-sweep 3s ease-in-out infinite`

### Verification
- `bun run lint` passes with zero errors
- Dev server running successfully on port 3000

## Files Modified
- `src/components/idm/landing-page.tsx` — Countdown timer state + UI, new hero CTA buttons
- `src/app/globals.css` — shimmer-sweep keyframe and animate-shimmer class
