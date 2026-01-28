

# Add Student Quick Login Option (Name + Password)

## Overview

Add a second login option specifically for students that allows them to log in using:
- **First Name + Last Name** (e.g., "Elizabeth Keen")
- **Password**: Last name (uppercase) + Admission Number (e.g., "KEEN314")

This provides a simpler alternative to the magic link method for students who may not have easy access to email.

---

## How It Works

1. Student enters their full name (e.g., "Elizabeth Keen")
2. Student enters password: Last name in uppercase + admission number (e.g., "KEEN314")
3. System validates against `students_data` table:
   - Checks if `full_name` matches (case-insensitive)
   - Checks if the password matches the pattern: `LASTNAME + admission_number`
4. If valid: Sign the student in using Supabase signInWithPassword (using their registered email)
5. If invalid: Show toast "Wrong password"

---

## Technical Implementation

### Part 1: Create Edge Function for Student Quick Login

**New File:** `supabase/functions/student-quick-login/index.ts`

This function will:
- Accept `fullName` and `password` 
- Parse the password to extract last name and admission number
- Validate against students_data table
- Return the student's email if valid (so frontend can sign them in)

```typescript
// Validate:
// 1. Find student by full_name
// 2. Extract last name from full_name
// 3. Check if password matches: LASTNAME + admission_number
// 4. Return student's email and user_id if valid
```

### Part 2: Update Login Page UI

**File:** `src/pages/MagicLinkLogin.tsx`

Add a new section below the magic link form for students:

```
┌─────────────────────────────────────────┐
│         Elma School, Kamonong           │
│         Secure Portal Access            │
├─────────────────────────────────────────┤
│  [Student]  [Staff]                     │
│                                         │
│  📧 Email Address                       │
│  ┌─────────────────────────────────┐   │
│  │ Enter your registered email     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [     Send Magic Link     ]            │
│                                         │
├──────────── OR ────────────────────────┤
│                                         │
│  👤 Student Quick Login                 │
│  (Login with your name and password)   │
│                                         │
│  Full Name                              │
│  ┌─────────────────────────────────┐   │
│  │ e.g., Elizabeth Keen           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Password                               │
│  ┌─────────────────────────────────┐   │
│  │ e.g., KEEN314                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [     Login     ]                      │
│                                         │
│  ℹ️ Password = Last Name (CAPS) +       │
│     Admission Number                    │
└─────────────────────────────────────────┘
```

### Part 3: Implement Quick Login Logic

When student submits quick login form:

1. Call edge function `student-quick-login` with `fullName` and `password`
2. Edge function validates:
   - Find student by `full_name` (case-insensitive)
   - Check if student is approved (`approval_status = 'approved'`)
   - Extract last name from `full_name` (last word)
   - Compare password with `LASTNAME.toUpperCase() + admission_number`
3. If valid: Return student's email and user_id
4. Frontend signs in using `signInWithPassword` with the email
5. If invalid: Show toast "Wrong password"

---

## Edge Function Logic

```typescript
// Example: Elizabeth Keen, admission 314
// fullName = "Elizabeth Keen"
// password = "KEEN314"

// Step 1: Find student
const student = await supabase
  .from('students_data')
  .select('id, full_name, admission_number, email, user_id, approval_status')
  .ilike('full_name', fullName)
  .eq('approval_status', 'approved')
  .maybeSingle();

// Step 2: Extract last name
const nameParts = student.full_name.trim().split(' ');
const lastName = nameParts[nameParts.length - 1].toUpperCase();

// Step 3: Build expected password
const expectedPassword = lastName + student.admission_number;

// Step 4: Compare
if (password.toUpperCase() === expectedPassword) {
  return { valid: true, email: student.email, userId: student.user_id };
} else {
  return { valid: false, message: 'Wrong password' };
}
```

---

## Security Considerations

1. **Rate Limiting**: The edge function should be protected against brute force attacks
2. **Case Insensitive**: Name matching is case-insensitive, but password comparison is case-sensitive (must be uppercase)
3. **Approved Only**: Only students with `approval_status = 'approved'` can login
4. **No Password Storage**: We're using existing data (name + admission number) as a simple credential, no new password column needed

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/student-quick-login/index.ts` | Create | Validate student credentials |
| `src/pages/MagicLinkLogin.tsx` | Modify | Add quick login form UI |

---

## UI Visibility

- The "Student Quick Login" section is **only visible when "Student" is selected** (not for Staff)
- This provides a clear separation between staff (magic link only) and students (magic link OR quick login)

---

## Error Messages

| Scenario | Toast Message |
|----------|---------------|
| Student not found | "Student not found. Please check your name." |
| Wrong password | "Wrong password" |
| Student not approved | "Your account is pending approval" |
| Server error | "Login failed. Please try again." |

