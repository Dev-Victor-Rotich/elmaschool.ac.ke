import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GraduationCap, DollarSign, Calendar, BookOpen, MessageSquare, Mail, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const StudentPortal = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [studentData, setStudentData] = useState<any>(null);
  const [studentId, setStudentId] = useState<string>("");
  const [feeData, setFeeData] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isStudentLeader, setIsStudentLeader] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

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

      // Load fee payments
      const { data: fees } = await supabase
        .from("fee_payments")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false });

      setFeeData(fees || []);

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

  if (!studentData) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

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

          {/* Fee Balance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Fee Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {feeData.length > 0 ? (
                <div className="space-y-2">
                  {feeData.slice(0, 3).map((fee) => (
                    <div key={fee.id} className="flex justify-between items-center">
                      <span className="text-sm">{fee.term} {fee.year}</span>
                      <Badge variant={fee.balance > 0 ? "destructive" : "default"}>
                        Balance: KES {fee.balance}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No fee records yet</p>
              )}
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