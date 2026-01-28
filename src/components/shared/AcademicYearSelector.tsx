import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays } from "lucide-react";

interface AcademicYearSelectorProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  availableYears?: number[];
  className?: string;
}

const AcademicYearSelector = ({
  selectedYear,
  onYearChange,
  availableYears,
  className = "",
}: AcademicYearSelectorProps) => {
  const currentYear = new Date().getFullYear();
  
  // Generate years: from 5 years ago to 2 years in the future
  const defaultYears = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i);
  
  // Use provided years or default, ensure current year is included
  const years = availableYears && availableYears.length > 0 
    ? [...new Set([...availableYears, currentYear])].sort((a, b) => b - a)
    : defaultYears.sort((a, b) => b - a);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <CalendarDays className="w-4 h-4 text-muted-foreground" />
      <Select
        value={selectedYear.toString()}
        onValueChange={(value) => onYearChange(parseInt(value))}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Select Year" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year} Academic Year
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AcademicYearSelector;
