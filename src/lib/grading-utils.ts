// Grading utility functions for 8-4-4 and CBC systems

// Subject category definitions for 8-4-4 system
export const SCIENCES = ["biology", "chemistry", "physics"];
export const TECHNICAL_APPLIED = ["agriculture", "home science", "computer studies", "business studies", "computer"];
export const HUMANITIES = ["history", "geography"];
export const RELIGIOUS = ["c.r.e", "i.r.e", "h.r.e", "cre", "ire", "hre", "christian religious education", "islamic religious education", "hindu religious education"];
export const CORE = ["english", "kiswahili", "mathematics", "maths"];
export const HUMANITIES_RELIGIOUS = [...HUMANITIES, ...RELIGIOUS];

// Check if class follows 8-4-4 system (Form 3, Form 4)
export function is844Class(className: string): boolean {
  return /^Form\s*(3|4)$/i.test(className.trim());
}

// Check if class follows CBC system (Grade 10, 11, 12)
export function isCBCClass(className: string): boolean {
  return /^Grade\s*(10|11|12)$/i.test(className.trim());
}

// Check if class uses 7-subject points calculation (Form 3, 4 and Grade 10, 11, 12)
export function uses7SubjectCalculation(className: string): boolean {
  return is844Class(className) || isCBCClass(className);
}

// Category type
type SubjectCategory = "sciences" | "technical" | "humanities" | "religious" | "core" | "other";

// Get subject category - uses subSubject for accurate matching
function getSubjectCategory(subjectTitle: string, subSubject: string): SubjectCategory {
  // Use subSubject if available, otherwise fall back to subjectTitle
  const name = (subSubject || subjectTitle).trim().toLowerCase();
  
  // Check core subjects first (English, Kiswahili, Maths)
  if (CORE.some(c => name === c || name.includes(c))) {
    return "core";
  }
  
  // Check sciences (Biology, Chemistry, Physics)
  if (SCIENCES.some(s => name === s || name.includes(s))) {
    return "sciences";
  }
  
  // Check technical/applied (Agriculture, Home Science, Computer Studies, Business Studies)
  if (TECHNICAL_APPLIED.some(t => name === t || name.includes(t))) {
    return "technical";
  }
  
  // Check humanities (History, Geography)
  if (HUMANITIES.some(h => name === h || name.includes(h))) {
    return "humanities";
  }
  
  // Check religious (CRE, IRE, HRE variants)
  if (RELIGIOUS.some(r => name === r || name.includes(r))) {
    return "religious";
  }
  
  // Default to "other" for unrecognized subjects
  return "other";
}

// Result type for subject with points
interface SubjectResult {
  subjectTitle: string;
  subSubject: string;
  points: number;
  marks: number;
  category: SubjectCategory;
}

// Calculate 7-best-subjects points for 8-4-4/CBC system
export interface Calculate844PointsResult {
  countingPoints: number;
  countingSubjects: SubjectResult[];
  droppedSubjects: SubjectResult[];
  totalSubjectsWithResults: number;
}

// Point-based grade boundaries interface
export interface PointBoundary {
  grade: string;
  min_points: number;
  max_points: number;
}

// Calculate overall grade based on total points (not marks)
export function calculateOverallGradeByPoints(
  totalPoints: number,
  pointBoundaries: PointBoundary[]
): { grade: string; points: number } {
  // Sort boundaries by max_points descending for proper matching
  const sorted = [...pointBoundaries].sort((a, b) => b.max_points - a.max_points);
  
  for (const boundary of sorted) {
    if (totalPoints >= boundary.min_points && totalPoints <= boundary.max_points) {
      return { grade: boundary.grade, points: totalPoints };
    }
  }
  // Default to E if no boundary matches
  return { grade: "E", points: totalPoints };
}

// Default point boundaries for 7-subject calculation (max 84 points = 7 subjects × 12 points)
export const DEFAULT_POINT_BOUNDARIES: PointBoundary[] = [
  { grade: "A", min_points: 78, max_points: 84 },
  { grade: "A-", min_points: 72, max_points: 77 },
  { grade: "B+", min_points: 66, max_points: 71 },
  { grade: "B", min_points: 60, max_points: 65 },
  { grade: "B-", min_points: 54, max_points: 59 },
  { grade: "C+", min_points: 48, max_points: 53 },
  { grade: "C", min_points: 42, max_points: 47 },
  { grade: "C-", min_points: 36, max_points: 41 },
  { grade: "D+", min_points: 30, max_points: 35 },
  { grade: "D", min_points: 24, max_points: 29 },
  { grade: "D-", min_points: 18, max_points: 23 },
  { grade: "E", min_points: 0, max_points: 17 },
];

