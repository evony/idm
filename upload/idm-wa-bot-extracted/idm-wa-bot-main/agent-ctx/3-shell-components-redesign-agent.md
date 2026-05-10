# Task ID: 3 - Shell Components Redesign Agent

## Task: Redesign sidebar, header, footer, and dashboard-tabs with Apple iOS Premium design

## Work Log

### File 1: sidebar.tsx — Apple iOS Settings-style frosted glass sidebar
- Complete rewrite with `motion` from framer-motion for smooth transitions
- Frosted glass background: `bg-card/80 backdrop-blur-xl` (no hardcoded dark bg-[#xxx])
- Division-aware left accent glow line with `AnimatePresence` mode="wait" — smoothly transitions color when switching tabs
- Ambient glow spots that change with active division (emerald/cyan/pink-300)
- iOS-style pill navigation buttons: `rounded-xl` with active indicator using `motion.div` with `layoutId="sidebar-active-pill"`
- 3D hover effect on nav items: `whileHover={{ x: 3 }}` for subtle iOS-style translateX
- `whileTap={{ scale: 0.97 }}` for tactile press feedback
- Staggered entrance animations on nav items (`delay: index * 0.06`)
- Clean Apple typography: text-[13px] font-medium, uppercase tracking-[0.15em] section labels
- Bottom section: Admin button + Theme toggle + IDM League badge
- Badge colors change with active division (emerald/cyan/pink-300)
- Removed all hardcoded dark colors (bg-[#xxx], text-white/XX)
- Uses theme-aware CSS variables throughout (text-muted-foreground, bg-muted, border-border, etc.)
- `hidden md:flex` for desktop-only visibility

### File 2: header.tsx — Apple iOS mobile header with frosted glass
- Complete rewrite with `motion` from framer-motion
- Frosted glass: `bg-card/80 backdrop-blur-xl` on header
- Division-aware bottom accent glow line with `AnimatePresence` for smooth color transitions
- Logo area with division-colored gradient icon container
- Theme toggle + Admin button + Hamburger menu with `whileTap={{ scale: 0.9 }}`
- Mobile nav Sheet with full frosted glass background (`bg-card/90 backdrop-blur-xl`)
- Left accent glow line in mobile nav matching sidebar
- iOS-style pill navigation in mobile nav (same as sidebar design)
- Staggered entrance animations
- All theme-aware CSS variables (no hardcoded dark colors)
- `md:hidden` for mobile-only visibility

### File 3: footer.tsx — Apple iOS minimal footer
- Complete rewrite with `motion` from framer-motion
- Frosted glass background: `bg-card/80 backdrop-blur-xl`
- Division-colored top accent glow line with `AnimatePresence` for smooth transitions
- Removed background image (was tournament-arena.png with bg-background/97 overlay) — replaced with clean frosted glass
- Logo area with division-colored gradient icon
- Social links as iOS-style pill buttons: `rounded-full` with division-colored hover states
- "Built with ❤️ by Community" bottom line
- Smooth fade-in entrance animations with stagger
- All theme-aware CSS variables

### File 4: dashboard-tabs.tsx — Apple iOS segmented control
- Complete rewrite with iOS segmented control style
- Removed background image (was tournament-arena.png) — replaced with clean frosted glass (`bg-card/70 backdrop-blur-xl`)
- `motion.div` with `layoutId="dashboard-tab-indicator"` for smooth animated pill indicator between tabs
- Spring animation: `type: 'spring', stiffness: 400, damping: 30, mass: 0.8`
- Division-specific active colors: emerald (SEMUA), cyan (MALE), pink-300 (FEMALE)
- Active tab has filled background with division color + glow shadow
- Active icon gets `scale-110` + `drop-shadow-[0_0_8px_currentColor]` glow
- Subtle noise texture for depth
- Container: `rounded-2xl border border-border/60` — clean iOS segmented control shape
- Gap-0.5 between tabs for tight iOS spacing

## Design Philosophy Applied
- **Frosted glass**: `backdrop-blur-xl` on all shell components
- **True black/white**: Using CSS variables (bg-card, bg-background) — renders as #000 in dark, #f5f5f7 in light
- **Large rounded corners**: `rounded-xl` on nav items, `rounded-2xl` on tab container
- **Spring animations**: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` and spring physics
- **NO indigo/blue**: Primary colors are emerald/cyan/pink-300 based on division
- **Gold/Amber ONLY for rank/prizes**: Not used in general UI
- **Mobile-first**: `hidden md:flex` sidebar, `md:hidden` header
- **Theme-aware**: All colors use CSS variables, both light/dark modes supported

## Verification
- ESLint passed with zero errors on all 4 files
- Dev server compiles successfully
- No hardcoded dark colors remain (bg-[#xxx], text-white/XX, border-white/XX)
- All interfaces/props preserved (DashboardTabsProps, etc.)
