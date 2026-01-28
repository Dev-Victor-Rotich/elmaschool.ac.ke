
# Fix Student Portal Header: Mobile Layout and Button Styling

## Problems Identified

1. **White Buttons on Blue Background**: The "Edit Profile" and "Website Content" buttons use `variant="outline"` which has a white background and dark text on the primary (blue) header. The text is nearly invisible until hover.

2. **Duplicate Actions**: The header contains "Edit Profile" and "Logout" buttons, but these same actions are already accessible via the avatar menu in the Navigation component.

3. **Messy Mobile Layout**: The header uses `flex justify-between items-center` without responsive breakpoints, causing buttons to overlap and appear disorganized on mobile screens.

---

## Solution

### Part 1: Remove Duplicate Buttons

Remove the "Edit Profile" and "Logout" buttons from the header since they're already accessible via the avatar dropdown in the Navigation component. Keep only the "Website Content" button for Student Leaders as it provides unique functionality not duplicated elsewhere.

### Part 2: Fix Button Visibility

Change the "Website Content" button from `variant="outline"` to `variant="secondary"` (which uses the gold/amber color and will be visible on the blue background).

### Part 3: Improve Mobile Layout

Add responsive classes to the header to:
- Stack content vertically on mobile (`flex-col` on small screens)
- Center-align items on mobile
- Reduce font sizes and padding on mobile
- Hide the button text on very small screens (icon-only)

---

## Technical Changes

### File: `src/pages/students/Portal.tsx`

**Current Code (lines 322-348):**
```tsx
<header className="border-b bg-primary text-primary-foreground">
  <div className="container mx-auto px-4 py-6">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold">{studentData.full_name}</h1>
        <p className="text-sm opacity-90">
          {studentData.class} • Admission: {studentData.admission_number}
          {isStudentLeader && <Badge variant="secondary" className="ml-2">Student Leader</Badge>}
        </p>
      </div>
      <div className="flex gap-2">
        {isStudentLeader && (
          <Button onClick={() => navigate("/students/content-dashboard")} variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Website Content
          </Button>
        )}
        <Button onClick={() => navigate("/profile")} variant="outline">
          Edit Profile
        </Button>
        <Button onClick={handleLogout} variant="secondary">
          Logout
        </Button>
      </div>
    </div>
  </div>
</header>
```

**New Code:**
```tsx
<header className="border-b bg-primary text-primary-foreground">
  <div className="container mx-auto px-4 py-4 md:py-6">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
          {studentData.full_name}
        </h1>
        <p className="text-xs sm:text-sm opacity-90 flex flex-wrap items-center gap-1">
          <span>{studentData.class}</span>
          <span>•</span>
          <span>Adm: {studentData.admission_number}</span>
          {isStudentLeader && (
            <Badge variant="secondary" className="ml-1">
              Student Leader
            </Badge>
          )}
        </p>
      </div>
      {isStudentLeader && (
        <Button 
          onClick={() => navigate("/students/content-dashboard")} 
          variant="secondary"
          size="sm"
          className="whitespace-nowrap"
        >
          <Edit className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Website Content</span>
        </Button>
      )}
    </div>
  </div>
</header>
```

---

## Key Changes Summary

| Change | Before | After |
|--------|--------|-------|
| Edit Profile button | In header | Removed (use avatar menu) |
| Logout button | In header | Removed (use avatar menu) |
| Website Content button | `variant="outline"` (invisible) | `variant="secondary"` (gold, visible) |
| Header layout | Fixed `flex` | Responsive `flex-col sm:flex-row` |
| Name text size | `text-3xl` | `text-xl sm:text-2xl md:text-3xl` |
| Button text on mobile | Always visible | Icon-only on small screens |
| Admission label | "Admission:" | "Adm:" (shorter) |

---

## Visual Result

**Desktop:**
- Student name, class info, and badge on the left
- Gold "Website Content" button on the right (for Student Leaders)
- Clean, single-line layout

**Mobile:**
- Student info stacks above the button
- Smaller text sizes for better fit
- Button shows icon only on very small screens
- No duplicate actions cluttering the header

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/students/Portal.tsx` | Update header section with responsive layout and remove duplicate buttons |

---

## Note

The user can still access:
- **Edit Profile**: Via avatar menu in Navigation → "Profile"
- **Logout**: Via avatar menu in Navigation → "Logout"
- **Dashboard**: Via avatar menu in Navigation → "Dashboard"

This eliminates redundancy while keeping the unique "Website Content" button for Student Leaders prominently visible with proper styling.
