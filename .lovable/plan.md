
# Remove Session Timeout from SuperAdmin Dashboard

## Summary
Remove the 30-second inactivity session timeout from the SuperAdmin Dashboard so you can work without being logged out due to inactivity.

## Changes Required

### File: `src/pages/SuperAdminDashboard.tsx`

1. **Remove the import** (Line 9)
   - Delete: `import { useSessionTimeout } from "@/hooks/useSessionTimeout";`

2. **Remove the hook usage** (Line 44)
   - Delete: `useSessionTimeout();`

## Technical Details

| What | Details |
|------|---------|
| File to modify | `src/pages/SuperAdminDashboard.tsx` |
| Lines affected | Line 9 (import), Line 44 (hook call) |
| Impact | SuperAdmin sessions will no longer auto-logout after 30 seconds of inactivity |

## Note
The `useSessionTimeout` hook file itself (`src/hooks/useSessionTimeout.tsx`) will remain in the codebase in case you want to use it for other dashboards in the future. If you'd like me to delete that file entirely as well, let me know.
