// Grading utility functions for 8-4-4 and CBC systems

// Subject category definitions for 8-4-4 system
export const SCIENCES = ["Biology", "Chemistry", "Physics"];
export const TECHNICAL_APPLIED = ["Agriculture", "Home Science", "Computer Studies", "Business Studies"];
export const HUMANITIES = ["History", "Geography"];
export const RELIGIOUS = ["C.R.E", "I.R.E", "H.R.E", "CRE", "IRE", "HRE"];
export const HUMANITIES_RELIGIOUS = [...HUMANITIES, ...RELIGIOUS];

// Check if class follows 8-4-4 system (Form 3, Form 4)
export function is844Class(className: string): boolean {
  return /^Form\s*(3|4)$/i.test(className.trim());
}

// Check if class follows CBC system (Grade 10, 11, 12) - for future use
export function isCBCClass(className: string): boolean {
  return /^Grade\s*(10|11|12)$/i.test(className.trim());
}

// Get subject category
function getSubjectCategory(subjectTitle: string): string {
  const normalizedTitle = subjectTitle.trim();
  
  if (SCIENCES.some(s => normalizedTitle.toLowerCase().includes(s.toLowerCase()))) {
    return "sciences";
  }
  if (TECHNICAL_APPLIED.some(s => normalizedTitle.toLowerCase().includes(s.toLowerCase()))) {
    return "technical";
  }
  if (HUMANITIES.some(s => normalizedTitle.toLowerCase().includes(s.toLowerCase()))) {
    return "humanities";
  }
  if (RELIGIOUS.some(s => normalizedTitle.toLowerCase().includes(s.toLowerCase()))) {
    return "religious";
  }
  return "core";
}

// Result type for subject with points
interface SubjectResult {
  subjectTitle: string;
  subSubject: string;
  points: number;
  marks: number;
  category: string;
}

// Calculate 7-best-subjects points for 8-4-4 system
export interface Calculate844PointsResult {
  countingPoints: number;
  countingSubjects: SubjectResult[];
  droppedSubjects: SubjectResult[];
  totalSubjectsWithResults: number;
}

export function calculate844Points(
  studentResults: { subjectTitle: string; subSubject: string; points: number; marks: number }[]
): Calculate844PointsResult {
  // Categorize all results
  const categorizedResults: SubjectResult[] = studentResults.map(r => ({
    ...r,
    category: getSubjectCategory(r.subjectTitle),
  }));

  // Separate by category
  const sciences = categorizedResults.filter(r => r.category === "sciences");
  const technical = categorizedResults.filter(r => r.category === "technical");
  const humanities = categorizedResults.filter(r => r.category === "humanities");
  const religious = categorizedResults.filter(r => r.category === "religious");
  const core = categorizedResults.filter(r => r.category === "core");

  const countingSubjects: SubjectResult[] = [];
  const droppedSubjects: SubjectResult[] = [];

  // Process sciences: keep best 2 if 3 taken
  if (sciences.length >= 3) {
    const sorted = [...sciences].sort((a, b) => b.points - a.points);
    countingSubjects.push(...sorted.slice(0, 2));
    droppedSubjects.push(...sorted.slice(2));
  } else {
    countingSubjects.push(...sciences);
  }

  // Process technical: keep best 2 if 3+ taken
  if (technical.length >= 3) {
    const sorted = [...technical].sort((a, b) => b.points - a.points);
    countingSubjects.push(...sorted.slice(0, 2));
    droppedSubjects.push(...sorted.slice(2));
  } else {
    countingSubjects.push(...technical);
  }

  // Process humanities + religious combined: keep best 2 if 3+ taken
  const humanitiesReligious = [...humanities, ...religious];
  if (humanitiesReligious.length >= 3) {
    const sorted = [...humanitiesReligious].sort((a, b) => b.points - a.points);
    countingSubjects.push(...sorted.slice(0, 2));
    droppedSubjects.push(...sorted.slice(2));
  } else {
    countingSubjects.push(...humanitiesReligious);
  }

  // Add all core subjects (English, Kiswahili, Mathematics)
  countingSubjects.push(...core);

  // Calculate total counting points (capped at 7 subjects for the final sum)
  // Sort by points and take best 7
  const sortedCounting = [...countingSubjects].sort((a, b) => b.points - a.points);
  const finalCounting = sortedCounting.slice(0, 7);
  const additionalDropped = sortedCounting.slice(7);
  
  const countingPoints = finalCounting.reduce((sum, r) => sum + r.points, 0);

  return {
    countingPoints,
    countingSubjects: finalCounting,
    droppedSubjects: [...droppedSubjects, ...additionalDropped],
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
