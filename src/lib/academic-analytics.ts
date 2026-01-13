// Academic analytics utility functions

export interface ExamResult {
  id: string;
  exam_id: string | null;
  subject: string;
  marks: number;
  grade: string | null;
  term: string;
  year: number;
  created_at: string;
  remarks: string | null;
}

export interface Exam {
  id: string;
  exam_name: string;
  class_name: string;
  term: string;
  year: number;
  start_date: string;
  end_date: string;
  status: string | null;
}

export interface ExamWithResults extends Exam {
  results: ExamResult[];
  average: number;
}

export interface SubjectTrend {
  subject: string;
  averageMarks: number;
  trend: 'improving' | 'declining' | 'stable';
  trendPercentage: number;
  examScores: { examName: string; marks: number; date: string }[];
}

export interface PerformanceInsight {
  type: 'positive' | 'warning' | 'info' | 'prediction';
  title: string;
  message: string;
  icon?: string;
}

export interface OverallStats {
  overallAverage: number;
  bestSubject: { name: string; average: number } | null;
  weakestSubject: { name: string; average: number } | null;
  trend: 'improving' | 'declining' | 'stable';
  trendPercentage: number;
  totalExams: number;
  predictedNextAverage: number | null;
}

// Calculate exam status based on dates
export const getExamStatus = (exam: Exam): 'upcoming' | 'ongoing' | 'completed' => {
  const now = new Date();
  const startDate = new Date(exam.start_date);
  const endDate = new Date(exam.end_date);
  
  if (now < startDate) return 'upcoming';
  if (now > endDate) return 'completed';
  return 'ongoing';
};

// Calculate average marks for a set of results
export const calculateAverage = (results: ExamResult[]): number => {
  if (results.length === 0) return 0;
  const sum = results.reduce((acc, r) => acc + r.marks, 0);
  return Math.round((sum / results.length) * 100) / 100;
};

// Calculate trend between two averages
export const calculateTrend = (
  previousAvg: number, 
  currentAvg: number
): { trend: 'improving' | 'declining' | 'stable'; percentage: number } => {
  if (previousAvg === 0) return { trend: 'stable', percentage: 0 };
  
  const diff = currentAvg - previousAvg;
  const percentage = Math.round((diff / previousAvg) * 100 * 10) / 10;
  
  if (percentage > 2) return { trend: 'improving', percentage: Math.abs(percentage) };
  if (percentage < -2) return { trend: 'declining', percentage: Math.abs(percentage) };
  return { trend: 'stable', percentage: Math.abs(percentage) };
};

// Group results by exam
export const groupResultsByExam = (
  results: ExamResult[], 
  exams: Exam[]
): ExamWithResults[] => {
  const examMap = new Map<string, ExamWithResults>();
  
  exams.forEach(exam => {
    examMap.set(exam.id, {
      ...exam,
      results: [],
      average: 0,
    });
  });
  
  results.forEach(result => {
    if (result.exam_id && examMap.has(result.exam_id)) {
      examMap.get(result.exam_id)!.results.push(result);
    }
  });
  
  // Calculate averages
  examMap.forEach((exam) => {
    exam.average = calculateAverage(exam.results);
  });
  
  return Array.from(examMap.values())
    .filter(e => e.results.length > 0)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
};

// Calculate subject trends
export const calculateSubjectTrends = (
  results: ExamResult[],
  exams: Exam[]
): SubjectTrend[] => {
  const subjects = [...new Set(results.map(r => r.subject))];
  
  return subjects.map(subject => {
    const subjectResults = results
      .filter(r => r.subject === subject && r.exam_id)
      .sort((a, b) => {
        const examA = exams.find(e => e.id === a.exam_id);
        const examB = exams.find(e => e.id === b.exam_id);
        if (!examA || !examB) return 0;
        return new Date(examA.start_date).getTime() - new Date(examB.start_date).getTime();
      });
    
    const examScores = subjectResults.map(r => {
      const exam = exams.find(e => e.id === r.exam_id);
      return {
        examName: exam?.exam_name || 'Unknown',
        marks: r.marks,
        date: exam?.start_date || r.created_at,
      };
    });
    
    const averageMarks = calculateAverage(subjectResults);
    
    // Calculate trend from last 3 exams vs previous 3
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    let trendPercentage = 0;
    
    if (subjectResults.length >= 2) {
      const midPoint = Math.floor(subjectResults.length / 2);
      const firstHalf = subjectResults.slice(0, midPoint);
      const secondHalf = subjectResults.slice(midPoint);
      
      const firstAvg = calculateAverage(firstHalf);
      const secondAvg = calculateAverage(secondHalf);
      
      const trendCalc = calculateTrend(firstAvg, secondAvg);
      trend = trendCalc.trend;
      trendPercentage = trendCalc.percentage;
    }
    
    return {
      subject,
      averageMarks,
      trend,
      trendPercentage,
      examScores,
    };
  }).sort((a, b) => b.averageMarks - a.averageMarks);
};

