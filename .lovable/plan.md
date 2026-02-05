
# Clubs Organization System - Implementation Plan

## Overview
This plan implements a full-featured Clubs & Organizations system where teachers and super admins can create clubs, patrons manage membership, and students access their club spaces through their portal with communication features.

---

## Phase 1: Database Schema

### 1.1 Modify `clubs_societies` Table
Add columns to support patron management and customizable features:

| Column | Type | Purpose |
|--------|------|---------|
| `patron_id` | uuid | Links to the teacher/staff managing the club |
| `features` | jsonb | Configurable modules: `{"feed": true, "gallery": true, "events": true, "resources": true}` |
| `is_active` | boolean | Enable/disable club visibility |
| `meeting_schedule` | text | Optional meeting time info |
| `motto` | text | Club tagline/motto |

### 1.2 Create `club_members` Table
Tracks which students belong to which clubs:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | Primary key |
| `club_id` | uuid | Foreign key to clubs_societies |
| `student_id` | uuid | Foreign key to students_data |
| `role` | text | 'member', 'chairperson', 'secretary', 'treasurer' |
| `joined_at` | timestamptz | When student was added |
| `added_by` | uuid | The patron who added them |

### 1.3 Create `club_posts` Table
The communication feed for each club:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | Primary key |
| `club_id` | uuid | Which club this post belongs to |
| `author_id` | uuid | User who created the post |
| `author_type` | text | 'patron' or 'student' |
| `content` | text | The post message |
| `image_url` | text | Optional attached image |
| `is_pinned` | boolean | Pin important announcements |
| `created_at` | timestamptz | Post timestamp |

### 1.4 Create `club_comments` Table
Threaded comments on posts:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | Primary key |
| `post_id` | uuid | Foreign key to club_posts |
| `author_id` | uuid | User who commented |
| `author_type` | text | 'patron' or 'student' |
| `content` | text | Comment text |
| `created_at` | timestamptz | Comment timestamp |

### 1.5 Row Level Security (RLS) Policies

**clubs_societies:**
- Anyone authenticated can view active clubs
- Super admins and teachers can create clubs
- Patron and super admins can update their clubs

**club_members:**
- Patron of the club can add/remove members
- Super admins have full access
- Students can view their own memberships

**club_posts:**
- Only club members and patron can view posts
- Members and patron can create posts
- Authors can edit/delete their own posts

**club_comments:**
- Only club members and patron can view/create comments
- Authors can delete their own comments

---

## Phase 2: Backend Functions

### 2.1 Helper Database Functions

```text
is_club_patron(user_id, club_id) -> boolean
  Returns true if user is the patron of the specified club

is_club_member(user_id, club_id) -> boolean  
  Returns true if user (via students_data link) is a member of the club

get_student_id_from_user(user_id) -> uuid
  Helper to get student_id from user's auth id
```

---

## Phase 3: Admin & Teacher Interface

### 3.1 Enhanced ClubsSocietiesManager
Update existing component (`src/components/admin/ClubsSocietiesManager.tsx`):
- Add patron selection dropdown (list of teachers from staff_registry)
- Add feature toggles for feed, gallery, events, resources
- Add motto and meeting schedule fields
- Show patron name in the clubs list table

### 3.2 New: ClubManagementPortal Component
Create `src/components/staff/ClubManagementPortal.tsx`:

**Tabs:**
1. **Dashboard** - Club overview, member count, recent activity
2. **Members** - Add/remove students, assign roles (chair, secretary, etc.)
3. **Feed** - View and create posts, pin announcements
4. **Settings** - Edit club details, toggle features

**Member Management Flow:**
- Search students by name or admission number
- Select and add to club with optional role
- Bulk add students from a class
- Remove members with confirmation

### 3.3 Teacher Portal Integration
Add "My Clubs" section to `src/pages/staff/TeacherPortal.tsx`:
- List clubs where teacher is patron
- Quick link to manage each club
- Show member count and recent activity badge

---

## Phase 4: Student Portal Integration

### 4.1 "My Clubs" Section
Add to `src/pages/students/Portal.tsx`:

```text
New Card: "My Clubs"
- Icon: Users or Sparkles
- Lists all clubs the student is a member of
- Shows role badge if they have a special role
- Click to enter club space
- Empty state: "You haven't joined any clubs yet"
```

### 4.2 Club Space Page
Create `src/pages/students/ClubSpace.tsx`:

**Header:**
- Club name, image, motto
- Patron info
- Meeting schedule (if set)

