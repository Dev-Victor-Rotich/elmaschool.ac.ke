import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Search, Printer, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { format } from "date-fns";
import ReceiptModal from "./ReceiptModal";

interface PaymentData {
  receiptNumber: string;
  studentName: string;
  admissionNumber: string;
  studentClass: string;
  term: string;
  year: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  paymentDate: Date;
  recordedBy: string;
}

interface RunningBalanceMap {
  [paymentId: string]: {
    cumulativeBalance: number;
    totalFees: number;
    totalPaid: number;
  };
}

const PaymentHistoryView = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterTerm, setFilterTerm] = useState("all");
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null);

  // Fetch available years from fee_payments
  const { data: availableYears } = useQuery({
    queryKey: ["payment-years"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_payments")
        .select("year")
        .order("year", { ascending: false });
      
      if (error) throw error;
      
      const uniqueYears = [...new Set(data?.map(p => p.year) || [])];
      return uniqueYears.length > 0 ? uniqueYears : [new Date().getFullYear()];
    },
  });

  // Set default year to latest year with payments
  useEffect(() => {
    if (availableYears && availableYears.length > 0 && !filterYear) {
      setFilterYear(availableYears[0].toString());
    }
  }, [availableYears, filterYear]);

  // Fetch ALL payments for the year (for cumulative calculation)
  const { data: allYearPayments } = useQuery({
    queryKey: ["all-year-payments", filterYear],
    queryFn: async () => {
      if (!filterYear) return [];
      
      const { data, error } = await supabase
        .from("fee_payments")
        .select(`
          *,
          student:students_data(full_name, admission_number, class)
        `)
        .eq("year", parseInt(filterYear))
        .order("payment_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!filterYear,
  });

  // Fetch fee structures for the year
  const { data: feeStructures } = useQuery({
    queryKey: ["fee-structures-year", filterYear],
    queryFn: async () => {
      if (!filterYear) return [];
      
      const { data, error } = await supabase
        .from("fee_structures")
        .select("*")
        .eq("year", parseInt(filterYear));

      if (error) throw error;
      return data || [];
    },
    enabled: !!filterYear,
  });

  // Calculate running balances for each payment
  const runningBalances = useMemo<RunningBalanceMap>(() => {
    if (!allYearPayments || !feeStructures) return {};

    const balanceMap: RunningBalanceMap = {};
    
    // Group payments by student
    const paymentsByStudent: { [studentId: string]: typeof allYearPayments } = {};
    
    allYearPayments.forEach(payment => {
      const studentId = payment.student_id;
      if (!paymentsByStudent[studentId]) {
        paymentsByStudent[studentId] = [];
      }
      paymentsByStudent[studentId].push(payment);
    });

    // Calculate running balance for each student's payments
    Object.entries(paymentsByStudent).forEach(([studentId, studentPayments]) => {
      // Sort by date ascending
      const sortedPayments = [...studentPayments].sort((a, b) => 
        new Date(a.payment_date || 0).getTime() - new Date(b.payment_date || 0).getTime()
      );

      sortedPayments.forEach((payment, index) => {
        const studentClass = payment.student?.class || "";
        const currentTerm = parseInt(payment.term);

        // Calculate total fees up to current term
        let totalFeesUpToTerm = 0;
        for (let t = 1; t <= currentTerm; t++) {
          const termFee = feeStructures.find(
            fs => fs.class_name === studentClass && fs.term === t.toString()
          );
          if (termFee) {
            totalFeesUpToTerm += Number(termFee.total_fee) || 
              (Number(termFee.tuition_fee) + Number(termFee.boarding_fee) + 
               Number(termFee.activity_fee) + Number(termFee.other_fees));
          }
        }

        // Calculate total paid up to and including this payment
        const paymentsUpToThis = sortedPayments.slice(0, index + 1);
        const totalPaidUpToThis = paymentsUpToThis.reduce(
          (sum, p) => sum + Number(p.amount_paid), 0
        );

        // Cumulative balance = fees - paid (positive = owes, negative = credit)
        const cumulativeBalance = totalFeesUpToTerm - totalPaidUpToThis;

        balanceMap[payment.id] = {
          cumulativeBalance,
          totalFees: totalFeesUpToTerm,
          totalPaid: totalPaidUpToThis,
        };
      });
    });

    return balanceMap;
  }, [allYearPayments, feeStructures]);

  // Filter payments for display
  const filteredPayments = useMemo(() => {
    let payments = allYearPayments || [];
    
    // Filter by term
    if (filterTerm !== "all") {
      payments = payments.filter(p => p.term === filterTerm);
    }

    // Filter by search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      payments = payments.filter(payment =>
        payment.student?.full_name?.toLowerCase().includes(search) ||
        payment.student?.admission_number?.toLowerCase().includes(search) ||
        payment.receipt_number?.toLowerCase().includes(search)
      );
    }

    // Sort by date descending for display
    return [...payments].sort((a, b) => 
      new Date(b.payment_date || 0).getTime() - new Date(a.payment_date || 0).getTime()
    );
  }, [allYearPayments, filterTerm, searchTerm]);

  // Calculate summary totals from running balances (latest balance per student)
  const summaryTotals = useMemo(() => {
    if (!allYearPayments || !runningBalances) {
      return { totalCollected: 0, totalOutstanding: 0, totalCredits: 0, netBalance: 0 };
    }

    // Get latest payment per student
    const latestByStudent: { [studentId: string]: typeof allYearPayments[0] } = {};
    
    allYearPayments.forEach(payment => {
      const studentId = payment.student_id;
      const existing = latestByStudent[studentId];
      
      if (!existing || new Date(payment.payment_date || 0) > new Date(existing.payment_date || 0)) {
        latestByStudent[studentId] = payment;
      }
    });

    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalCredits = 0;

    // Total collected is sum of all payments
    totalCollected = allYearPayments.reduce((sum, p) => sum + Number(p.amount_paid), 0);

    // Outstanding and credits from latest cumulative balance per student
    Object.values(latestByStudent).forEach(payment => {
      const balance = runningBalances[payment.id]?.cumulativeBalance || 0;
      if (balance > 0) {
        totalOutstanding += balance;
      } else if (balance < 0) {
        totalCredits += Math.abs(balance);
      }
    });

    const netBalance = totalOutstanding - totalCredits;

    return { totalCollected, totalOutstanding, totalCredits, netBalance };
  }, [allYearPayments, runningBalances]);

  const isLoading = !allYearPayments;

  const [feeBreakdown, setFeeBreakdown] = useState<{
    tuitionFee: number;
    boardingFee: number;
    activityFee: number;
    otherFees: number;
    creditFromPreviousTerms?: number;
    debtFromPreviousTerms?: number;
  } | null>(null);

  const [runningBalanceData, setRunningBalanceData] = useState<{
    totalFeesYear: number;
    totalPaidYear: number;
    cumulativeBalance: number;
  } | null>(null);

  const handleViewReceipt = async (payment: any) => {
    const currentTerm = parseInt(payment.term);
    const currentYear = payment.year;
    const studentClass = payment.student?.class || "";
    const studentId = payment.student_id;

    const { data: feeStructure } = await supabase
      .from("fee_structures")
      .select("tuition_fee, boarding_fee, activity_fee, other_fees, total_fee")
      .eq("class_name", studentClass)
      .eq("term", payment.term)
      .eq("year", currentYear)
      .maybeSingle();

    const { data: allFeeStructures } = await supabase
      .from("fee_structures")
      .select("term, total_fee, tuition_fee, boarding_fee, activity_fee, other_fees")
      .eq("class_name", studentClass)
      .eq("year", currentYear);

    const { data: allPayments } = await supabase
      .from("fee_payments")
      .select("term, amount_paid, payment_date")
      .eq("student_id", studentId)
      .eq("year", currentYear)
      .lte("payment_date", payment.payment_date || new Date().toISOString());

    let totalFeesYear = 0;
    let totalPaidYear = 0;

    for (let t = 1; t <= currentTerm; t++) {
      const termFeeStructure = allFeeStructures?.find(fs => fs.term === t.toString());
      const termFee = termFeeStructure
        ? (Number(termFeeStructure.total_fee) || 
           (Number(termFeeStructure.tuition_fee) + Number(termFeeStructure.boarding_fee) + 
            Number(termFeeStructure.activity_fee) + Number(termFeeStructure.other_fees)))
        : 0;
      
      const termPayments = allPayments
        ?.filter(p => p.term === t.toString())
        .reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;

      totalFeesYear += termFee;
      totalPaidYear += termPayments;
    }

    const cumulativeBalance = totalFeesYear - totalPaidYear;

    let previousTermsBalance = 0;

    if (currentTerm > 1) {
      const previousFeeStructures = allFeeStructures?.filter(fs => parseInt(fs.term) < currentTerm);
      const previousPayments = allPayments?.filter(p => parseInt(p.term) < currentTerm);

      const totalPreviousFeesDue = previousFeeStructures?.reduce((sum, fs) => {
        const termTotal = Number(fs.total_fee) || 
          (Number(fs.tuition_fee) + Number(fs.boarding_fee) + 
           Number(fs.activity_fee) + Number(fs.other_fees));
        return sum + termTotal;
      }, 0) || 0;

      const totalPreviousPaymentsMade = previousPayments?.reduce(
        (sum, p) => sum + Number(p.amount_paid), 
        0
      ) || 0;

      previousTermsBalance = totalPreviousFeesDue - totalPreviousPaymentsMade;
    }

    const creditFromPreviousTerms = previousTermsBalance < 0 ? Math.abs(previousTermsBalance) : 0;
    const debtFromPreviousTerms = previousTermsBalance > 0 ? previousTermsBalance : 0;

    setFeeBreakdown(feeStructure ? {
      tuitionFee: Number(feeStructure.tuition_fee),
      boardingFee: Number(feeStructure.boarding_fee),
      activityFee: Number(feeStructure.activity_fee),
      otherFees: Number(feeStructure.other_fees),
      creditFromPreviousTerms,
      debtFromPreviousTerms,
    } : null);

    setRunningBalanceData({
      totalFeesYear,
      totalPaidYear,
      cumulativeBalance,
    });

    setSelectedPayment({
      receiptNumber: payment.receipt_number || "N/A",
      studentName: payment.student?.full_name || "Unknown",
      admissionNumber: payment.student?.admission_number || "N/A",
      studentClass: payment.student?.class || "N/A",
      term: payment.term,
      year: payment.year.toString(),
      amountDue: Number(payment.amount_due),
      amountPaid: Number(payment.amount_paid),
      balance: Number(payment.balance),
      paymentDate: payment.payment_date ? new Date(payment.payment_date) : new Date(),
      recordedBy: "Bursar",
    });
    setShowReceipt(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>View all recorded fee payments with cumulative balances</CardDescription>
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
              <Select value={filterTerm} onValueChange={setFilterTerm}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  <SelectItem value="1">Term 1</SelectItem>
                  <SelectItem value="2">Term 2</SelectItem>
                  <SelectItem value="3">Term 3</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears?.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Net Balance Summary - Prominent Display */}
          <div className="mt-4 p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Net Balance Summary</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Collected</p>
                <p className="text-lg font-bold text-green-600">
                  KES {summaryTotals.totalCollected.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Outstanding</p>
                <p className="text-lg font-bold text-amber-600">
                  KES {summaryTotals.totalOutstanding.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Credits</p>
                <p className="text-lg font-bold text-blue-600">
                  KES {summaryTotals.totalCredits.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-2 rounded-lg bg-background border">
                <p className="text-xs text-muted-foreground">Net Position</p>
                <div className="flex items-center justify-center gap-1">
                  {summaryTotals.netBalance > 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-amber-600" />
                      <p className="text-lg font-bold text-amber-600">
                        KES {summaryTotals.netBalance.toLocaleString()}
                      </p>
                    </>
                  ) : summaryTotals.netBalance < 0 ? (
                    <>
                      <TrendingDown className="h-4 w-4 text-green-600" />
                      <p className="text-lg font-bold text-green-600">
                        KES {Math.abs(summaryTotals.netBalance).toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <p className="text-lg font-bold text-muted-foreground">KES 0</p>
                  )}
                </div>
                <p className="text-xs mt-1">
                  {summaryTotals.netBalance > 0 
                    ? "School is owed" 
                    : summaryTotals.netBalance < 0 
                    ? "Credit surplus" 
                    : "Balanced"}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-4">Loading...</p>
          ) : filteredPayments?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No payments recorded for the selected period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Cumulative Balance</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments?.map((payment) => {
                    const balanceData = runningBalances[payment.id];
                    const cumulativeBalance = balanceData?.cumulativeBalance || 0;
                    
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="text-sm">
                          {payment.payment_date
                            ? format(new Date(payment.payment_date), "dd/MM/yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1 rounded">
                            {payment.receipt_number || "-"}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.student?.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {payment.student?.admission_number}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{payment.student?.class}</TableCell>
                        <TableCell>Term {payment.term}</TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          +{Number(payment.amount_paid).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {cumulativeBalance < 0 ? (
                            <Badge className="bg-green-500 hover:bg-green-600">
                              Credit {Math.abs(cumulativeBalance).toLocaleString()}
                            </Badge>
                          ) : cumulativeBalance > 0 ? (
                            <Badge variant="destructive">
                              Due {cumulativeBalance.toLocaleString()}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Cleared</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewReceipt(payment)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ReceiptModal
        open={showReceipt}
        onClose={() => setShowReceipt(false)}
        payment={selectedPayment}
        feeBreakdown={feeBreakdown}
        runningBalance={runningBalanceData}
      />
    </>
  );
};

export default PaymentHistoryView;
