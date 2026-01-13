import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { format } from "date-fns";

interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  payment: {
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
  } | null;
  feeBreakdown?: {
    tuitionFee: number;
    boardingFee: number;
    activityFee: number;
    otherFees: number;
    creditFromPreviousTerms?: number;
    debtFromPreviousTerms?: number;
  };
  runningBalance?: {
    totalFeesYear: number;
    totalPaidYear: number;
    cumulativeBalance: number;
  } | null;
}

const ReceiptModal = ({ open, onClose, payment, feeBreakdown, runningBalance }: ReceiptModalProps) => {
  if (!payment) return null;

  const handlePrint = () => {
    document.body.classList.add('printing-receipt');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-receipt');
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md print:max-w-none print:shadow-none print:border-none">
        <div className="print:block">
          {/* Print-only header buttons */}
          <div className="flex justify-end gap-2 mb-4 print:hidden">
            <Button onClick={handlePrint} size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
            <Button onClick={onClose} variant="outline" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Receipt Content */}
          <div id="receipt-content" className="receipt-printable bg-background p-6 border rounded-lg print:border-2 print:border-foreground">
            {/* Header */}
            <div className="text-center border-b pb-4 mb-4">
              <h1 className="text-xl font-bold">ELMA KAMONONG HIGH SCHOOL</h1>
              <div className="mt-2 inline-block px-3 py-1 bg-primary/10 rounded-full">
                <span className="text-sm font-semibold text-primary">FEE PAYMENT RECEIPT</span>
              </div>
            </div>

            {/* Receipt Details */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <p className="text-muted-foreground">Receipt No:</p>
                <p className="font-semibold">{payment.receiptNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground">Date:</p>
                <p className="font-semibold">{format(payment.paymentDate, "dd MMM yyyy")}</p>
              </div>
            </div>

            {/* Student Info */}
            <div className="bg-muted/50 p-3 rounded-lg mb-4">
              <h3 className="font-semibold mb-2">Student Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Name: </span>
                  <span className="font-medium">{payment.studentName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Adm No: </span>
                  <span className="font-medium">{payment.admissionNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Class: </span>
                  <span className="font-medium">{payment.studentClass}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Term: </span>
                  <span className="font-medium">Term {payment.term}, {payment.year}</span>
                </div>
              </div>
            </div>

            {/* Fee Breakdown */}
            {feeBreakdown && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2 text-sm">Fee Breakdown</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tuition Fee:</span>
                    <span>KES {feeBreakdown.tuitionFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Boarding Fee:</span>
                    <span>KES {feeBreakdown.boardingFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Activity Fee:</span>
                    <span>KES {feeBreakdown.activityFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Other Fees:</span>
                    <span>KES {feeBreakdown.otherFees.toLocaleString()}</span>
                  </div>
                  {feeBreakdown.debtFromPreviousTerms && feeBreakdown.debtFromPreviousTerms > 0 && (
                    <div className="flex justify-between text-destructive font-medium border-t pt-1 mt-1">
                      <span>Balance from Previous Terms:</span>
                      <span>+ KES {feeBreakdown.debtFromPreviousTerms.toLocaleString()}</span>
                    </div>
                  )}
                  {feeBreakdown.creditFromPreviousTerms && feeBreakdown.creditFromPreviousTerms > 0 && (
                    <div className="flex justify-between text-green-600 font-medium border-t pt-1 mt-1">
                      <span>Credit from Previous Terms:</span>
                      <span>- KES {feeBreakdown.creditFromPreviousTerms.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* This Payment Summary */}
            <div className="border-t border-b py-3 mb-4">
              <h3 className="font-semibold mb-2 text-sm">This Payment</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount Due This Term:</span>
                  <span className="font-medium">KES {payment.amountDue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span className="font-semibold text-green-600">KES {payment.amountPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span>{payment.balance < 0 ? "Credit This Transaction:" : "Balance This Transaction:"}</span>
                  <span className={payment.balance < 0 ? "text-green-600" : payment.balance > 0 ? "text-destructive" : "text-green-600"}>
                    {payment.balance < 0 
                      ? `KES ${Math.abs(payment.balance).toLocaleString()} (Credit)`
                      : payment.balance > 0 
                        ? `KES ${payment.balance.toLocaleString()}`
                        : "Cleared"
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Running Balance Summary - The cumulative balance */}
            {runningBalance && (
              <div className={`p-4 rounded-lg mb-4 ${
                runningBalance.cumulativeBalance < 0 
                  ? 'bg-green-500/10 border border-green-500/30' 
                  : runningBalance.cumulativeBalance > 0 
                    ? 'bg-amber-500/10 border border-amber-500/30' 
                    : 'bg-primary/10 border border-primary/30'
              }`}>
                <h3 className="font-bold text-center mb-3">CUMULATIVE BALANCE STATUS</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Fees (Year to Term {payment.term}):</span>
                    <span className="font-medium">KES {runningBalance.totalFeesYear.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Paid (Year to Term {payment.term}):</span>
                    <span className="font-semibold text-green-600">KES {runningBalance.totalPaidYear.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-base">
                        {runningBalance.cumulativeBalance < 0 ? "TOTAL CREDIT:" : "TOTAL BALANCE DUE:"}
                      </span>
                      <span className={`font-bold text-lg ${
                        runningBalance.cumulativeBalance < 0 
                          ? 'text-green-600' 
                          : runningBalance.cumulativeBalance > 0 
                            ? 'text-destructive' 
                            : 'text-green-600'
                      }`}>
                        {runningBalance.cumulativeBalance < 0 
                          ? `KES ${Math.abs(runningBalance.cumulativeBalance).toLocaleString()}`
                          : runningBalance.cumulativeBalance > 0 
                            ? `KES ${runningBalance.cumulativeBalance.toLocaleString()}`
                            : "FULLY CLEARED"
                        }
                      </span>
                    </div>
                    {runningBalance.cumulativeBalance < 0 && (
                      <p className="text-xs text-green-600 text-center mt-2">
                        ✓ This credit will automatically apply to future fees
                      </p>
                    )}
                    {runningBalance.cumulativeBalance > 0 && (
                      <p className="text-xs text-amber-600 text-center mt-2">
                        Outstanding balance to be cleared
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-xs text-muted-foreground">
              <p>Recorded by: {payment.recordedBy}</p>
              <p className="mt-2">This is a computer-generated receipt.</p>
              <p className="mt-4 font-medium">Thank you for your payment!</p>
            </div>

            {/* Signature Line (Print only) */}
            <div className="mt-8 pt-4 border-t print:block hidden">
              <div className="flex justify-between">
                <div className="text-center">
                  <div className="w-32 border-b border-foreground mb-1"></div>
                  <p className="text-xs">Bursar's Signature</p>
                </div>
                <div className="text-center">
                  <div className="w-32 border-b border-foreground mb-1"></div>
                  <p className="text-xs">Official Stamp</p>
                </div>
              </div>
            </div>

            {/* Action buttons at bottom for visibility after scrolling */}
            <div className="flex justify-center gap-3 mt-6 pt-4 border-t print:hidden">
              <Button onClick={handlePrint} size="sm" className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Print Receipt
              </Button>
              <Button onClick={onClose} variant="outline" size="sm" className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptModal;