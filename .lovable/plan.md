
# Academic Year Results: Historical View & Edit Access

## Problem Summary

There are **three key issues** to address:

1. **Student Dashboard - Exam Info Card**: When viewing results, the first card shows `studentClass` (current class like "Form 3") instead of the exam's actual class (e.g., "Grade 10" for a 2025 exam)

2. **Class Teacher Dashboard - Historical Exams Not Visible**: The ExamsManager only queries exams for the current `assignedClass`. This means a class teacher for "Form 3" cannot see "Grade 10" exams from 2025, even if their current students have results from that class

3. **Class Teacher & Teacher - No Edit Privileges for Historical Results**: The current architecture assumes only the class teacher of the exact class can edit results. When students progress to a new class with a new class teacher, the previous results become "orphaned" from an editing perspective

---

## Solution Overview

### Part 1: Fix Student Exam Info Card

**Current behavior:**
```tsx
<CardDescription>Term {exam.term}, {exam.year} | {studentClass}</CardDescription>
```
This displays the student's **current** class, not the class the exam belongs to.

**Fix:** Use `exam.class_name` instead of `studentClass`:
```tsx
<CardDescription>Term {exam.term}, {exam.year} | {exam.class_name}</CardDescription>
```

### Part 2: Class Teacher - View Historical Exams

**Current behavior:**
The `ExamsManager` component queries exams only for the teacher's assigned class:
```tsx
.eq("class_name", assignedClass)
```

**Solution:**
Create a new component or modify the existing one to allow class teachers to view exams based on:
1. Their students' historical results (any exam their current students have results for)
2. Add academic year filtering to the Exams tab

This will require:
- Modifying the Academics tab in ClassTeacherPortal to include an academic year selector
- Creating a query that fetches exams based on students' historical results (similar to what we did for the student portal)

### Part 3: Class Teacher & Teacher - Edit Historical Results

**Current behavior:**
RLS policies on `academic_results` allow editing based on:
- `teacher_id = auth.uid()` (teacher who entered the result)
- `has_role(auth.uid(), 'classteacher')` (any classteacher can edit)
- `has_teaching_assignment_for_class()` (staff with teaching assignments)

The problem is the ExamResultsMatrix loads students from the **current** class, not the historical class.

**Solution:**
When viewing a historical exam (e.g., "Grade 10 Opener 2025"):
- Fetch students based on the exam's `class_name` from `academic_results` (who has results for that exam)
- Allow the current class teacher to edit all results for their current students, regardless of which class the exam belonged to

---

## Technical Implementation

### File Changes

| File | Change |
|------|--------|
| `src/components/student/ExamResultsView.tsx` | Use `exam.class_name` in the header card instead of `studentClass` |
| `src/components/classteacher/ExamsManager.tsx` | Add year filtering and ability to view exams from historical classes |
| `src/pages/staff/ClassTeacherPortal.tsx` | Pass academic year selector to ExamsManager |
| `src/components/classteacher/ExamResultsMatrix.tsx` | Support viewing students from historical exams (not just current class) |
| `src/components/staff/MyClassesManager.tsx` | Add academic year selector for teachers to view historical results |
| `src/components/teacher/TeacherExamResults.tsx` | Support viewing/editing historical exam results |

---

### Detailed Changes

#### 1. ExamResultsView.tsx (Student Dashboard)
Change line 498 from:
```tsx
<CardDescription>Term {exam.term}, {exam.year} | {studentClass}</CardDescription>
```
To:
```tsx
<CardDescription>Term {exam.term}, {exam.year} | {exam.class_name}</CardDescription>
```

#### 2. ExamsManager.tsx (Class Teacher - View Historical Exams)
Modify the exams query to support viewing exams from any class where students have results:

```typescript
// Add state for selected academic year
const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

// Modify exams query to include historical exams
const { data: exams = [] } = useQuery({
  queryKey: ["class-exams-all", assignedClass, selectedYear],
  queryFn: async () => {
    // Step 1: Get current students
    const { data: students } = await supabase
      .from("students_data")
      .select("id")
      .eq("class", assignedClass);
    
    if (!students || students.length === 0) return [];
    const studentIds = students.map(s => s.id);
    
    // Step 2: Get exam IDs from students' results for selected year
    const { data: resultExamIds } = await supabase
      .from("academic_results")
      .select("exam_id")
      .in("student_id", studentIds)
      .eq("year", selectedYear);
    
    const uniqueExamIds = [...new Set(resultExamIds?.map(r => r.exam_id).filter(Boolean))];
    
    // Step 3: Fetch current class exams for selected year
    const { data: currentClassExams } = await supabase
      .from("exams")
      .select("*")
      .eq("class_name", assignedClass)
      .eq("year", selectedYear);
    
    // Step 4: Fetch historical exams by IDs (if any)
    let historicalExams = [];
    if (uniqueExamIds.length > 0) {
      const { data } = await supabase
        .from("exams")
        .select("*")
        .in("id", uniqueExamIds);
      historicalExams = data || [];
    }
    
    // Merge and deduplicate
    const allExams = [...(currentClassExams || []), ...historicalExams];
    const uniqueExams = allExams.reduce((acc, exam) => {
      if (!acc.find(e => e.id === exam.id)) acc.push(exam);
      return acc;
    }, []);
    
    return uniqueExams.sort((a, b) => 
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );
  },
  enabled: !!assignedClass,
});
```

