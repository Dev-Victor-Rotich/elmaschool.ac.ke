import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Search, Printer } from "lucide-react";
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

const PaymentHistoryView = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterTerm, setFilterTerm] = useState("all");
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null);

  const { data: payments, isLoading } = useQuery({
    queryKey: ["payment-history", filterYear, filterTerm],
    queryFn: async () => {
      let query = supabase
        .from("fee_payments")
        .select(`
          *,
          student:students_data(full_name, admission_number, class)
        `)
        .eq("year", parseInt(filterYear))
        .order("payment_date", { ascending: false });

      if (filterTerm !== "all") {
        query = query.eq("term", filterTerm);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filteredPayments = payments?.filter((payment) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      payment.student?.full_name?.toLowerCase().includes(search) ||
      payment.student?.admission_number?.toLowerCase().includes(search) ||
      payment.receipt_number?.toLowerCase().includes(search)
    );
  });

  const totalCollected = filteredPayments?.reduce(
    (sum, p) => sum + Number(p.amount_paid),
    0
  ) || 0;

  const totalOutstanding = filteredPayments?.reduce(
    (sum, p) => sum + Number(p.balance),
    0
  ) || 0;

  const handleViewReceipt = (payment: any) => {
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
              <CardDescription>View all recorded fee payments</CardDescription>
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
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Collected</p>
              <p className="text-lg font-bold text-green-600">
                KES {totalCollected.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Outstanding Balance</p>
              <p className="text-lg font-bold text-amber-600">
                KES {totalOutstanding.toLocaleString()}
              </p>
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
                    <TableHead className="text-right">Amount Due</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments?.map((payment) => (
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
                      <TableCell className="text-right">
                        {Number(payment.amount_due).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        {Number(payment.amount_paid).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(payment.balance) > 0 ? (
                          <Badge variant="destructive">
                            {Number(payment.balance).toLocaleString()}
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
                  ))}
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
      />
    </>
  );
};

export default PaymentHistoryView;