import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GraduationCap, DollarSign, Calendar, BookOpen, MessageSquare, Mail, CheckCircle, Receipt, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { calculateYearlyTotals, formatBalance } from "@/lib/fee-utils";

const StudentPortal = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [studentData, setStudentData] = useState<any>(null);
  const [studentId, setStudentId] = useState<string>("");
  const [results, setResults] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isStudentLeader, setIsStudentLeader] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    // Find student record by linked user_id, or fall back to email
    let studentRecord: any = null;

    const { data: byUser, error: byUserError } = await supabase
      .from("students_data")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (byUserError) {
      console.error("Student lookup by user_id error:", byUserError);
    }

    if (byUser) {
      studentRecord = byUser;
    } else if (session.user.email) {
      const { data: byEmail, error: byEmailError } = await supabase
        .from("students_data")
        .select("id")
        .eq("email", session.user.email)
        .maybeSingle();

      if (byEmailError) {
        console.error("Student lookup by email error:", byEmailError);
      }

      if (byEmail) {
        studentRecord = byEmail;
      }
    }

    if (!studentRecord) {
      toast.error("Access denied. Student account required.");
      navigate("/auth");
      return;
    }

    setStudentId(studentRecord.id);

    // Check if user has student_leader role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "student_leader")
      .maybeSingle();

    setIsStudentLeader(!!roleData);

    await loadStudentData(studentRecord.id);
  };

  const loadStudentData = async (studentId: string) => {
    // Load student data
    const { data: student } = await supabase
      .from("students_data")
      .select("*")
      .eq("id", studentId)
      .single();

    if (student) {
      setStudentData(student);

      // Load academic results
      const { data: academicResults } = await supabase
        .from("academic_results")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false });

      setResults(academicResults || []);
    }

    // Load upcoming events
    const { data: approvedEvents } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true })
      .limit(5);

    setEvents(approvedEvents || []);
  };

  // Fetch payment history for this student
  const { data: feePayments = [] } = useQuery({
    queryKey: ["student-fee-payments", studentId, currentYear],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("fee_payments")
        .select("*")
        .eq("student_id", studentId)
        .eq("year", currentYear)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });

  // Fetch fee structures for this student's class
  const { data: feeStructures = [] } = useQuery({
    queryKey: ["student-fee-structures", studentData?.class, currentYear],
    queryFn: async () => {
      if (!studentData?.class) return [];
      const { data, error } = await supabase
        .from("fee_structures")
        .select("*")
        .eq("class_name", studentData.class)
        .eq("year", currentYear)
        .order("term");
      if (error) throw error;
      return data || [];
    },
    enabled: !!studentData?.class,
  });

  // Calculate cumulative balance
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

  // Fetch messages for this student
  const { data: messages = [] } = useQuery({
    queryKey: ["student-messages", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("message_recipients")
        .select("*, class_messages(*)")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });

  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (recipientId: string) => {
      const { error } = await supabase
        .from("message_recipients")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", recipientId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-messages"] });
    },
  });

  const openMessage = (msg: any) => {
    setSelectedMessage(msg);
    setMessageDialogOpen(true);
    if (!msg.is_read) {
      markAsReadMutation.mutate(msg.id);
    }
  };

  const unreadCount = messages.filter((m: any) => !m.is_read).length;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Calculate running balance for each payment
  const getRunningBalanceAtPayment = (paymentIndex: number) => {
    // Payments are sorted descending, so we need to reverse for calculation
    const paymentsAsc = [...feePayments].reverse();
    const targetPayment = feePayments[paymentIndex];
    
    let totalPaid = 0;
    for (const p of paymentsAsc) {
      totalPaid += Number(p.amount_paid);
      if (p.id === targetPayment.id) break;
    }

    // Calculate total fees up to this payment's term
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

  if (!studentData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const balanceFormatted = formatBalance(cumulativeData.finalBalance);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">{studentData.full_name}</h1>
              <p className="text-sm opacity-90">
                {studentData.class} • Admission: {studentData.admission_number}
                {isStudentLeader && <Badge variant="secondary" className="ml-2">Student Leader</Badge>}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate("/profile")} variant="outline">
                Edit Profile
              </Button>
              <Button onClick={handleLogout} variant="secondary">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Student Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GraduationCap className="w-5 h-5 mr-2" />
                Student Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Parent Name</p>
                <p className="font-medium">{studentData.parent_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Parent Phone</p>
                <p className="font-medium">{studentData.parent_phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Cumulative Fee Status */}
          <Card className={`${
            cumulativeData.finalBalance < 0 
              ? 'border-green-500/50 bg-green-500/5' 
              : cumulativeData.finalBalance > 0 
                ? 'border-amber-500/50 bg-amber-500/5' 
                : 'border-primary/50'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Current Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-2">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {cumulativeData.finalBalance < 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  ) : cumulativeData.finalBalance > 0 ? (
                    <TrendingDown className="w-6 h-6 text-amber-600" />
                  ) : null}
                  <span className={`text-2xl font-bold ${balanceFormatted.className}`}>
                    {cumulativeData.finalBalance < 0 
                      ? `Credit: KES ${Math.abs(cumulativeData.finalBalance).toLocaleString()}`
                      : cumulativeData.finalBalance > 0 
                        ? `Due: KES ${cumulativeData.finalBalance.toLocaleString()}`
                        : "Cleared"
                    }
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Total Fees: KES {cumulativeData.totalFees.toLocaleString()} • 
                  Total Paid: KES {cumulativeData.totalPaid.toLocaleString()}
                </p>
                {cumulativeData.finalBalance < 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Credit applies to future fees
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {events.length > 0 ? (
                <div className="space-y-2">
                  {events.map((event) => (
                    <div key={event.id} className="border-l-2 border-primary pl-2">
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.event_date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming events</p>
              )}
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Messages
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">{unreadCount} new</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {messages.length > 0 ? (
                <div className="space-y-2">
                  {messages.slice(0, 3).map((msg: any) => (
                    <div 
                      key={msg.id} 
                      className={`p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
                        !msg.is_read ? "bg-primary/10 border-l-2 border-primary" : "bg-muted/30"
                      }`}
                      onClick={() => openMessage(msg)}
                    >
                      <div className="flex items-center gap-2">
                        {!msg.is_read ? (
                          <Mail className="w-3 h-3 text-primary" />
                        ) : (
                          <CheckCircle className="w-3 h-3 text-muted-foreground" />
                        )}
                        <p className="text-sm font-medium truncate">{msg.class_messages?.subject}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  {messages.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{messages.length - 3} more messages
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No messages</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Fee Details Section */}
        <Card className="mb-6">
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
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Fees ({currentYear})</p>
                    <p className="text-2xl font-bold">KES {cumulativeData.totalFees.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Paid</p>
                    <p className="text-2xl font-bold text-green-600">KES {cumulativeData.totalPaid.toLocaleString()}</p>
                  </div>
                  <div className={`p-4 rounded-lg ${
                    cumulativeData.finalBalance < 0 
                      ? 'bg-green-500/10' 
                      : cumulativeData.finalBalance > 0 
                        ? 'bg-amber-500/10' 
                        : 'bg-primary/10'
                  }`}>
                    <p className="text-sm text-muted-foreground">
                      {cumulativeData.finalBalance < 0 ? "Credit Balance" : "Outstanding Balance"}
                    </p>
                    <p className={`text-2xl font-bold ${
                      cumulativeData.finalBalance < 0 
                        ? 'text-green-600' 
                        : cumulativeData.finalBalance > 0 
                          ? 'text-amber-600' 
                          : 'text-green-600'
                    }`}>
                      {cumulativeData.finalBalance === 0 
                        ? "Cleared" 
                        : `KES ${Math.abs(cumulativeData.finalBalance).toLocaleString()}`
                      }
                    </p>
                  </div>
                </div>
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

        {/* Academic Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Academic Results
            </CardTitle>
            <CardDescription>Your recent performance</CardDescription>
          </CardHeader>
          <CardContent>
            {results.length > 0 ? (
              <div className="space-y-4">
                {results.map((result) => (
                  <div key={result.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{result.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {result.term} {result.year}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{result.marks}%</p>
                      <Badge>{result.grade}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No results available yet</p>
            )}
          </CardContent>
        </Card>

        {/* All Messages Section */}
        {messages.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                All Messages
              </CardTitle>
              <CardDescription>Messages from your class teacher</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {messages.map((msg: any) => (
                    <div 
                      key={msg.id}
                      className={`p-3 rounded-md cursor-pointer hover:bg-muted/50 transition-colors border ${
                        !msg.is_read ? "bg-primary/5 border-primary/30" : "border-transparent"
                      }`}
                      onClick={() => openMessage(msg)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {!msg.is_read ? (
                            <Mail className="w-4 h-4 text-primary" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                          <p className="font-medium">{msg.class_messages?.subject}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {msg.class_messages?.message}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Message Detail Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedMessage?.class_messages?.subject}</DialogTitle>
            <DialogDescription>
              Received on {selectedMessage && new Date(selectedMessage.created_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm whitespace-pre-wrap text-foreground">
              {selectedMessage?.class_messages?.message || "No message content"}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentPortal;