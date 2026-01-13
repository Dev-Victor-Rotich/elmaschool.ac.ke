import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  Info, 
  Target,
  BookOpen,
  Award,
  Sparkles
} from "lucide-react";
import { 
  type PerformanceInsight, 
  type OverallStats, 
  type SubjectTrend 
} from "@/lib/academic-analytics";

interface PerformanceInsightsProps {
  insights: PerformanceInsight[];
  stats: OverallStats;
  subjectTrends: SubjectTrend[];
}

const PerformanceInsights = ({ insights, stats, subjectTrends }: PerformanceInsightsProps) => {
  const getInsightIcon = (type: PerformanceInsight['type']) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'prediction':
        return <Target className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getInsightStyle = (type: PerformanceInsight['type']) => {
    switch (type) {
      case 'positive':
        return "border-green-500/30 bg-green-500/5";
      case 'warning':
        return "border-amber-500/30 bg-amber-500/5";
      case 'prediction':
        return "border-blue-500/30 bg-blue-500/5";
      default:
        return "border-muted";
    }
  };

  // Calculate subject strengths
  const strongSubjects = subjectTrends.filter(s => s.averageMarks >= 70);
  const averageSubjects = subjectTrends.filter(s => s.averageMarks >= 50 && s.averageMarks < 70);
  const weakSubjects = subjectTrends.filter(s => s.averageMarks < 50);

  // Generate career recommendations based on strong subjects
  const getCareerRecommendations = () => {
    const recommendations: string[] = [];
    const strongNames = strongSubjects.map(s => s.subject.toLowerCase());
    
    if (strongNames.some(s => ['mathematics', 'physics', 'chemistry'].includes(s))) {
      recommendations.push("Engineering", "Medicine", "Data Science");
    }
    if (strongNames.some(s => ['biology', 'chemistry'].includes(s))) {
      recommendations.push("Healthcare", "Pharmacy", "Biotechnology");
    }
    if (strongNames.some(s => ['english', 'history', 'kiswahili'].includes(s))) {
      recommendations.push("Law", "Journalism", "Teaching");
    }
    if (strongNames.some(s => ['business', 'economics'].includes(s))) {
      recommendations.push("Business Administration", "Finance", "Accounting");
    }
    
    return [...new Set(recommendations)].slice(0, 4);
  };

  const careerRecommendations = getCareerRecommendations();

  if (insights.length === 0 && subjectTrends.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No insights available yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Complete more exams to receive personalized insights and predictions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Assessment */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Overall Assessment
          </CardTitle>
          <CardDescription>
            Based on {stats.totalExams} exam(s) analyzed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Performance Level</p>
              <div className="flex items-center gap-3">
                <div className="text-4xl font-bold">
                  {stats.overallAverage >= 80 ? 'A' 
                    : stats.overallAverage >= 70 ? 'B'
                    : stats.overallAverage >= 60 ? 'C'
                    : stats.overallAverage >= 50 ? 'D'
                    : 'E'}
                </div>
                <div>
                  <p className="font-medium">{stats.overallAverage}% Average</p>
                  <Badge 
                    variant="outline"
                    className={
                      stats.overallAverage >= 70 
                        ? "text-green-600 border-green-500/30"
                        : stats.overallAverage >= 50
                          ? "text-amber-600 border-amber-500/30"
                          : "text-red-600 border-red-500/30"
                    }
                  >
                    {stats.overallAverage >= 70 ? "Above Average" 
                      : stats.overallAverage >= 50 ? "Average"
                      : "Below Average"}
                  </Badge>
                </div>
              </div>
            </div>
            {stats.predictedNextAverage && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Predicted Next Exam</p>
                <div className="flex items-center gap-3">
                  <Target className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.predictedNextAverage}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Based on current trajectory
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Insights Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {insights.map((insight, index) => (
          <Card key={index} className={getInsightStyle(insight.type)}>
            <CardContent className="pt-4">
              <div className="flex gap-3">
                {getInsightIcon(insight.type)}
                <div>
                  <p className="font-medium">{insight.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {insight.message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subject Strength Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Subject Strength Map
          </CardTitle>
          <CardDescription>
            Understanding your academic strengths and areas for improvement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Strong Subjects */}
            {strongSubjects.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm font-medium">Strong (70%+)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {strongSubjects.map(s => (
                    <Badge key={s.subject} className="bg-green-500/20 text-green-700 border-green-500/30">
                      {s.subject}: {s.averageMarks}%
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Average Subjects */}
            {averageSubjects.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm font-medium">Average (50-69%)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {averageSubjects.map(s => (
                    <Badge key={s.subject} className="bg-amber-500/20 text-amber-700 border-amber-500/30">
                      {s.subject}: {s.averageMarks}%
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Weak Subjects */}
            {weakSubjects.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm font-medium">Needs Focus (&lt;50%)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {weakSubjects.map(s => (
                    <Badge key={s.subject} className="bg-red-500/20 text-red-700 border-red-500/30">
                      {s.subject}: {s.averageMarks}%
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Career Recommendations */}
      {careerRecommendations.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Career Path Suggestions
            </CardTitle>
            <CardDescription>
              Based on your strong subjects, consider exploring these career paths
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {careerRecommendations.map((career, index) => (
                <div 
                  key={index}
                  className="p-3 border rounded-lg text-center hover:bg-muted/50 transition-colors"
                >
                  <p className="font-medium">{career}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              These are suggestions based on your academic strengths. Speak with teachers and parents for personalized guidance.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actionable Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Actionable Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {weakSubjects.length > 0 && (
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2" />
                <span className="text-sm">
                  Dedicate extra study time to <strong>{weakSubjects.map(s => s.subject).join(', ')}</strong>. 
                  Consider getting a tutor or joining study groups.
                </span>
              </li>
            )}
            {stats.trend === 'declining' && (
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2" />
                <span className="text-sm">
                  Your performance is declining. Review your study habits and seek help from teachers early.
                </span>
              </li>
            )}
            {stats.trend === 'improving' && (
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
                <span className="text-sm">
                  Great progress! Continue with your current study methods and aim even higher.
                </span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
              <span className="text-sm">
                Create a consistent study schedule with dedicated time for each subject.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2" />
              <span className="text-sm">
                Review past exam papers to understand question patterns and improve exam techniques.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceInsights;
