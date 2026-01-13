// Fee calculation utilities for rolling balance system

export interface TermBalance {
  term: number;
  year: number;
  termFee: number;
  termPayments: number;
  termBalance: number;        // This term only (fee - payments)
  carryForward: number;       // Credit (-) or debt (+) from previous terms
  netBalance: number;         // termBalance + carryForward (positive = owes, negative = credit)
  status: 'credit' | 'due' | 'cleared';
}

export interface FeeStructure {
  term: string;
  year: number;
  class_name: string;
  total_fee: number;
  tuition_fee: number;
  boarding_fee: number;
  activity_fee: number;
  other_fees: number;
}

export interface Payment {
  term: string;
  year: number;
  amount_paid: number;
  student_id: string;
}

/**
 * Calculate running balance for a student across all terms in a year
 * Positive balance = student owes money
 * Negative balance = student has credit (overpaid)
 */
export function calculateYearlyBalance(
  studentClass: string,
  year: number,
  feeStructures: FeeStructure[],
  payments: Payment[]
): TermBalance[] {
  const terms = [1, 2, 3];
  const termBalances: TermBalance[] = [];
  let runningBalance = 0; // Running balance: positive = debt, negative = credit

  for (const term of terms) {
    // Get fee structure for this term
    const feeStructure = feeStructures.find(
      (f) => f.class_name === studentClass && 
             f.year === year && 
             f.term === term.toString()
    );

    const termFee = feeStructure 
      ? (Number(feeStructure.total_fee) || 
         (Number(feeStructure.tuition_fee) + Number(feeStructure.boarding_fee) + 
          Number(feeStructure.activity_fee) + Number(feeStructure.other_fees)))
      : 0;

    // Get payments for this term
    const termPayments = payments
      .filter((p) => p.term === term.toString() && p.year === year)
      .reduce((sum, p) => sum + Number(p.amount_paid), 0);

    // Term balance (before carry-forward)
    const termBalance = termFee - termPayments;

    // Carry forward from previous terms
    const carryForward = runningBalance;

    // Net balance = term balance + carry forward
    // Positive = owes money, Negative = has credit
    const netBalance = termBalance + carryForward;

    // Update running balance for next term
    runningBalance = netBalance;

    // Determine status
    let status: 'credit' | 'due' | 'cleared';
    if (netBalance < 0) {
      status = 'credit';
    } else if (netBalance > 0) {
      status = 'due';
    } else {
      status = 'cleared';
    }

    termBalances.push({
      term,
      year,
      termFee,
      termPayments,
      termBalance,
      carryForward,
      netBalance,
      status,
    });
  }

  return termBalances;
}

/**
 * Calculate the amount due for a specific term, considering carry-forward from previous terms
 * Returns the net amount due (can be negative if credit exists)
 */
export function calculateTermNetDue(
  studentClass: string,
  term: number,
  year: number,
  feeStructures: FeeStructure[],
  payments: Payment[]
): { 
  termFee: number;
  previousPayments: number;
  carryForwardCredit: number;
  netDue: number;
  status: 'credit' | 'due' | 'cleared';
} {
  const termBalances = calculateYearlyBalance(studentClass, year, feeStructures, payments);
  const currentTermBalance = termBalances.find((t) => t.term === term);

  if (!currentTermBalance) {
    return {
      termFee: 0,
      previousPayments: 0,
      carryForwardCredit: 0,
      netDue: 0,
      status: 'cleared',
    };
  }

  // Calculate current term payments
  const currentTermPayments = payments
    .filter((p) => p.term === term.toString() && p.year === year)
    .reduce((sum, p) => sum + Number(p.amount_paid), 0);

  // Carry forward credit is negative of carryForward (if credit exists)
  const carryForwardCredit = currentTermBalance.carryForward < 0 
    ? Math.abs(currentTermBalance.carryForward) 
    : 0;

  return {
    termFee: currentTermBalance.termFee,
    previousPayments: currentTermPayments,
    carryForwardCredit,
    netDue: currentTermBalance.netBalance,
    status: currentTermBalance.status,
  };
}

/**
 * Format balance for display with appropriate styling
 * @param amount - The balance amount (positive = due, negative = credit)
 * @returns Object with formatted text and CSS class name
 */
export function formatBalance(amount: number): {
  text: string;
  className: string;
  isCredit: boolean;
  isDue: boolean;
  isCleared: boolean;
} {
  if (amount < 0) {
    return { 
      text: `Credit: KES ${Math.abs(amount).toLocaleString()}`, 
      className: 'text-green-600',
      isCredit: true,
      isDue: false,
      isCleared: false,
    };
  } else if (amount > 0) {
    return { 
      text: `Due: KES ${amount.toLocaleString()}`, 
      className: 'text-destructive',
      isCredit: false,
      isDue: true,
      isCleared: false,
    };
  }
  return { 
    text: 'Cleared', 
    className: 'text-muted-foreground',
    isCredit: false,
    isDue: false,
    isCleared: true,
  };
}

/**
 * Format amount with sign indicator
 */
export function formatAmountWithSign(amount: number): string {
  if (amount < 0) {
    return `-KES ${Math.abs(amount).toLocaleString()}`;
  }
  return `KES ${amount.toLocaleString()}`;
}

/**
 * Calculate yearly totals for a student
 */
export function calculateYearlyTotals(
  studentClass: string,
  year: number,
  feeStructures: FeeStructure[],
  payments: Payment[]
): {
  totalFees: number;
  totalPaid: number;
  finalBalance: number;
  status: 'credit' | 'due' | 'cleared';
} {
  const termBalances = calculateYearlyBalance(studentClass, year, feeStructures, payments);
  
  const totalFees = termBalances.reduce((sum, t) => sum + t.termFee, 0);
  const totalPaid = termBalances.reduce((sum, t) => sum + t.termPayments, 0);
  const finalBalance = totalFees - totalPaid;

  let status: 'credit' | 'due' | 'cleared';
  if (finalBalance < 0) {
    status = 'credit';
  } else if (finalBalance > 0) {
    status = 'due';
  } else {
    status = 'cleared';
  }

  return { totalFees, totalPaid, finalBalance, status };
}