**Navigation (based on enabled features):**
- Feed (default view)
- Members (view-only directory)
- Gallery (if enabled)
- Events (if enabled)

**Feed View:**
- Posts displayed as cards with author, timestamp
- Create post form (text + optional image)
- Comments section expandable under each post
- Pinned posts shown at top

### 4.3 Route Addition
Add to `src/App.tsx`:
```text
/students/clubs/:clubId -> ClubSpace component
```

---

## Phase 5: Communication Features

### 5.1 ClubFeed Component
Create `src/components/clubs/ClubFeed.tsx`:
- Infinite scroll or paginated post list
- Post creation form with:
  - Text area for content
  - Image upload (using existing ImageUploader)
  - Submit button
- Each post shows:
  - Author avatar placeholder or initials
  - Author name and role
  - Timestamp (relative: "2 hours ago")
  - Content
  - Comment count
  - Expand/collapse comments

### 5.2 ClubComments Component
Create `src/components/clubs/ClubComments.tsx`:
- List comments under a post
- Simple input to add new comment
- Delete own comments option

### 5.3 Real-time Updates (Optional Enhancement)
Enable Supabase Realtime on club_posts and club_comments tables for live updates when new posts/comments arrive.

---

## Phase 6: Versatile Structure Implementation

### 6.1 Feature Configuration
The `features` JSONB column allows patrons to customize:

```json
{
  "feed": true,      // Communication posts
  "gallery": true,   // Photo gallery
  "events": true,    // Club-specific events
  "resources": true  // Shared documents/links
}
```

### 6.2 Dynamic UI Rendering
Club space UI conditionally renders sections based on features:
- Hide tabs/sections when feature is disabled
- Patron can toggle features in settings
- Defaults: feed enabled, others optional

### 6.3 Role-Based Permissions in Club
Student roles within club (configurable by patron):
- **Chairperson**: Can pin posts, has special badge
- **Secretary**: Displayed prominently in member list
- **Treasurer**: Role badge, no special permissions yet
- **Member**: Standard posting/commenting rights

---

## File Structure Summary

```text
src/
  components/
    clubs/
      ClubFeed.tsx              # Post feed with comments
      ClubComments.tsx          # Comments component
      ClubMemberManager.tsx     # Add/remove members (patron)
      ClubMemberDirectory.tsx   # View-only member list
      ClubSettings.tsx          # Patron settings panel
      ClubPostCard.tsx          # Individual post display
    staff/
      ClubManagementPortal.tsx  # Full patron management UI
    admin/
      ClubsSocietiesManager.tsx # (updated) Add patron selection
  pages/
    students/
      ClubSpace.tsx             # Student club access page
```

---

## Database Migration SQL Overview

```text
1. ALTER clubs_societies ADD columns:
   - patron_id, features, is_active, meeting_schedule, motto

2. CREATE TABLE club_members (
   id, club_id, student_id, role, joined_at, added_by
   )

3. CREATE TABLE club_posts (
   id, club_id, author_id, author_type, content, 
   image_url, is_pinned, created_at
   )

4. CREATE TABLE club_comments (
   id, post_id, author_id, author_type, content, created_at
   )

5. CREATE helper functions:
   - is_club_patron()
   - is_club_member()
   - get_student_id_from_user()

6. CREATE RLS policies for all new tables

7. Enable realtime: ALTER PUBLICATION supabase_realtime 
   ADD TABLE club_posts, club_comments;
```

---

## User Flow Summary

```text
SETUP FLOW:
Super Admin/Teacher -> Create Club -> Assign Patron -> Set Features

PATRON FLOW:
Login -> Teacher Portal -> My Clubs -> Select Club
-> Members Tab -> Search & Add Students -> Assign Roles
-> Feed Tab -> Create Announcements -> Pin Important Posts

STUDENT FLOW:
Login -> Student Portal -> My Clubs Card -> See Club List
-> Click Club -> Enter Club Space -> View Feed
-> Create Posts -> Comment on Posts -> View Members
```

---

## Technical Considerations

1. **Image Uploads**: Reuse existing `ImageUploader` component with "clubs" folder in general-assets bucket
2. **Pagination**: Implement cursor-based pagination for posts (limit 20 per load)
3. **Notifications**: Future enhancement - notify members of new posts
4. **Mobile Responsive**: All club UI components must work on mobile devices
5. **Performance**: Index club_id on posts and comments tables for fast queries
