# Task 3: Port Hooks, Types, and Contexts from Tarkam

## Agent: Hooks/Types/Contexts Port Agent

## Summary
Successfully ported all 6 hooks, comprehensive stats types, and AuthContext from the tarkam repository. Updated existing lib/types.ts to align with the new Prisma schema.

## Files Created
- `/src/hooks/use-community-theme.ts` — Gold/amber community theme hook
- `/src/hooks/use-division-theme.ts` — Division theme system (male/female/community)
- `/src/hooks/use-shell-theme.ts` — Shell theme resolver for app-shell
- `/src/hooks/use-pwa.ts` — PWA service worker + install prompt
- `/src/hooks/use-pusher.ts` — Pusher real-time subscriptions with React Query invalidation
- `/src/hooks/use-background-images.ts` — CMS background image URLs via React Query
- `/src/types/stats.ts` — Comprehensive stats API types (25+ interfaces)
- `/src/contexts/AuthContext.tsx` — Auth context with login/register/logout

## Files Modified
- `/src/lib/types.ts` — Added gamertag, waNumber, city, joki, registrationStatus to PlayerData; updated bpm to string|null; added location field; added ApiResponse<T>

## Files Kept As-Is
- `/src/hooks/use-mobile.ts` — No changes
- `/src/hooks/use-toast.ts` — No changes
- `/src/hooks/use-3d.ts` — No changes (3D tilt for iOS Premium style)
- `/src/hooks/use-tournament.ts` — No changes (no conflicts with store.ts)

## Key Decisions
- `use-tournament.ts` kept as-is: it manages dashboard UI state (tabs, admin panel), while `useAppStore` in store.ts manages app-level state (navigation, division, auth) — no conflict
- tarkam `types/index.ts` NOT ported: has `@ts-nocheck`, references Prisma types that don't exist in our schema. Only `ApiResponse<T>` was extracted to `lib/types.ts`
- `area` field in TournamentData/TournamentDetailData kept as `@deprecated` alias for `location` to maintain backward compatibility

## Verification
- ESLint: passes with no errors
- TypeScript: no errors in new or modified files
- Dev server: compiles successfully
