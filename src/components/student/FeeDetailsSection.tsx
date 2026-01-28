import { DollarSign, TrendingUp, TrendingDown, Receipt, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useState } from "react";
import { calculateYearlyTotals, calculateYearlyBalance, formatBalance } from "@/lib/fee-utils";

interface FeeDetailsSectionProps {
  studentData: any;
  feePayments: any[];
  feeStructures: any[];
  currentYear: number;
}

const FeeDetailsSection = ({ studentData, feePayments, feeStructures, currentYear }: FeeDetailsSectionProps) => {
  const [selectedTerm, setSelectedTerm] = useState<string>("all");

  // Calculate cumulative balance (yearly)
  const cumulativeData = studentData?.class 
    ? calculateYearlyTotals(
        studentData.class,
        currentYear,
        feeStructures.map((fs: any) => ({
          term: fs.term,
          year: fs.year,
          class_name: fs.class_name,
          total_fee: fs.total_fee,
          tuition_fee: fs.tuition_fee,
          boarding_fee: fs.boarding_fee,
          activity_fee: fs.activity_fee,
          other_fees: fs.other_fees,
        })),
        feePayments.map((p: any) => ({
          term: p.term,
          year: p.year,
          amount_paid: p.amount_paid,
          student_id: p.student_id,
        }))
      )
    : { totalFees: 0, totalPaid: 0, finalBalance: 0, status: 'cleared' as const };

  // Calculate term-by-term balances
  const termBalances = studentData?.class 
    ? calculateYearlyBalance(
        studentData.class,
        currentYear,
        feeStructures.map((fs: any) => ({
          ...fs,
          total_fee: Number(fs.total_fee) || 
            (Number(fs.tuition_fee) + Number(fs.boarding_fee) + Number(fs.activity_fee) + Number(fs.other_fees)),
        })),
        feePayments.map((p: any) => ({
          term: p.term,
          year: p.year,
          amount_paid: Number(p.amount_paid),
          student_id: p.student_id,
        }))
      )
    : [];

  // Calculate term-specific data when a term is selected
  const getTermData = () => {
    if (selectedTerm === "all") {
      return {
        fees: cumulativeData.totalFees,
        paid: cumulativeData.totalPaid,
        balance: cumulativeData.finalBalance,
        carryForward: 0,
        label: `${currentYear} Annual`,
      };
    }

    const termNum = parseInt(selectedTerm);
    const termData = termBalances.find(t => t.term === termNum);
    
    if (!termData) {
      return {
        fees: 0,
        paid: 0,
        balance: 0,
        carryForward: 0,
        label: `Term ${selectedTerm}`,
      };
    }

    return {
      fees: termData.termFee,
      paid: termData.termPayments,
      balance: termData.netBalance,
      carryForward: termData.carryForward,
      label: `Term ${selectedTerm}`,
    };
  };

  const termData = getTermData();

  // Calculate running balance for each payment
  const getRunningBalanceAtPayment = (paymentIndex: number) => {
    const paymentsAsc = [...feePayments].reverse();
    const targetPayment = feePayments[paymentIndex];
    
    let totalPaid = 0;
    for (const p of paymentsAsc) {
      totalPaid += Number(p.amount_paid);
      if (p.id === targetPayment.id) break;
    }

    let totalFees = 0;
    for (let t = 1; t <= parseInt(targetPayment.term); t++) {
      const termFee = feeStructures.find((fs: any) => fs.term === t.toString());
      if (termFee) {
        totalFees += Number(termFee.total_fee) || 
          (Number(termFee.tuition_fee) + Number(termFee.boarding_fee) + 
           Number(termFee.activity_fee) + Number(termFee.other_fees));
      }
    }

    return totalFees - totalPaid;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          Fee Details - {currentYear}
        </CardTitle>
        <CardDescription>View your payment history, fee structure, and status</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">
              <TrendingUp className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="history">
              <Receipt className="w-4 h-4 mr-2" />
              Payment History
            </TabsTrigger>
            <TabsTrigger value="structure">
              <FileText className="w-4 h-4 mr-2" />
              Fee Structure
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Term Selector */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-medium">View:</span>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Year</SelectItem>
                  <SelectItem value="1">Term 1</SelectItem>
                  <SelectItem value="2">Term 2</SelectItem>
                  <SelectItem value="3">Term 3</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline" className="ml-auto">
                {termData.label}
              </Badge>
            </div>

            {/* Balance Cards */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {selectedTerm === "all" ? `Total Fees (${currentYear})` : `Term ${selectedTerm} Fee`}
                </p>
                <p className="text-2xl font-bold">KES {termData.fees.toLocaleString()}</p>
              </div>
              
              {selectedTerm !== "all" && termData.carryForward !== 0 && (
                <div className={`p-4 rounded-lg ${termData.carryForward < 0 ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
                  <p className="text-sm text-muted-foreground">Carry Forward</p>
                  <p className={`text-2xl font-bold ${termData.carryForward < 0 ? 'text-green-600' : 'text-amber-600'}`}>
                    {termData.carryForward < 0 
                      ? `-KES ${Math.abs(termData.carryForward).toLocaleString()}`
                      : `+KES ${termData.carryForward.toLocaleString()}`
                    }
                  </p>
                  <p className={`text-xs ${termData.carryForward < 0 ? 'text-green-600/70' : 'text-amber-600/70'}`}>
                    {termData.carryForward < 0 ? "Credit from previous terms" : "Balance from previous terms"}
                  </p>
                </div>
              )}
              
              <div className="p-4 bg-green-500/10 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {selectedTerm === "all" ? "Total Paid" : `Term ${selectedTerm} Payments`}
                </p>
                <p className="text-2xl font-bold text-green-600">KES {termData.paid.toLocaleString()}</p>
              </div>
              
              <div className={`p-4 rounded-lg ${
                termData.balance < 0 
                  ? 'bg-green-500/10' 
                  : termData.balance > 0 
                    ? 'bg-amber-500/10' 
                    : 'bg-primary/10'
              }`}>
                <p className="text-sm text-muted-foreground">
                  {termData.balance < 0 ? "Credit Balance" : termData.balance > 0 ? "Outstanding" : "Status"}
                </p>
                <p className={`text-2xl font-bold ${
                  termData.balance < 0 
                    ? 'text-green-600' 
                    : termData.balance > 0 
                      ? 'text-amber-600' 
                      : 'text-green-600'
                }`}>
                  {termData.balance === 0 
                    ? "Cleared" 
                    : termData.balance < 0
                      ? `KES ${Math.abs(termData.balance).toLocaleString()}`
                      : `KES ${termData.balance.toLocaleString()}`
                  }
                </p>
                {termData.balance < 0 && (
                  <p className="text-xs text-green-600/70">
                    Credit {selectedTerm === "all" ? "for the year" : "this term"}
                  </p>
                )}
              </div>
            </div>

            {/* Term Summary when viewing all year */}
            {selectedTerm === "all" && termBalances.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">Term-by-Term Breakdown</h4>
                <div className="grid gap-3 md:grid-cols-3">
                  {termBalances.filter(t => t.termFee > 0).map((term) => (
                    <div 
                      key={term.term} 
                      className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedTerm(term.term.toString())}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Term {term.term}</span>
                        <Badge 
                          variant={term.netBalance < 0 ? "default" : term.netBalance > 0 ? "destructive" : "secondary"}
                          className={term.netBalance < 0 ? "bg-green-500 hover:bg-green-600" : ""}
                        >
                          {term.netBalance < 0 
                            ? `Credit ${Math.abs(term.netBalance).toLocaleString()}` 
                            : term.netBalance > 0 
                              ? `Due ${term.netBalance.toLocaleString()}`
                              : "Cleared"
                          }
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Fee:</span>
                          <span>KES {term.termFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Paid:</span>
                          <span className="text-green-600">KES {term.termPayments.toLocaleString()}</span>
                        </div>
                        {term.carryForward !== 0 && (
                          <div className="flex justify-between">
                            <span>C/F:</span>
                            <span className={term.carryForward < 0 ? "text-green-600" : "text-amber-600"}>
                              {term.carryForward < 0 ? `-${Math.abs(term.carryForward).toLocaleString()}` : `+${term.carryForward.toLocaleString()}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {feePayments.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead className="text-right">Amount Paid</TableHead>
                      <TableHead className="text-right">Running Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feePayments.map((payment: any, index: number) => {
                      const runningBal = getRunningBalanceAtPayment(index);
                      return (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {payment.payment_date 
                              ? format(new Date(payment.payment_date), "dd MMM yyyy")
                              : "-"
                            }
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1 rounded">
                              {payment.receipt_number || "-"}
                            </code>
                          </TableCell>
                          <TableCell>Term {payment.term}</TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            KES {Number(payment.amount_paid).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {runningBal < 0 ? (
                              <Badge className="bg-green-500 hover:bg-green-600">
                                Credit {Math.abs(runningBal).toLocaleString()}
                              </Badge>
                            ) : runningBal > 0 ? (
                              <Badge variant="destructive">
                                Due {runningBal.toLocaleString()}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Cleared</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No payment records yet</p>
            )}
          </TabsContent>

          <TabsContent value="structure">
            {feeStructures.length > 0 ? (
              <div className="space-y-4">
                {feeStructures.map((fs: any) => {
                  const totalFee = Number(fs.total_fee) || 
                    (Number(fs.tuition_fee) + Number(fs.boarding_fee) + 
                     Number(fs.activity_fee) + Number(fs.other_fees));
                  
                  return (
                    <div key={fs.id} className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-3">Term {fs.term}</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Tuition Fee:</span>
                        <span>KES {Number(fs.tuition_fee).toLocaleString()}</span>
                        <span className="text-muted-foreground">Boarding Fee:</span>
                        <span>KES {Number(fs.boarding_fee).toLocaleString()}</span>
                        <span className="text-muted-foreground">Activity Fee:</span>
                        <span>KES {Number(fs.activity_fee).toLocaleString()}</span>
                        <span className="text-muted-foreground">Other Fees:</span>
                        <span>KES {Number(fs.other_fees).toLocaleString()}</span>
                        <span className="font-semibold border-t pt-2">Total:</span>
                        <span className="font-semibold border-t pt-2">
                          KES {totalFee.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No fee structure available for your class
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FeeDetailsSection;
