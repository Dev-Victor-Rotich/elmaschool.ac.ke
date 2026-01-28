
# Fix: Academic Year Results Visibility for Students

## Problem Analysis

Through database investigation, I identified **two root causes**:

### Issue 1: Exam Query Uses Current Class, Not Historical Class
**The Bug:**
When a student (e.g., Elizabeth Keen) selects 2025, the query looks for:
```sql
WHERE class_name = 'Form 3' AND year = 2025
```
But in 2025, they were in **"Grade 10"**, not "Form 3" - so the query returns **zero exams**.

**Evidence from database:**
| Student | Current Class | 2025 Exams | 2025 Results |
|---------|---------------|------------|--------------|
| Elizabeth Keen | Form 3 | Grade 10 exams (3 exams) | 20+ results |
| Nancy Anne | Form 3 | Grade 10 exams (3 exams) | 19 results |

### Issue 2: "Pending" Instead of "View Results" for 2026 Opener Exam
**The Bug:**
The 2026 "Form 3 Opener" exam exists and has 5 results, but those results are stored with `year: 2025` instead of `year: 2026`.

When filtering results by `year: 2026`, the query returns empty, so `hasResults()` returns `false`, and the button shows "Pending".

**Evidence:**
| Exam | Exam Year | Results Year | Result Count |
|------|-----------|--------------|--------------|
| Opener | 2026 | 2025 (wrong!) | 5 |
| Series 12 | 2025 | 2025 | 16 |
| Series 13 | 2025 | 2025 | 16 |

---

## Solution

### Part 1: Fix Exam Query to Use Student's Results, Not Current Class (Code Change)

**Current approach (broken):**
```typescript
// Fetches exams by current class - fails for historical years
.eq("class_name", studentClass)
.eq("year", selectedYear)
```

**New approach:**
Fetch exams based on the student's actual results for that year, not their current class. This way, if a student has results for Grade 10 exams in 2025, those exams will appear when they select 2025.

```typescript
// Step 1: Fetch distinct exam IDs from student's results for the selected year
const examIds = await supabase
  .from("academic_results")
  .select("exam_id")
  .eq("student_id", studentId)
  .eq("year", selectedYear);

// Step 2: Fetch those exams
const exams = await supabase
  .from("exams")
  .select("*")
  .in("id", examIds);
```

### Part 2: Fix Data Year Mismatch (Data Correction)

The 2026 Opener exam results have `year: 2025` instead of `year: 2026`. This needs to be corrected:

```sql
UPDATE academic_results ar
SET year = e.year
FROM exams e
WHERE ar.exam_id = e.id
AND ar.year != e.year;
```

### Part 3: Prevent Future Year Mismatches (Optional Enhancement)

Ensure that when results are entered, the `year` field is automatically derived from the exam's year rather than being set manually.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/student/AcademicAnalytics.tsx` | Change exam query to fetch by student's results, not current class |
| Database | Fix year mismatch for Opener exam results |

---

## Technical Implementation Details

### AcademicAnalytics.tsx Changes

```typescript
// BEFORE: Fetches exams by current class (fails for historical data)
const { data: exams = [] } = useQuery({
  queryKey: ["student-exams", studentClass, selectedYear],
  queryFn: async () => {
    const { data } = await supabase
      .from("exams")
      .select("*")
      .eq("class_name", studentClass)  // Problem: uses current class
      .eq("year", selectedYear);
    return data;
  },
});

// AFTER: Fetches exams based on student's actual results
const { data: exams = [] } = useQuery({
  queryKey: ["student-exams", studentId, selectedYear],
  queryFn: async () => {
    // Get distinct exam IDs from student's results for this year
    const { data: resultExamIds } = await supabase
      .from("academic_results")
      .select("exam_id")
      .eq("student_id", studentId)
      .eq("year", selectedYear);
    
    const uniqueExamIds = [...new Set(resultExamIds?.map(r => r.exam_id).filter(Boolean))];
    
    if (uniqueExamIds.length === 0) {
      // Fallback: Check for upcoming exams in current class
      const { data } = await supabase
        .from("exams")
        .select("*")
        .eq("class_name", studentClass)
        .eq("year", selectedYear);
      return data || [];
    }
    
    // Fetch exams by IDs (works for any class, past or present)
    const { data } = await supabase
      .from("exams")
      .select("*")
      .in("id", uniqueExamIds);
    return data || [];
  },
});
```

### Database Correction

```sql
-- Fix the year mismatch for Opener exam results
UPDATE academic_results 
SET year = 2026 
WHERE exam_id = 'fad054a2-e26a-45e3-a435-9a90ee217b34' 
AND year = 2025;
```

---

## Expected Outcome

After implementation:
- Students can view their 2025 Grade 10 results even though they're now in Form 3
- The 2026 Opener exam will show "View Results" instead of "Pending"
- Class teacher changes won't affect historical result visibility
- Future results will have correct year values
