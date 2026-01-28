

# Student Leader & Class Rep Website Content Editing Privileges

## Overview

This plan adds the ability for **Student Leaders** and **Class Reps** to edit specific sections of the website content through their dedicated dashboards. They will have access to manage:

- **Home Page** (Hero, Features, Stats, Trust Badges, Events, Testimonials, FAQs, CTA Banner)
- **Programs** (Leadership Programs, Student Leaders, Clubs)
- **Student Voice** (Student Ambassador, Clubs & Societies, Previous Student Leaders)
- **Gallery** (Images and Videos)

This matches the user request while keeping sensitive areas (About Page, Admissions, Contact, User Management) restricted to Super Admins only.

---

## Solution Architecture

### Part 1: Database RLS Policy Updates

Currently, all content management tables only allow `super_admin` role to INSERT, UPDATE, and DELETE. We need to add RLS policies that also allow `student_leader` and `class_rep` roles.

**Tables requiring RLS updates:**

| Table | Current Access | New Access |
|-------|---------------|------------|
| `gallery_media` | super_admin only | + student_leader, class_rep |
| `hero_content` | super_admin only | + student_leader, class_rep |
| `home_features` | super_admin only | + student_leader, class_rep |
| `site_stats` | super_admin only | + student_leader, class_rep |
| `trust_badges` | super_admin only | + student_leader, class_rep |
| `events` | super_admin only | + student_leader, class_rep |
| `community_testimonials` | super_admin only | + student_leader, class_rep |
| `faqs` | super_admin only | + student_leader, class_rep |
| `cta_banner` | super_admin only | 
| `subjects` | super_admin only |
| `departments` | super_admin only | 
| `department_staff` | super_admin only |
| `leadership_programs` | super_admin only | + student_leader, class_rep |
| `program_members` | super_admin only | + student_leader, class_rep |
| `beyond_classroom` | super_admin only | + student_leader, class_rep |
| `student_ambassador` | super_admin only | + student_leader, class_rep |
| `clubs_societies` | super_admin only | + student_leader, class_rep |
| `previous_leaders` | super_admin only | + student_leader, class_rep |

### Part 2: New Student Content Dashboard Component

Create a new component that provides a streamlined content management interface for Student Leaders and Class Reps, reusing the existing manager components.

**New File:** `src/pages/students/StudentContentDashboard.tsx`

This component will:
- Provide a sidebar navigation similar to AdminSidebar but with only the allowed sections
- Render the appropriate content managers (HomeContentManager, GalleryManager, etc.)
- Include proper authentication and role checks

### Part 3: Update Student Leader Portal

Modify `src/pages/students/Portal.tsx` to add a "Website Content" tab that links to the content management features for Student Leaders.

### Part 4: Update Class Rep Portal

Modify `src/pages/students/ClassRepPortal.tsx` to add a "Website Content" tab for Class Reps.

---

## Technical Implementation

### Database Migration (RLS Policies)

```sql
-- Create helper function for student content editors
CREATE OR REPLACE FUNCTION public.is_student_content_editor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('student_leader', 'class_rep')
  )
$$;

-- Add policies for each table (example for gallery_media)
CREATE POLICY "Student leaders can manage gallery media"
ON public.gallery_media
FOR ALL
TO authenticated
USING (is_student_content_editor(auth.uid()))
WITH CHECK (is_student_content_editor(auth.uid()));
```

This pattern will be applied to all 18 tables listed above.

### New Components

#### 1. StudentContentSidebar Component
A simplified sidebar showing only the allowed content sections:
- Home Page
- Programs
- Student Voice
- Gallery

#### 2. StudentContentDashboard Component
Main dashboard layout with:
- Sidebar navigation
- Content area that renders the appropriate manager components
- Hash-based routing (similar to SuperAdminDashboard)

### Portal Updates

#### Student Leader Portal
Add a new card or button that navigates to `/students/content-dashboard`:
```tsx
{isStudentLeader && (
  <Card className="cursor-pointer" onClick={() => navigate('/students/content-dashboard')}>
    <CardHeader>
      <CardTitle>Website Content</CardTitle>
      <CardDescription>Manage website content (Home, Programs, Student Voice, Gallery)</CardDescription>
    </CardHeader>
  </Card>
)}
```

#### Class Rep Portal
Add a new tab for Website Content:
```tsx
<TabsTrigger value="content">
  <Edit className="w-4 h-4 mr-2" />
  Website Content
</TabsTrigger>
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/...` | Create | RLS policies for student content editors |
| `src/pages/students/StudentContentDashboard.tsx` | Create | New content management dashboard |
| `src/components/students/StudentContentSidebar.tsx` | Create | Sidebar for student content editors |
| `src/pages/students/Portal.tsx` | Modify | Add link to content dashboard for student leaders |
| `src/pages/students/ClassRepPortal.tsx` | Modify | Add Website Content tab |
| `src/App.tsx` | Modify | Add route for `/students/content-dashboard` |
| `src/components/ProtectedRoute.tsx` | Possibly Modify | Allow student_leader and class_rep access to content dashboard |

---

## Security Considerations

1. **RLS Policies**: All changes are enforced at the database level through RLS policies, ensuring student leaders cannot access tables they shouldn't even if frontend is bypassed.

2. **Role Verification**: The new dashboard will verify the user has `student_leader` or `class_rep` role before rendering content management tools.

3. **Separation of Concerns**: Sensitive sections (Admissions, Contact, User Management, Audit Logs) remain Super Admin only.

4. **Impersonation Support**: Super Admin impersonation will continue to work, allowing admins to test the student content dashboard.

---

## UI/UX Design

The Student Content Dashboard will have a clean, focused interface:

```text
+------------------+----------------------------------------+
|  Student Content |                                        |
|    Dashboard     |                                        |
+------------------+                                        |
| [Home Page]      |     [Content Manager Component]       |
| [Programs]       |                                        |
| [Student Voice]  |                                        |
| [Gallery]        |                                        |
+------------------+----------------------------------------+
```

Navigation uses hash-based routing:
- `#home` - HomeContentManager (without Duty Roster and School Occasions)
- `#programs` - Leadership programs, clubs, departments
- `#student` - Student Ambassador, Previous Leaders
- `#gallery` - GalleryManager

---

## Expected Outcome

After implementation:
- Student Leaders can access a dedicated content dashboard from their portal
- Class Reps can access website content management from a new tab in their portal
- Both roles can manage: Home Page, Programs, Student Voice, and Gallery sections
- Super Admin retains full access and can monitor changes through audit logs
- All changes are enforced at the database level for security

