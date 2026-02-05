
## Goal
Fix the **blank page / redirect** happening in **SuperAdmin Dashboard → Student Voice → Clubs & Societies**, especially when you click:
- Add Club/Society
- Edit (pencil)
- Patron selection / “assign” actions

…and ensure the page never goes fully blank again (even if a single widget fails).

---

## What’s most likely causing the blank page (root cause)
### A) Clubs manager dialog crashes because of an invalid Select item value
In `src/components/admin/ClubsSocietiesManager.tsx` the Patron selector contains:
- `SelectItem value=""` (“No patron assigned”)

Radix/shadcn Select components can crash when an item’s `value` is an empty string. That would explain:
- Clicking **Add Club/Society** immediately blanking (dialog mounts → Select renders → crash)
- Clicking **Edit** blanking (dialog mounts → Select renders → crash)

### B) “Student Voice” section is fragile: any one component error blanks the entire section
`SuperAdminDashboard.tsx` renders:
- `StudentAmbassadorManager`
- `ClubsSocietiesManager`
- `PreviousLeadersManager`

There is **no error boundary**, so if any component throws during render, the whole page can go blank.

### C) Some queries use `.single()` which can produce 406 errors (no rows) and can contribute to instability
Example:
- `StudentAmbassadorManager` uses `.single()` and throws if no ambassador row exists yet.

Even if React Query usually contains the error, it’s still better to make these queries “safe”.

---

## Implementation Plan (what I will change)

### 1) Make the Clubs patron selector safe (no empty-string Select values)
**File:** `src/components/admin/ClubsSocietiesManager.tsx`

**Changes:**
1. Introduce a sentinel value for “no patron”, e.g.:
   - `const NO_PATRON = "__none__";`
2. Update Select binding:
   - `value={formData.patron_id || NO_PATRON}`
3. Replace:
   - `<SelectItem value="">No patron assigned</SelectItem>`
   with:
   - `<SelectItem value={NO_PATRON}>No patron assigned</SelectItem>`
4. When saving (insert/update), convert sentinel to `null`:
   - `patron_id: formData.patron_id === NO_PATRON ? null : formData.patron_id || null`

**Expected result:**
- Clicking **Add Club/Society** / **Edit** no longer crashes the page.

---

### 2) Add an Error Boundary so one broken card can’t blank the whole Student Voice page
**New file (planned):**
- `src/components/shared/SectionErrorBoundary.tsx` (or similar)

**File to update:**
- `src/pages/SuperAdminDashboard.tsx`

**Changes:**
- Wrap each card’s manager component:
  - Student Ambassador Manager
  - Clubs & Societies Manager
  - Previous Leaders Manager

**Fallback UI:**
- A small error panel inside the card:
  - “This section failed to load”
  - Show a short error message
  - Button: “Reload section” (simple key-based remount)

**Expected result:**
- Even if one widget breaks, the rest of the dashboard remains usable.
- Instead of “blank page”, you see a clear error message.

---

### 3) Replace risky `.single()` calls with `.maybeSingle()` where “no record yet” is normal
**Files:**
- `src/components/admin/StudentAmbassadorManager.tsx`
- (optional hardening) any other “singleton” table manager in the same dashboard

**Changes:**
- Replace `.single()` with `.maybeSingle()`
- Add explicit `error` handling UI:
  - if `error`, show a message inside the card rather than letting things fail silently

**Expected result:**
- Student Voice loads cleanly even when a singleton record hasn’t been created yet.

---

### 4) Add explicit onError handling for club mutations (to prevent silent failures)
**File:** `src/components/admin/ClubsSocietiesManager.tsx`

**Changes:**
- Add `onError` for create/update/delete mutations:
  - Show a toast with the actual backend error message
  - Keep dialog open so the admin can correct and retry

**Expected result:**
- If permissions or validation fail, the UI doesn’t feel “unresponsive”; it explains the issue.

---

### 5) (Related) Fix the separate “Assign Roles” page if that’s part of what you meant by “assign roles”
If you meant `/admin/assign-roles`, that page will blank because it calls an admin-only API from the browser:
- `supabase.auth.admin.getUserById(...)` (not allowed in the client)

**File:**
- `src/pages/admin/AssignRoles.tsx`

**Fix approach:**
- Stop using admin auth API from the browser.
- Use the `profiles.email` column (already present in other parts of the app) or load emails via a backend function if needed.

**Expected result:**
- No blank page on “Assign Roles”.

---

## Verification / QA Checklist
After implementing:
1. Open **SuperAdmin Dashboard → Student Voice**
2. Click **Add Club/Society**
   - Dialog opens, no blank page
3. Open the **Patron** dropdown
   - “No patron assigned” works
4. Create a club with no patron
5. Edit an existing club
6. Delete a club
7. Confirm: if any component fails, the dashboard shows an inline error panel (not a blank screen)

---

## Files that will be changed/added
- Update: `src/components/admin/ClubsSocietiesManager.tsx`
- Update: `src/components/admin/StudentAmbassadorManager.tsx`
- Update: `src/pages/SuperAdminDashboard.tsx`
- Add: `src/components/shared/SectionErrorBoundary.tsx`
- (Optional but recommended) Update: `src/pages/admin/AssignRoles.tsx`

---

## Why this will solve your issue
- The most probable immediate crash (empty-string SelectItem value) gets removed.
- Error boundaries prevent “total blank page” failures.
- `.maybeSingle()` avoids 406 “no rows” errors for singleton tables.
- Better mutation error handling makes “unresponsive” actions explain themselves.

