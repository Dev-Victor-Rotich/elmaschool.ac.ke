import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { calculateYearlyTotals } from "@/lib/fee-utils";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StudentPortalSidebar } from "@/components/students/StudentPortalSidebar";
import AcademicAnalytics from "@/components/student/AcademicAnalytics";
import FeeDetailsSection from "@/components/student/FeeDetailsSection";
import DashboardOverview from "@/components/student/DashboardOverview";

const StudentPortal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [studentData, setStudentData] = useState<any>(null);
  const [studentId, setStudentId] = useState<string>("");
  const [events, setEvents] = useState<any[]>([]);
  const [isStudentLeader, setIsStudentLeader] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Handle hash-based routing for sections
    const hash = location.hash.replace("#", "");
    if (hash && ["dashboard", "fees", "academics"].includes(hash)) {
      setActiveSection(hash);
    }
  }, [location.hash]);

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

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    window.location.hash = section;
  };

  if (!studentData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <StudentPortalSidebar 
          activeSection={activeSection} 
          onSectionChange={handleSectionChange}
        />

        <main className="flex-1 overflow-auto">
          <header className="border-b bg-primary text-primary-foreground">
            <div className="px-4 py-4 md:py-6">
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="h-8 w-8 shrink-0 text-primary-foreground hover:bg-primary-foreground/10" />
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
                      {studentData.full_name}
                    </h1>
                    <p className="text-xs sm:text-sm opacity-90 flex flex-wrap items-center gap-1">
                      <span>{studentData.class}</span>
                      <span>•</span>
                      <span>Adm: {studentData.admission_number}</span>
                      {isStudentLeader && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          Student Leader
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>
                {isStudentLeader && (
                  <Button 
                    onClick={() => navigate("/students/content-dashboard")} 
                    variant="secondary"
                    size="sm"
                    className="w-full sm:w-auto justify-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Website Content
                  </Button>
                )}
              </div>
            </div>
          </header>

          <div className="p-4 md:p-6 lg:p-8">
            {activeSection === "dashboard" && (
              <DashboardOverview
                studentData={studentData}
                events={events}
                messages={messages}
                cumulativeData={cumulativeData}
                onOpenMessage={openMessage}
              />
            )}

            {activeSection === "fees" && (
              <FeeDetailsSection
                studentData={studentData}
                feePayments={feePayments}
                feeStructures={feeStructures}
                currentYear={currentYear}
              />
            )}

            {activeSection === "academics" && (
              <AcademicAnalytics 
                studentId={studentId} 
                studentClass={studentData?.class || ""} 
              />
            )}
          </div>
        </main>
      </div>

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
    </SidebarProvider>
  );
};

export default StudentPortal;