export function calculate844Points(
  studentResults: { subjectTitle: string; subSubject: string; points: number; marks: number }[]
): Calculate844PointsResult {
  // Categorize all results using both subjectTitle and subSubject
  const categorizedResults: SubjectResult[] = studentResults.map(r => ({
    ...r,
    category: getSubjectCategory(r.subjectTitle, r.subSubject),
  }));

  // Separate by category
  const sciences = categorizedResults.filter(r => r.category === "sciences");
  const technical = categorizedResults.filter(r => r.category === "technical");
  const humanities = categorizedResults.filter(r => r.category === "humanities");
  const religious = categorizedResults.filter(r => r.category === "religious");
  const core = categorizedResults.filter(r => r.category === "core");
  const other = categorizedResults.filter(r => r.category === "other");

  const droppedByCategory: SubjectResult[] = [];
  const keptAfterCategoryCaps: SubjectResult[] = [];

  // STAGE 1: Apply category caps
  
  // Process sciences: keep best 2 if 3+ taken
  if (sciences.length >= 3) {
    const sorted = [...sciences].sort((a, b) => b.points - a.points);
    keptAfterCategoryCaps.push(...sorted.slice(0, 2));
    droppedByCategory.push(...sorted.slice(2));
  } else {
    keptAfterCategoryCaps.push(...sciences);
  }

  // Process technical: keep best 2 if 3+ taken
  if (technical.length >= 3) {
    const sorted = [...technical].sort((a, b) => b.points - a.points);
    keptAfterCategoryCaps.push(...sorted.slice(0, 2));
    droppedByCategory.push(...sorted.slice(2));
  } else {
    keptAfterCategoryCaps.push(...technical);
  }

  // Process humanities + religious combined: keep best 2 if 3+ taken
  const humanitiesReligious = [...humanities, ...religious];
  if (humanitiesReligious.length >= 3) {
    const sorted = [...humanitiesReligious].sort((a, b) => b.points - a.points);
    keptAfterCategoryCaps.push(...sorted.slice(0, 2));
    droppedByCategory.push(...sorted.slice(2));
  } else {
    keptAfterCategoryCaps.push(...humanitiesReligious);
  }

  // Keep all core subjects (English, Kiswahili, Mathematics)
  const coreKept = [...core];
  
  // Keep all "other" subjects for now (they go into candidate pool)
  keptAfterCategoryCaps.push(...other);

  // STAGE 2: Enforce final "Top 7 subjects by points"
  // Core subjects always count. Fill remaining slots from candidate pool.
  
  const candidatePool = [...keptAfterCategoryCaps]; // Non-core subjects that survived category caps
  const slotsNeeded = 7 - coreKept.length;
  
  let countingSubjects: SubjectResult[];
  let droppedByFinalCap: SubjectResult[] = [];
  
  if (slotsNeeded <= 0) {
    // Edge case: More than 7 core subjects (shouldn't happen normally)
    const sortedCore = [...coreKept].sort((a, b) => b.points - a.points);
    countingSubjects = sortedCore.slice(0, 7);
    droppedByFinalCap = sortedCore.slice(7);
  } else if (candidatePool.length <= slotsNeeded) {
    // We have exactly enough or fewer candidates than slots - use all
    countingSubjects = [...coreKept, ...candidatePool];
  } else {
    // We have more candidates than slots - select best by points
    const sortedCandidates = [...candidatePool].sort((a, b) => b.points - a.points);
    const selectedCandidates = sortedCandidates.slice(0, slotsNeeded);
    droppedByFinalCap = sortedCandidates.slice(slotsNeeded);
    countingSubjects = [...coreKept, ...selectedCandidates];
  }

  // Combine all dropped subjects
  const droppedSubjects = [...droppedByCategory, ...droppedByFinalCap];

  // Calculate total points from counting subjects
  const countingPoints = countingSubjects.reduce((sum, r) => sum + r.points, 0);

  return {
    countingPoints,
    countingSubjects,
    droppedSubjects,
    totalSubjectsWithResults: studentResults.length,
  };
}

// Build a subject key for result lookup
export function buildSubjectKey(studentId: string, subjectTitle: string, subSubject: string): string {
  return `${studentId}-${subjectTitle}${subSubject ? ` - ${subSubject}` : ""}`;
}

// Check if a subject is dropped for a student
export function isSubjectDropped(
  subjectTitle: string,
  subSubject: string,
  droppedSubjects: SubjectResult[]
): boolean {
  return droppedSubjects.some(
    d => d.subjectTitle === subjectTitle && d.subSubject === subSubject
  );
}
