

# Fix Student Content Dashboard: Sidebar Toggle & Mobile Layout Issues

## Issues Identified

### Issue 1: No Visible Sidebar Toggle
**Location:** `src/pages/students/StudentContentDashboard.tsx` and `src/components/students/StudentContentSidebar.tsx`

**Problem:** The `SidebarTrigger` is placed inside the sidebar (line 42 in StudentContentSidebar.tsx), which means:
- On desktop: It's buried inside the sidebar, not prominently visible
- On mobile: The sidebar uses a Sheet component, but there's no trigger visible outside the sheet to open it

**Comparison:** In `SuperAdminDashboard.tsx`, the `SidebarTrigger` is placed in the main header (line 141), making it always visible regardless of sidebar state.

### Issue 2: No Mobile Navigation
**Location:** `src/pages/students/StudentContentDashboard.tsx`

**Problem:** On mobile devices:
- The sidebar renders as a Sheet (slide-in drawer) that starts closed
- There's no visible button/trigger in the main content area to open it
- Users cannot navigate to Programs, Student Voice, or Gallery sections

### Issue 3: Overlapping Tabs on Home Page
**Location:** `src/pages/students/StudentContentDashboard.tsx` (lines 147-156)

**Problem:** The TabsList uses:
```tsx
<TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
```

This creates a 4-column grid on small screens with 7 tabs, causing them to overlap or wrap messily. The tabs (Hero, Features, Stats, Badges, Events, Testimonials, FAQs) need to be horizontally scrollable instead.

---

## Solution

### Part 1: Move Sidebar Trigger to Main Header

Add a visible hamburger menu button in the main content header that is always accessible. This matches the pattern used in SuperAdminDashboard.

**File:** `src/pages/students/StudentContentDashboard.tsx`

**Changes:**
- Import `Menu` icon from lucide-react
- Add `SidebarTrigger` to the header (before the "Back" button or alongside it)
- Make it visible on both mobile and desktop

### Part 2: Make Tabs Horizontally Scrollable

Replace the grid layout with a horizontally scrollable flex container.

**File:** `src/pages/students/StudentContentDashboard.tsx`

**Current (line 148):**
```tsx
<TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
```

**New:**
```tsx
<TabsList className="flex w-full overflow-x-auto scrollbar-hide justify-start">
```

This allows the tabs to scroll horizontally on smaller screens instead of wrapping into multiple rows or overlapping.

### Part 3: Add Tooltip to Sidebar Menu Items

To help users understand what each icon represents when the sidebar is collapsed, add tooltips to the menu buttons.

**File:** `src/components/students/StudentContentSidebar.tsx`

**Changes:**
- Add `tooltip={item.label}` prop to `SidebarMenuButton`
- This shows the label on hover when sidebar is in icon-only mode

### Part 4: Remove Duplicate Trigger from Sidebar

Since the trigger will be in the main header, remove it from inside the sidebar to avoid confusion.

**File:** `src/components/students/StudentContentSidebar.tsx`

**Changes:**
- Remove the `SidebarTrigger` from inside the sidebar content

---

## Technical Implementation Details

### File 1: `src/pages/students/StudentContentDashboard.tsx`

**Header section updates (lines 106-123):**
```tsx
<header className="border-b bg-card px-4 sm:px-6 py-4">
  <div className="flex items-center gap-2 sm:gap-4">
    <SidebarTrigger className="h-8 w-8">
      <Menu className="h-5 w-5" />
    </SidebarTrigger>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate(-1)}
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      <span className="hidden sm:inline">Back</span>
    </Button>
    <div className="flex-1 min-w-0">
      <h1 className="text-lg sm:text-2xl font-bold truncate">
        Website Content Management
      </h1>
      <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">
        Manage Home, Programs, Student Voice, and Gallery sections
      </p>
    </div>
  </div>
</header>
```

**Home Page tabs update (line 148):**
```tsx
<TabsList className="inline-flex h-10 items-center gap-1 overflow-x-auto w-full max-w-full scrollbar-hide pb-1">
  <TabsTrigger value="hero" className="shrink-0">Hero</TabsTrigger>
  <TabsTrigger value="features" className="shrink-0">Features</TabsTrigger>
  <TabsTrigger value="stats" className="shrink-0">Stats</TabsTrigger>
  <TabsTrigger value="badges" className="shrink-0">Badges</TabsTrigger>
  <TabsTrigger value="events" className="shrink-0">Events</TabsTrigger>
  <TabsTrigger value="testimonials" className="shrink-0">Testimonials</TabsTrigger>
  <TabsTrigger value="faqs" className="shrink-0">FAQs</TabsTrigger>
</TabsList>
```

### File 2: `src/components/students/StudentContentSidebar.tsx`

**Remove internal trigger and add tooltips:**
```tsx
export const StudentContentSidebar = ({ activeSection, onSectionChange }: StudentContentSidebarProps) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        <SidebarGroup>
          {!isCollapsed && (
            <div className="px-4 py-3">
              <SidebarGroupLabel className="text-lg font-semibold">
                Website Content
              </SidebarGroupLabel>
            </div>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.id)}
                    tooltip={item.label}
                    className={cn(
                      "w-full justify-start",
                      activeSection === item.id && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span className="ml-2">{item.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
```

### File 3: `src/index.css` (optional)

Add a utility class to hide scrollbars while keeping scroll functionality:
```css
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

---

## Summary of Changes

| File | Change | Purpose |
|------|--------|---------|
| `StudentContentDashboard.tsx` | Add SidebarTrigger to header | Make sidebar toggle always visible |
| `StudentContentDashboard.tsx` | Import Menu icon | Icon for sidebar trigger |
| `StudentContentDashboard.tsx` | Change TabsList from grid to overflow-x-auto flex | Make tabs scrollable instead of overlapping |
| `StudentContentDashboard.tsx` | Add responsive text sizing | Better mobile typography |
| `StudentContentSidebar.tsx` | Remove internal SidebarTrigger | Avoid duplicate triggers |
| `StudentContentSidebar.tsx` | Add tooltip prop to SidebarMenuButton | Show labels on hover when collapsed |
| `src/index.css` | Add scrollbar-hide utility class | Clean scrollable tabs appearance |

---

## Visual Result

**Desktop:**
- Hamburger menu icon in header to toggle sidebar
- Sidebar can collapse to icon-only mode with tooltips on hover
- All tabs visible and scrollable if needed

**Mobile:**
- Hamburger menu icon prominently visible in header
- Tapping it opens sidebar as a slide-in drawer
- Users can navigate to all sections (Home, Programs, Student Voice, Gallery)
- Tabs scroll horizontally with single swipe gesture

