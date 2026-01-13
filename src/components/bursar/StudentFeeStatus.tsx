import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Search, AlertTriangle, CheckCircle, TrendingDown, Minus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateYearlyBalance, formatBalance, type TermBalance } from "@/lib/fee-utils";

const StudentFeeStatus = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterClass, setFilterClass] = useState("all");
  const [viewMode, setViewMode] = useState<"annual" | "termly">("annual");

  // Get all students
  const { data: students } = useQuery({
    queryKey: ["students-for-fees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students_data")
        .select("id, full_name, admission_number, class")
        .eq("is_registered", true)
        .order("class")
        .order("full_name");

      if (error) throw error;
      return data;
    },
  });

  // Get fee structures for the year
  const { data: feeStructures } = useQuery({
    queryKey: ["fee-structures-for-status", filterYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_structures")
        .select("*")
        .eq("year", parseInt(filterYear));

      if (error) throw error;
      return data;
    },
  });

  // Get all payments for the year
  const { data: payments } = useQuery({
    queryKey: ["all-payments", filterYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_payments")
        .select("student_id, term, amount_paid, amount_due")
        .eq("year", parseInt(filterYear));

      if (error) throw error;
      return data;
    },
  });

  // Calculate student fee status with rolling balance
  const studentStatuses = students?.map((student) => {
    const studentPayments = payments?.filter((p) => p.student_id === student.id) || [];
    
    const termBalances = calculateYearlyBalance(
      student.class,
      parseInt(filterYear),
      feeStructures?.map(f => ({
        ...f,
        total_fee: Number(f.total_fee) || 
          (Number(f.tuition_fee) + Number(f.boarding_fee) + Number(f.activity_fee) + Number(f.other_fees)),
      })) || [],
      studentPayments.map(p => ({
        term: p.term,
        year: parseInt(filterYear),
        amount_paid: Number(p.amount_paid),
        student_id: p.student_id,
      }))
    );

    const lastTermWithFee = termBalances.filter(t => t.termFee > 0).pop();
    const finalBalance = lastTermWithFee?.netBalance || 0;

    const totalDue = termBalances.reduce((sum, t) => sum + t.termFee, 0);
    const totalPaid = termBalances.reduce((sum, t) => sum + t.termPayments, 0);
    const percentPaid = totalDue > 0 ? Math.min((totalPaid / totalDue) * 100, 100) : 0;

    let status: 'credit' | 'partial' | 'cleared' | 'defaulter';
    if (finalBalance < 0) {
      status = 'credit';
    } else if (finalBalance === 0) {
      status = 'cleared';
    } else if (totalPaid > 0) {
      status = 'partial';
    } else {
      status = 'defaulter';
    }

    return {
      ...student,
      totalDue,
      totalPaid,
      balance: finalBalance,
      percentPaid,
      status,
      termBalances,
    };
  });

  const classes = [...new Set(students?.map((s) => s.class) || [])].sort();

  const filteredStudents = studentStatuses?.filter((student) => {
    if (filterClass !== "all" && student.class !== filterClass) return false;
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      student.full_name.toLowerCase().includes(search) ||
      student.admission_number.toLowerCase().includes(search)
    );
  });

  const clearedCount = filteredStudents?.filter((s) => s.status === "cleared" || s.status === "credit").length || 0;
  const creditCount = filteredStudents?.filter((s) => s.status === "credit").length || 0;
  const defaulterCount = filteredStudents?.filter((s) => s.status === "defaulter").length || 0;
  const totalOutstanding = filteredStudents?.reduce((sum, s) => sum + Math.max(0, s.balance), 0) || 0;
  const totalCredit = filteredStudents?.reduce((sum, s) => sum + Math.abs(Math.min(0, s.balance)), 0) || 0;
  const netPosition = totalOutstanding - totalCredit;

  const renderBalanceCell = (balance: number) => {
    const formatted = formatBalance(balance);
    if (formatted.isCredit) {
      return (
        <span className="text-green-600 font-medium flex items-center gap-1">
          <TrendingDown className="h-3 w-3" />
          KES {Math.abs(balance).toLocaleString()}
        </span>
      );
    } else if (formatted.isDue) {
      return (
        <span className="text-destructive font-medium">
          KES {balance.toLocaleString()}
        </span>
      );
    }
    return <span className="text-muted-foreground"><Minus className="h-3 w-3" /></span>;
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'credit':
        return <Badge className="bg-green-500 hover:bg-green-600">Credit</Badge>;
      case 'cleared':
        return <Badge className="bg-green-500 hover:bg-green-600">Cleared</Badge>;
      case 'partial':
        return <Badge variant="secondary">Partial</Badge>;
      case 'defaulter':
        return <Badge variant="destructive">Defaulter</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Net Balance Summary Card */}
      <Card className={`border-2 ${netPosition > 0 ? 'border-amber-500/50 bg-amber-500/5' : netPosition < 0 ? 'border-green-500/50 bg-green-500/5' : 'border-primary/50'}`}>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4 items-center">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground font-medium">NET BALANCE SUMMARY</p>
              <p className="text-xs text-muted-foreground mt-1">{filterYear} Academic Year</p>
            </div>
            <div className="text-center p-3 bg-amber-500/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Outstanding</p>
              <p className="text-xl font-bold text-amber-600">KES {totalOutstanding.toLocaleString()}</p>
              <p className="text-xs text-amber-600/70">{filteredStudents?.filter(s => s.balance > 0).length || 0} students</p>
            </div>
            <div className="text-center p-3 bg-green-500/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Credits</p>
              <p className="text-xl font-bold text-green-600">KES {totalCredit.toLocaleString()}</p>
              <p className="text-xs text-green-600/70">{creditCount} students</p>
            </div>
            <div className={`text-center p-4 rounded-lg ${netPosition > 0 ? 'bg-amber-500/20' : netPosition < 0 ? 'bg-green-500/20' : 'bg-primary/10'}`}>
              <p className="text-xs text-muted-foreground font-medium">NET POSITION</p>
              <p className={`text-2xl font-bold ${netPosition > 0 ? 'text-amber-600' : netPosition < 0 ? 'text-green-600' : 'text-primary'}`}>
                {netPosition > 0 
                  ? `KES ${netPosition.toLocaleString()}`
                  : netPosition < 0 
                    ? `-KES ${Math.abs(netPosition).toLocaleString()}`
                    : "Balanced"
                }
              </p>
              <p className={`text-xs ${netPosition > 0 ? 'text-amber-600' : netPosition < 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                {netPosition > 0 
                  ? "School is owed"
                  : netPosition < 0 
                    ? "Credit surplus"
                    : "All accounts balanced"
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Student Fee Status
              </CardTitle>
              <CardDescription>Track student balances with term-by-term carry-forward</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[150px]"
                />
              </div>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <div className="p-3 bg-green-500/10 rounded-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Cleared/Credit</p>
                <p className="text-lg font-bold text-green-600">{clearedCount}</p>
              </div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Credits</p>
              <p className="text-lg font-bold text-green-600">
                KES {totalCredit.toLocaleString()}
              </p>
              <p className="text-xs text-green-600/70">{creditCount} students</p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">Defaulters</p>
                <p className="text-lg font-bold text-destructive">{defaulterCount}</p>
              </div>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Outstanding</p>
              <p className="text-lg font-bold text-amber-600">
                KES {totalOutstanding.toLocaleString()}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "annual" | "termly")} className="mb-4">
            <TabsList>
              <TabsTrigger value="annual">Annual View</TabsTrigger>
              <TabsTrigger value="termly">Term-by-Term</TabsTrigger>
            </TabsList>
          </Tabs>

          {!filteredStudents?.length ? (
            <p className="text-center text-muted-foreground py-8">
              No students found. Make sure fee structures are set up for {filterYear}.
            </p>
          ) : viewMode === "annual" ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-right">Annual Fees</TableHead>
                    <TableHead className="text-right">Total Paid</TableHead>
                    <TableHead className="text-right">Net Balance</TableHead>
                    <TableHead className="w-[150px]">Progress</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents?.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.admission_number}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{student.class}</TableCell>
                      <TableCell className="text-right">
                        {student.totalDue > 0 ? (
                          `KES ${student.totalDue.toLocaleString()}`
                        ) : (
                          <span className="text-muted-foreground">No fee set</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        KES {student.totalPaid.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {renderBalanceCell(student.balance)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={student.percentPaid} className="h-2" />
                          <span className="text-xs text-muted-foreground w-10">
                            {Math.round(student.percentPaid)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {renderStatusBadge(student.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-center">Term 1</TableHead>
                    <TableHead className="text-center">Term 2</TableHead>
                    <TableHead className="text-center">Term 3</TableHead>
                    <TableHead className="text-right">Net Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents?.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.admission_number}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{student.class}</TableCell>
                      {[1, 2, 3].map((term) => {
                        const termData = student.termBalances.find((t: TermBalance) => t.term === term);
                        if (!termData || termData.termFee === 0) {
                          return (
                            <TableCell key={term} className="text-center text-muted-foreground">
                              -
                            </TableCell>
                          );
                        }
                        return (
                          <TableCell key={term} className="text-center">
                            <div className="text-xs space-y-1">
                              <div className="text-muted-foreground">
                                Fee: {termData.termFee.toLocaleString()}
                              </div>
                              <div className="text-green-600">
                                Paid: {termData.termPayments.toLocaleString()}
                              </div>
                              {termData.carryForward !== 0 && (
                                <div className={termData.carryForward < 0 ? "text-green-600" : "text-destructive"}>
                                  C/F: {termData.carryForward < 0 ? `-${Math.abs(termData.carryForward).toLocaleString()}` : `+${termData.carryForward.toLocaleString()}`}
                                </div>
                              )}
                              <div className={`font-medium ${termData.netBalance < 0 ? 'text-green-600' : termData.netBalance > 0 ? 'text-destructive' : ''}`}>
                                Net: {termData.netBalance < 0 ? `-${Math.abs(termData.netBalance).toLocaleString()}` : termData.netBalance.toLocaleString()}
                              </div>
                            </div>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right">
                        {renderBalanceCell(student.balance)}
                      </TableCell>
                      <TableCell>
                        {renderStatusBadge(student.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentFeeStatus;