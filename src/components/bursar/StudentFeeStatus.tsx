import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Search, AlertTriangle, CheckCircle } from "lucide-react";

const StudentFeeStatus = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterClass, setFilterClass] = useState("all");

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

  // Get fee structures
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

  // Calculate student fee status
  const studentStatuses = students?.map((student) => {
    // Get fee structure for this student's class
    const classFees = feeStructures?.filter((f) => f.class_name === student.class) || [];
    const totalDue = classFees.reduce((sum, f) => sum + Number(f.total_fee), 0);

    // Get payments made by this student
    const studentPayments = payments?.filter((p) => p.student_id === student.id) || [];
    const totalPaid = studentPayments.reduce((sum, p) => sum + Number(p.amount_paid), 0);

    const balance = totalDue - totalPaid;
    const percentPaid = totalDue > 0 ? Math.min((totalPaid / totalDue) * 100, 100) : 0;

    return {
      ...student,
      totalDue,
      totalPaid,
      balance,
      percentPaid,
      status: balance <= 0 ? "cleared" : balance < totalDue * 0.5 ? "partial" : "defaulter",
    };
  });

  // Get unique classes
  const classes = [...new Set(students?.map((s) => s.class) || [])].sort();

  // Filter students
  const filteredStudents = studentStatuses?.filter((student) => {
    if (filterClass !== "all" && student.class !== filterClass) return false;
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      student.full_name.toLowerCase().includes(search) ||
      student.admission_number.toLowerCase().includes(search)
    );
  });

  // Stats
  const clearedCount = filteredStudents?.filter((s) => s.status === "cleared").length || 0;
  const defaulterCount = filteredStudents?.filter((s) => s.status === "defaulter").length || 0;
  const totalBalance = filteredStudents?.reduce((sum, s) => sum + Math.max(0, s.balance), 0) || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Student Fee Status
            </CardTitle>
            <CardDescription>Track student balances and payment status</CardDescription>
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

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="p-3 bg-green-500/10 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Cleared</p>
              <p className="text-lg font-bold text-green-600">{clearedCount}</p>
            </div>
          </div>
          <div className="p-3 bg-red-500/10 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-xs text-muted-foreground">Defaulters</p>
              <p className="text-lg font-bold text-red-600">{defaulterCount}</p>
            </div>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-lg">
            <p className="text-xs text-muted-foreground">Total Outstanding</p>
            <p className="text-lg font-bold text-amber-600">
              KES {totalBalance.toLocaleString()}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!filteredStudents?.length ? (
          <p className="text-center text-muted-foreground py-8">
            No students found. Make sure fee structures are set up for {filterYear}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">Total Due</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
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
                      {student.balance > 0 ? (
                        <span className="text-red-600 font-medium">
                          KES {student.balance.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-green-600">-</span>
                      )}
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
                      {student.status === "cleared" ? (
                        <Badge className="bg-green-500">Cleared</Badge>
                      ) : student.status === "partial" ? (
                        <Badge variant="secondary">Partial</Badge>
                      ) : (
                        <Badge variant="destructive">Defaulter</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentFeeStatus;