// Calculate overall statistics
export const calculateOverallStats = (
  results: ExamResult[],
  exams: Exam[]
): OverallStats => {
  const examWithResults = groupResultsByExam(results, exams);
  const subjectTrends = calculateSubjectTrends(results, exams);
  
  const overallAverage = calculateAverage(results);
  const bestSubject = subjectTrends[0] || null;
  const weakestSubject = subjectTrends[subjectTrends.length - 1] || null;
  
  // Calculate overall trend from exam averages
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  let trendPercentage = 0;
  let predictedNextAverage: number | null = null;
  
  if (examWithResults.length >= 2) {
    const midPoint = Math.floor(examWithResults.length / 2);
    const firstHalfAvg = examWithResults.slice(0, midPoint).reduce((sum, e) => sum + e.average, 0) / midPoint;
    const secondHalfAvg = examWithResults.slice(midPoint).reduce((sum, e) => sum + e.average, 0) / (examWithResults.length - midPoint);
    
    const trendCalc = calculateTrend(firstHalfAvg, secondHalfAvg);
    trend = trendCalc.trend;
    trendPercentage = trendCalc.percentage;
    
    // Simple linear prediction based on trend
    const lastExamAvg = examWithResults[examWithResults.length - 1]?.average || overallAverage;
    const trendMultiplier = trend === 'improving' ? 1 : trend === 'declining' ? -1 : 0;
    predictedNextAverage = Math.min(100, Math.max(0, lastExamAvg + (trendPercentage * 0.5 * trendMultiplier)));
    predictedNextAverage = Math.round(predictedNextAverage * 10) / 10;
  }
  
  return {
    overallAverage,
    bestSubject: bestSubject ? { name: bestSubject.subject, average: bestSubject.averageMarks } : null,
    weakestSubject: weakestSubject && weakestSubject !== bestSubject 
      ? { name: weakestSubject.subject, average: weakestSubject.averageMarks } 
      : null,
    trend,
    trendPercentage,
    totalExams: examWithResults.length,
    predictedNextAverage,
  };
};

// Generate performance insights
export const generateInsights = (
  results: ExamResult[],
  exams: Exam[],
  stats: OverallStats,
  subjectTrends: SubjectTrend[]
): PerformanceInsight[] => {
  const insights: PerformanceInsight[] = [];
  
  // Overall trend insight
  if (stats.trend === 'improving') {
    insights.push({
      type: 'positive',
      title: 'Performance Improving',
      message: `Your performance has improved by ${stats.trendPercentage}% over recent exams. Keep up the great work!`,
    });
  } else if (stats.trend === 'declining') {
    insights.push({
      type: 'warning',
      title: 'Performance Needs Attention',
      message: `Your marks have dropped by ${stats.trendPercentage}% recently. Consider seeking extra help or adjusting study habits.`,
    });
  }
  
  // Best subject insight
  if (stats.bestSubject && stats.bestSubject.average >= 70) {
    insights.push({
      type: 'positive',
      title: 'Strong Subject',
      message: `${stats.bestSubject.name} is your strongest subject with an average of ${stats.bestSubject.average}%. Consider pursuing related career paths.`,
    });
  }
  
  // Weak subject insight
  if (stats.weakestSubject && stats.weakestSubject.average < 50) {
    insights.push({
      type: 'warning',
      title: 'Subject Needs Focus',
      message: `${stats.weakestSubject.name} needs more attention (${stats.weakestSubject.average}% average). Consider dedicating extra study time.`,
    });
  }
  
  // Subjects with declining trends
  const decliningSubjects = subjectTrends.filter(s => s.trend === 'declining' && s.trendPercentage > 5);
  decliningSubjects.forEach(subject => {
    insights.push({
      type: 'warning',
      title: `${subject.subject} Declining`,
      message: `Your ${subject.subject} marks have dropped ${subject.trendPercentage}%. Focus on this subject to improve.`,
    });
  });
  
  // Prediction insight
  if (stats.predictedNextAverage) {
    insights.push({
      type: 'prediction',
      title: 'Performance Prediction',
      message: `Based on your current trajectory, your expected next exam average is ${stats.predictedNextAverage}%.`,
    });
  }
  
  // Consistency insight
  if (stats.totalExams >= 3) {
    const examWithResults = groupResultsByExam(results, exams);
    const averages = examWithResults.map(e => e.average);
    const variance = averages.reduce((acc, avg) => acc + Math.pow(avg - stats.overallAverage, 2), 0) / averages.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev < 5) {
      insights.push({
        type: 'info',
        title: 'Consistent Performance',
        message: 'Your performance is very consistent across exams. This shows steady study habits.',
      });
    } else if (stdDev > 15) {
      insights.push({
        type: 'warning',
        title: 'Inconsistent Results',
        message: 'Your exam scores vary significantly. Try to maintain more consistent study routines.',
      });
    }
  }
  
  // Encouragement for improvement
  const improvingSubjects = subjectTrends.filter(s => s.trend === 'improving' && s.trendPercentage > 5);
  if (improvingSubjects.length > 0) {
    insights.push({
      type: 'positive',
      title: 'Subjects Improving',
      message: `Great progress in: ${improvingSubjects.map(s => s.subject).join(', ')}. Your effort is paying off!`,
    });
  }
  
  return insights;
};

// Prepare chart data for performance trends
export const prepareChartData = (
  examWithResults: ExamWithResults[],
  subjectTrends: SubjectTrend[]
) => {
  // Overall exam averages for line chart
  const overallData = examWithResults.map(exam => ({
    name: exam.exam_name,
    average: exam.average,
    date: exam.start_date,
  }));
  
  // Subject-wise data for multi-line chart
  const subjects = subjectTrends.slice(0, 5).map(s => s.subject); // Top 5 subjects
  const subjectData = examWithResults.map(exam => {
    const dataPoint: Record<string, any> = {
      name: exam.exam_name,
      date: exam.start_date,
    };
    
    subjects.forEach(subject => {
      const result = exam.results.find(r => r.subject === subject);
      dataPoint[subject] = result?.marks || null;
    });
    
    return dataPoint;
  });
  
  return { overallData, subjectData, subjects };
};
