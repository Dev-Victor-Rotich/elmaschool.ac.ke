
# Hide Tab Navigation & Add Menu Icons

## Overview

Modify both the **Fee Details** and **Academic Analytics** sections to:
- Remove visible tab navigation buttons
- Show only the currently selected view content
- Access different views through dropdown menu only

---

## Changes Required

### 1. Fee Details Card (Portal.tsx)

**Current behavior**: Shows both dropdown menu AND TabsList with all 3 tabs visible

**New behavior**: 
- Remove the `TabsList` component entirely
- Keep only the `TabsContent` sections
- Menu icon dropdown is the only way to switch views
- Show a label indicating current view (e.g., "Overview") in the header

**Implementation**:
- Delete lines 534-547 (the `TabsList` and its `TabsTrigger` children)
- Add current view label next to the title

### 2. Academic Analytics Card (AcademicAnalytics.tsx)

**Current behavior**: Shows TabsList with My Exams, Performance Trends, Insights tabs

**New behavior**:
- Add state for controlled tab: `const [activeTab, setActiveTab] = useState("exams")`
- Add dropdown menu with MoreVertical icon in card header
- Remove the visible `TabsList`
- Keep only `TabsContent` sections

**Implementation**:
- Import `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuTrigger` from dropdown-menu
- Import `MoreVertical` icon from lucide-react
- Import `Button` component
- Add `activeTab` state
- Add dropdown menu in header (between year selector and title)
- Convert `Tabs` to controlled with `value={activeTab}`
- Remove `TabsList` component (lines 177-193)

---

## Visual Comparison

### Before (Fee Details)
```
+--------------------------------------------------+
| Fee Details - 2025                    [menu icon]|
| View your payment history...                     |
+--------------------------------------------------+
| [Overview] [Payment History] [Fee Structure]     |  <-- REMOVE THIS
+--------------------------------------------------+
| Content...                                       |
+--------------------------------------------------+
```

### After (Fee Details)
```
+--------------------------------------------------+
| Fee Details - 2025 | Overview         [menu icon]|
| View your payment history...                     |
+--------------------------------------------------+
| Content...                                       |
+--------------------------------------------------+
```

### After (Academic Analytics)
```
+--------------------------------------------------+
| Academic Analytics | My Exams         [menu icon]|
| Track your exams...               [Year: 2025]   |
+--------------------------------------------------+
| Content...                                       |
+--------------------------------------------------+
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/students/Portal.tsx` | Remove TabsList from Fee Details, add current view badge |
| `src/components/student/AcademicAnalytics.tsx` | Add DropdownMenu, remove TabsList, add controlled state |

---

## Technical Details

### Portal.tsx Changes

1. Add a helper to get current tab label:
```typescript
const getFeeTabLabel = () => {
  switch (feeTab) {
    case "overview": return "Overview";
    case "history": return "Payment History";
    case "structure": return "Fee Structure";
    default: return "Overview";
  }
};
```

2. Add current view badge in header next to title
3. Remove lines 534-547 (TabsList)

### AcademicAnalytics.tsx Changes

1. Add imports:
```typescript
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
```

2. Add state:
```typescript
const [activeTab, setActiveTab] = useState("exams");
```

3. Add helper for tab label:
```typescript
const getTabLabel = () => {
  switch (activeTab) {
    case "exams": return "My Exams";
    case "trends": return "Performance Trends";
    case "insights": return "Insights & Predictions";
    default: return "My Exams";
  }
};
```

4. Add dropdown in CardHeader with menu items for each view
5. Remove TabsList (lines 177-193)
6. Change Tabs to controlled: `value={activeTab} onValueChange={setActiveTab}`
