# Pending Players Tab Implementation

## Task: Add "Pending Players" section to the admin panel for managing player registration approvals

## Changes Made

### 1. Created `/src/components/idm/admin/tabs/admin-pending-tab.tsx`
A new self-contained tab component that:
- Fetches pending players from `GET /api/admin/players/approve?status=pending&division={division}`
- Displays a list of pending players with: Name/Gamertag, Division badge (male/female), WhatsApp number, City, Club, Registration date, Account status
- Per-player actions:
  - **Approve button** (green) — calls `POST /api/admin/players/approve` with `{ playerId, action: 'approve', tier: selectedTier }`
  - **Reject button** (red) — opens a dialog requiring a reason, then calls `POST /api/admin/players/approve` with `{ playerId, action: 'reject', reason }`
  - **Tier selector** (dropdown: S, A, B) — default B, admin sets tier on approval
- Division sub-filter (male/female toggle) within the tab
- Pending count badge in the header
- Empty state: "Tidak ada pemain yang menunggu persetujuan"
- Auto-refresh every 30 seconds + manual refresh button
- Loading skeleton while fetching
- Error state with retry button
- Toast notifications on approve/reject success/failure
- Reject dialog with required reason field

### 2. Updated `/src/components/idm/admin-panel.tsx`
- Added imports: `Clock`, `UserCheck` from lucide-react, `AdminPendingTab`
- Added `pending` as the first tab in the `peserta` category in `categoryTabMap`
- Added pending tab config in both mobile and desktop navigation (with `Clock` icon and `pendingPlayersCount` badge)
- Added `TabsContent` for the `pending` tab rendering `<AdminPendingTab division={storeDivision} />`
- Added a new query `admin-pending-players-count` that always fetches to show the badge count even when the tab is not active

### 3. Backend API — No changes needed
The API at `/api/admin/players/approve` already existed with:
- `GET` — lists players by registration status with division filter
- `POST` — approves or rejects a pending player with tier assignment and reason

## Files Modified
- `src/components/idm/admin/tabs/admin-pending-tab.tsx` (NEW)
- `src/components/idm/admin-panel.tsx` (MODIFIED)

## Verification
- Lint passes for both files with zero errors
- Dev server returns 200 OK
- API endpoint returns 401 (expected — requires admin auth)
