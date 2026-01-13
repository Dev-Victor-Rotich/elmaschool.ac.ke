import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Award, AlertTriangle, BarChart3 } from "lucide-react";
import { 
  type ExamWithResults, 
  type SubjectTrend, 
  type OverallStats,
  prepareChartData 
} from "@/lib/academic-analytics";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface PerformanceChartProps {
  examWithResults: ExamWithResults[];
  subjectTrends: SubjectTrend[];
  stats: OverallStats;
}

const SUBJECT_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const PerformanceChart = ({ examWithResults, subjectTrends, stats }: PerformanceChartProps) => {
  const [showSubjects, setShowSubjects] = useState(false);
  const { overallData, subjectData, subjects } = prepareChartData(examWithResults, subjectTrends);

  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const chartConfig: ChartConfig = {
    average: {
      label: "Average",
      color: "hsl(var(--primary))",
    },
    ...subjects.reduce((acc, subject, index) => ({
      ...acc,
      [subject]: {
        label: subject,
        color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
      }
    }), {}),
  };

  if (examWithResults.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No exam results available to display trends.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Once you have results from multiple exams, your performance trends will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Average</p>
                <p className="text-2xl font-bold">{stats.overallAverage}%</p>
              </div>
              {getTrendIcon(stats.trend)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.trend === 'improving' && `↑ ${stats.trendPercentage}% improvement`}
              {stats.trend === 'declining' && `↓ ${stats.trendPercentage}% decline`}
              {stats.trend === 'stable' && 'Stable performance'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Best Subject</p>
                <p className="text-lg font-bold text-green-600">
                  {stats.bestSubject?.name || '-'}
                </p>
              </div>
              <Award className="w-6 h-6 text-green-500/50" />
            </div>
            {stats.bestSubject && (
              <p className="text-xs text-green-600 mt-1">
                {stats.bestSubject.average}% average
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Needs Focus</p>
                <p className="text-lg font-bold text-amber-600">
                  {stats.weakestSubject?.name || '-'}
                </p>
              </div>
              <AlertTriangle className="w-6 h-6 text-amber-500/50" />
            </div>
            {stats.weakestSubject && (
              <p className="text-xs text-amber-600 mt-1">
                {stats.weakestSubject.average}% average
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Exams</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalExams}</p>
              </div>
              <BarChart3 className="w-6 h-6 text-blue-500/50" />
            </div>
            {stats.predictedNextAverage && (
              <p className="text-xs text-blue-600 mt-1">
                Predicted next: {stats.predictedNextAverage}%
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chart Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Performance Trends
              </CardTitle>
              <CardDescription>
                Track your academic progress across exams
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSubjects(!showSubjects)}
            >
              {showSubjects ? "Show Overall" : "Show Subjects"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            {!showSubjects ? (
              <AreaChart data={overallData}>
                <defs>
                  <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="average"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#colorAverage)"
                />
              </AreaChart>
            ) : (
              <LineChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                {subjects.map((subject, index) => (
                  <Line
                    key={subject}
                    type="monotone"
                    dataKey={subject}
                    stroke={SUBJECT_COLORS[index % SUBJECT_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            )}
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Subject Performance Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Performance</CardTitle>
          <CardDescription>Detailed breakdown by subject</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {subjectTrends.map((subject, index) => (
              <div 
                key={subject.subject}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{subject.subject}</span>
                  {getTrendIcon(subject.trend)}
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="h-2 rounded-full flex-1 bg-muted overflow-hidden"
                  >
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${subject.averageMarks}%`,
                        backgroundColor: SUBJECT_COLORS[index % SUBJECT_COLORS.length]
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {subject.averageMarks}%
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>{subject.examScores.length} exam(s)</span>
                  <Badge 
                    variant="outline" 
                    className={
                      subject.trend === 'improving' 
                        ? "text-green-600 border-green-500/30" 
                        : subject.trend === 'declining'
                          ? "text-red-600 border-red-500/30"
                          : ""
                    }
                  >
                    {subject.trend === 'improving' && `↑ ${subject.trendPercentage}%`}
                    {subject.trend === 'declining' && `↓ ${subject.trendPercentage}%`}
                    {subject.trend === 'stable' && 'Stable'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceChart;