#### 3. ExamResultsMatrix.tsx (Class Teacher - View/Edit Historical Results)
When viewing a historical exam, fetch students who have results for that exam rather than filtering by current class:

```typescript
// Modify students query to support historical exams
const { data: students = [] } = useQuery({
  queryKey: ["exam-students", exam.id, exam.class_name, assignedClass],
  queryFn: async () => {
    // For exams matching current class, use normal query
    if (exam.class_name === assignedClass) {
      const { data } = await supabase
        .from("students_data")
        .select("id, full_name, admission_number")
        .eq("class", assignedClass)
        .order("full_name");
      return data || [];
    }
    
    // For historical exams, get students who have results for this exam
    // AND are currently in the teacher's class
    const { data: currentStudents } = await supabase
      .from("students_data")
      .select("id, full_name, admission_number")
      .eq("class", assignedClass);
    
    if (!currentStudents || currentStudents.length === 0) return [];
    
    const studentIds = currentStudents.map(s => s.id);
    
    // Check which of these students have results for this exam
    const { data: resultsCheck } = await supabase
      .from("academic_results")
      .select("student_id")
      .eq("exam_id", exam.id)
      .in("student_id", studentIds);
    
    const studentsWithResults = new Set(resultsCheck?.map(r => r.student_id) || []);
    
    return currentStudents.filter(s => studentsWithResults.has(s.id));
  },
});
```

#### 4. MyClassesManager.tsx (Teacher Portal - Academic Year Support)
Add academic year selector to allow teachers to view their results across different years:

```typescript
// Add state for year selection
const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

// Modify exams query to filter by year
const { data: exams = [] } = useQuery({
  queryKey: ['class-exams', selectedClass, selectedYear],
  queryFn: async () => {
    if (!selectedClass) return [];
    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('class_name', selectedClass)
      .eq('year', selectedYear)
      .order('start_date', { ascending: false });
    return data || [];
  },
  enabled: !!selectedClass && !!selectedSubject
});
```

---

## RLS Considerations

The current RLS policies on `academic_results` already support this:

```sql
-- Existing policy allows classteachers to edit
has_role(auth.uid(), 'classteacher')

-- Existing policy allows teachers who entered the result
teacher_id = auth.uid()
```

No RLS changes are needed as long as:
- Class teachers query students from their assigned class
- The edit modal works through the existing mutation patterns

---

## UI/UX Improvements

1. **Historical Exam Badge**: Show a badge on historical exams indicating they're from a previous class:
   ```tsx
   {exam.class_name !== assignedClass && (
     <Badge variant="outline" className="text-xs">
       Historical ({exam.class_name})
     </Badge>
   )}
   ```

2. **Year Selector in Exams Tab**: Add the `AcademicYearSelector` component to the Exams tab header

3. **Clear Messaging**: When viewing historical results, show a message explaining that these are results from when students were in a different class

---

## Expected Outcome

After implementation:

- **Students**: See the correct class name (e.g., "Grade 10") when viewing 2025 exam results, not their current class
- **Class Teachers**: Can select academic years and view all exams their current students participated in, including historical classes
- **Class Teachers**: Can edit historical results for their current students (acting as "previous class teacher")
- **Teachers**: Can view and edit results across different academic years through the year selector

---

## Files Summary

| Priority | File | Changes |
|----------|------|---------|
| 1 | `ExamResultsView.tsx` | Use `exam.class_name` in header |
| 2 | `ExamsManager.tsx` | Add year selector, fetch historical exams based on student results |
| 3 | `ExamResultsMatrix.tsx` | Support viewing students from historical exams |
| 4 | `MyClassesManager.tsx` | Add year filtering for teachers |
| 5 | `ClassTeacherPortal.tsx` | Wire up year selection prop |
