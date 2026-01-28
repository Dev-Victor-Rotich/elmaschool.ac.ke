
# Fix: Staff Email Display and Staff Registry Population

## Problem Summary
Two newly registered staff members (Edwin Chelimo and Vincent) have:
1. **Missing emails** in the Super Admin dashboard's "All Users & Their Roles" table
2. **Not appearing** in the Staff Registry card

This is because:
- They exist in `profiles` and `user_roles` tables but are **missing from `staff_registry`**
- The email lookup in the dashboard relies on `staff_registry` for staff emails
- The `create-user` edge function's `staff_registry` insert failed silently

## Solution Overview

### Part 1: Add Missing Staff to `staff_registry` (Data Fix)
Run an SQL command to insert the missing staff members into `staff_registry`:

```sql
INSERT INTO staff_registry (email, full_name, phone, id_number, role, status, created_by)
SELECT 
  au.email,
  p.full_name,
  p.phone_number,
  p.id_number,
  ur.role::text,
  'active',
  NULL
FROM profiles p
JOIN auth.users au ON au.id = p.id
JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role IN ('super_admin', 'admin', 'bursar', 'chaplain', 'hod', 'teacher', 'librarian', 'classteacher')
AND NOT EXISTS (
  SELECT 1 FROM staff_registry sr WHERE lower(sr.email) = lower(au.email)
);
```

### Part 2: Improve Email Lookup in RoleManagement (Code Fix)
Update `RoleManagement.tsx` to fetch emails directly from `auth.users` via the profiles join, instead of relying on `staff_registry` name matching.

**Current approach** (fragile):
- Fetches staff emails by matching `full_name` - fails if names don't match exactly

**New approach** (robust):
- Create a backend function or edge function to get user emails by profile ID
- Or store email in the profiles table directly

Since we can't query `auth.users` directly from the client, the most reliable fix is:

**Option A**: Add email column to `profiles` table and populate it when users are created
- Requires schema change
- Most reliable long-term solution

**Option B**: Create a security definer function to get emails by user_id
- Can be called from the client
- No schema changes needed

### Part 3: Improve `create-user` Edge Function (Prevention)
Update the edge function to:
1. Fail loudly if `staff_registry` insert fails (instead of silent catch)
2. Or retry the insert if it fails

## Recommended Implementation Plan

### Step 1: Add `email` column to `profiles` table
```sql
-- Add email column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- Populate from auth.users
UPDATE profiles p
SET email = au.email
FROM auth.users au
WHERE au.id = p.id AND p.email IS NULL;
```

### Step 2: Add missing staff to `staff_registry`
```sql
INSERT INTO staff_registry (email, full_name, phone, id_number, role, status)
VALUES 
  ('kedwin946@gmail.com', 'Edwin Chelimo', '0797620540', '5655178', 'super_admin', 'active'),
  ('vinnyprojects01@gmail.com', 'Vincent', '0797620540', '41362604', 'super_admin', 'active')
ON CONFLICT DO NOTHING;
```

### Step 3: Update RoleManagement.tsx
Modify the `allUsers` query to use the new `email` column from profiles instead of the fragile name-based lookup from `staff_registry`.

```typescript
// Simplified - fetch email directly from profiles
return profiles.map(profile => ({
  id: profile.id,
  full_name: profile.full_name,
  email: profile.email || '', // Direct from profiles
  phone_number: profile.phone_number,
  // ... rest
}));
```

### Step 4: Update create-user edge function
Ensure new users always get their email stored in profiles and staff_registry properly.

---

## Technical Details

### Files to Modify
| File | Changes |
|------|---------|
| Database migration | Add `email` column to `profiles`, populate from `auth.users` |
| Database migration | Insert missing Edwin & Vincent into `staff_registry` |
| `src/components/admin/RoleManagement.tsx` | Simplify email lookup to use `profiles.email` |
| `supabase/functions/create-user/index.ts` | Store email in profiles, better error handling for staff_registry |

### Database Trigger for Future Users
Create a trigger to automatically populate `profiles.email` from `auth.users`:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    NEW.email  -- Add email here
  );
  RETURN NEW;
END;
$$;
```

## Expected Outcome
After implementation:
- Edwin Chelimo and Vincent will show their emails in both tables
- All future staff will have emails displayed correctly
- Staff Registry will show all registered staff members
- No more silent failures when adding staff
