

# Fix Student Login Redirect & Sidebar Background

## Overview

Two issues to address:
1. **Quick Login not redirecting directly** - Currently sends magic link after validation; students without email access need instant login
2. **Sidebar transparent background** - The sidebar appears see-through on mobile

---

## Issue 1: Quick Login Should Directly Authenticate

### Current Flow (Problem)
```
Student enters name + password
       ↓
Edge function validates → returns email
       ↓
Frontend sends magic link to email ← THIS IS THE PROBLEM
       ↓
Student must check email to login
```

### New Flow (Solution)
```
Student enters name + password
       ↓
Edge function validates → signs in directly using admin API
       ↓
Returns session/tokens
       ↓
Frontend sets session → redirects to dashboard
```

### Technical Changes

**File: `supabase/functions/student-quick-login/index.ts`**

Update to use Supabase Admin API to generate a session directly instead of returning just the email:

```typescript
// After validating credentials, use admin API to sign in the user
const { data: authData, error: authError } = await supabaseClient.auth.admin.generateLink({
  type: 'magiclink',
  email: student.email,
  options: {
    redirectTo: `${Deno.env.get('SITE_URL')}/auth/callback?type=student`
  }
});

// Or use signInWithPassword if the student has a password set
// Better approach: Return session tokens directly
```

Actually, the cleanest solution is to use `signInWithOtp` with `shouldCreateUser: false` and have the edge function trigger the OTP which auto-confirms for verified users. BUT since students don't have passwords, we need a different approach.

**Best Solution**: Use Supabase Admin API to create a session directly:

1. Edge function validates credentials
2. Edge function uses `supabaseClient.auth.admin.generateLink({ type: 'magiclink', ... })`
3. Use the verification token to auto-login on frontend
4. Frontend receives the login link, extracts token, and completes authentication

**OR Simpler Approach**: Use the existing `signInWithOtp` but with `shouldCreateUser: false` combined with a verified email flow that auto-signs in.

**Recommended Implementation**:

Modify the edge function to return a magic link that the frontend can use to automatically authenticate (without requiring the user to check email):

```typescript
// In edge function:
const { data, error } = await supabaseClient.auth.admin.generateLink({
  type: 'magiclink',
  email: student.email,
});

// Return the hashed token for auto-login
return { 
  valid: true, 
  token_hash: data.properties.hashed_token,
  email: student.email
};
```

**File: `src/pages/MagicLinkLogin.tsx`**

Update `handleQuickLogin` to use the returned token for immediate authentication:

```typescript
const handleQuickLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setQuickLoginLoading(true);

  try {
    const { data, error } = await supabase.functions.invoke("student-quick-login", {
      body: { fullName: quickLoginName, password: quickLoginPassword }
    });

    if (error) throw new Error("Login failed. Please try again.");
    if (!data?.valid) {
      toast.error(data?.message || "Wrong password");
      return;
    }

    // Use the token to verify OTP and establish session
    const { data: session, error: verifyError } = await supabase.auth.verifyOtp({
      email: data.email,
      token: data.token_hash,
      type: 'email',
    });

    if (verifyError) throw verifyError;

    // Redirect to student portal
    navigate("/students/portal", { replace: true });
    toast.success("Welcome back!");
  } catch (error) {
    toast.error("Login failed. Please try again.");
  } finally {
    setQuickLoginLoading(false);
  }
};
```

---

## Issue 2: Sidebar Transparent Background

### Root Cause
The sidebar uses CSS variable `bg-sidebar` which maps to `--sidebar-background`. On mobile, the Sheet component needs an explicit solid background.

### Solution

**File: `src/components/students/StudentContentSidebar.tsx`**

Add explicit background color class:

```tsx
<Sidebar collapsible="icon" className="border-r bg-background">
```

**AND/OR**

**File: `src/index.css`**

Ensure the sidebar CSS variables have solid backgrounds in both light and dark mode. The current value `0 0% 98%` (which is `hsl(0, 0%, 98%)` - a very light gray) should work, but we should verify the mobile Sheet has proper styling.

The Sheet component in sidebar.tsx line 159 uses:
```tsx
className="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
```

This should already have `bg-sidebar`, but let's ensure the CSS variable is properly applied. Add a fallback:

**File: `src/components/students/StudentContentSidebar.tsx`**

```tsx
<Sidebar collapsible="icon" className="border-r !bg-card">
```

Using `!bg-card` (which is white `0 0% 100%`) ensures a solid, non-transparent background.

---

## Summary of Changes

| File | Change | Purpose |
|------|--------|---------|
| `supabase/functions/student-quick-login/index.ts` | Use admin API to generate magic link token | Enable direct authentication without email |
| `src/pages/MagicLinkLogin.tsx` | Update `handleQuickLogin` to use `verifyOtp` | Auto-login and redirect to dashboard |
| `src/components/students/StudentContentSidebar.tsx` | Add `!bg-card` or `bg-background` class | Fix transparent sidebar background |

---

## User Experience After Fix

### Quick Login Flow
1. Student enters: "Elizabeth Keen" + "KEEN314"
2. Click "Login"
3. System validates → automatically logs in
4. Redirected to Student Portal dashboard
5. No email required!

### Sidebar
- Solid white/light background on all devices
- No more see-through effect
- Proper contrast for menu items

---

## Files to Modify

1. `supabase/functions/student-quick-login/index.ts` - Add admin session generation
2. `src/pages/MagicLinkLogin.tsx` - Handle auto-login with token
3. `src/components/students/StudentContentSidebar.tsx` - Fix background color

