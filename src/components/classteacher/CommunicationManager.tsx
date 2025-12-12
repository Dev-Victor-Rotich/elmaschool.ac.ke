import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, MessageSquare, Users, Filter, CheckCircle, Clock, Eye } from "lucide-react";
import { toast } from "sonner";

interface CommunicationManagerProps {
  assignedClass: string;
}

type FilterType = "all" | "subject" | "performance" | "improved" | "dropped" | "custom";

export function CommunicationManager({ assignedClass }: CommunicationManagerProps) {
  const queryClient = useQueryClient();
  const [composeOpen, setComposeOpen] = useState(false);
  const [viewMessageOpen, setViewMessageOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  
  // Form state
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Fetch students
  const { data: students = [] } = useQuery({
    queryKey: ["class-students", assignedClass],
    queryFn: async () => {
      if (!assignedClass) return [];
      const { data, error } = await supabase
        .from("students_data")
        .select("id, full_name, admission_number")
        .eq("class", assignedClass)
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!assignedClass,
  });

  // Fetch subject offerings
  const { data: subjectOfferings = [] } = useQuery({
    queryKey: ["class-subject-offerings", assignedClass],
    queryFn: async () => {
      if (!assignedClass) return [];
      const { data, error } = await supabase
        .from("class_subject_offerings")
        .select("*, subjects(id, title)")
        .eq("class_name", assignedClass);
      if (error) throw error;
      return data || [];
    },
    enabled: !!assignedClass,
  });

  // Fetch student subjects (for filtering by subject)
  const { data: studentSubjects = [] } = useQuery({
    queryKey: ["student-subjects", assignedClass],
    queryFn: async () => {
      if (!assignedClass) return [];
      const studentIds = students.map(s => s.id);
      if (studentIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("student_subjects")
        .select("student_id, subject_id, sub_subject, subjects(title)")
        .in("student_id", studentIds);
      if (error) throw error;
      return data || [];
    },
    enabled: students.length > 0,
  });

  // Fetch latest exam results for performance filtering
  const { data: latestResults = [] } = useQuery({
    queryKey: ["latest-results", assignedClass],
    queryFn: async () => {
      if (!assignedClass) return [];
      const studentIds = students.map(s => s.id);
      if (studentIds.length === 0) return [];
      
      // Get latest exam
      const { data: latestExam } = await supabase
        .from("exams")
        .select("id")
        .eq("class_name", assignedClass)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (!latestExam) return [];
      
      const { data, error } = await supabase
        .from("academic_results")
        .select("student_id, marks, grade")
        .eq("exam_id", latestExam.id)
        .in("student_id", studentIds);
      if (error) throw error;
      return data || [];
    },
    enabled: students.length > 0,
  });

  // Fetch sent messages
  const { data: sentMessages = [] } = useQuery({
    queryKey: ["class-messages", assignedClass],
    queryFn: async () => {
      if (!assignedClass) return [];
      const { data, error } = await supabase
        .from("class_messages")
        .select("*, message_recipients(id, student_id, is_read)")
        .eq("class_name", assignedClass)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!assignedClass,
  });

  // Get unique subjects
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set<string>();
    subjectOfferings.forEach((o: any) => {
      const label = o.sub_subject ? `${o.subjects?.title} - ${o.sub_subject}` : o.subjects?.title;
      if (label) subjects.add(label);
    });
    return Array.from(subjects).sort();
  }, [subjectOfferings]);

  // Calculate filtered students
  const filteredStudents = useMemo(() => {
    if (filterType === "all") {
      return students;
    }

    if (filterType === "subject" && filterSubject) {
      const subjectStudentIds = new Set(
        studentSubjects
          .filter((ss: any) => {
            const label = ss.sub_subject ? `${ss.subjects?.title} - ${ss.sub_subject}` : ss.subjects?.title;
            return label === filterSubject;
          })
          .map((ss: any) => ss.student_id)
      );
      return students.filter(s => subjectStudentIds.has(s.id));
    }

    if (filterType === "performance" && filterGrade) {
      const gradeStudentIds = new Set(
        latestResults
          .filter((r: any) => r.grade === filterGrade)
          .map((r: any) => r.student_id)
      );
      return students.filter(s => gradeStudentIds.has(s.id));
    }

    if (filterType === "improved") {
      // For now, return students with above-average marks
      const avgMarks = latestResults.length > 0 
        ? latestResults.reduce((sum: number, r: any) => sum + r.marks, 0) / latestResults.length 
        : 50;
      const improvedIds = new Set(
        latestResults
          .filter((r: any) => r.marks >= avgMarks + 10)
          .map((r: any) => r.student_id)
      );
      return students.filter(s => improvedIds.has(s.id));
    }

    if (filterType === "dropped") {
      const avgMarks = latestResults.length > 0 
        ? latestResults.reduce((sum: number, r: any) => sum + r.marks, 0) / latestResults.length 
        : 50;
      const droppedIds = new Set(
        latestResults
          .filter((r: any) => r.marks < avgMarks - 10)
          .map((r: any) => r.student_id)
      );
      return students.filter(s => droppedIds.has(s.id));
    }

    if (filterType === "custom") {
      return students.filter(s => selectedStudents.includes(s.id));
    }

    return students;
  }, [students, filterType, filterSubject, filterGrade, studentSubjects, latestResults, selectedStudents]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!subject.trim() || !message.trim()) {
        throw new Error("Subject and message are required");
      }
      
      if (filteredStudents.length === 0) {
        throw new Error("No recipients selected");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create message
      const { data: messageData, error: messageError } = await supabase
        .from("class_messages")
        .insert({
          sender_id: user.id,
          class_name: assignedClass,
          subject: subject.trim(),
          message: message.trim(),
          filter_type: filterType,
          filter_value: { filterSubject, filterGrade, selectedStudents }
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Create recipients
      const recipients = filteredStudents.map(s => ({
        message_id: messageData.id,
        student_id: s.id
      }));

      const { error: recipientError } = await supabase
        .from("message_recipients")
        .insert(recipients);

      if (recipientError) throw recipientError;

      return messageData;
    },
    onSuccess: () => {
      toast.success(`Message sent to ${filteredStudents.length} student(s)`);
      queryClient.invalidateQueries({ queryKey: ["class-messages"] });
      setComposeOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send message");
    },
  });

  const resetForm = () => {
    setSubject("");
    setMessage("");
    setFilterType("all");
    setFilterSubject("");
    setFilterGrade("");
    setSelectedStudents([]);
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const viewMessageDetails = (msg: any) => {
    setSelectedMessage(msg);
    setViewMessageOpen(true);
  };

  const grades = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "E"];

  return (
    <Tabs defaultValue="compose" className="space-y-4">
      <TabsList>
        <TabsTrigger value="compose">
          <Send className="w-4 h-4 mr-2" />
          Compose
        </TabsTrigger>
        <TabsTrigger value="sent">
          <MessageSquare className="w-4 h-4 mr-2" />
          Sent Messages
        </TabsTrigger>
      </TabsList>

      <TabsContent value="compose">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Compose Form */}
          <Card>
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
              <CardDescription>Send targeted messages to students in {assignedClass}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Filter Recipients</Label>
                <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select filter type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="subject">By Subject</SelectItem>
                    <SelectItem value="performance">By Grade</SelectItem>
                    <SelectItem value="improved">Top Performers</SelectItem>
                    <SelectItem value="dropped">Needs Attention</SelectItem>
                    <SelectItem value="custom">Custom Selection</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filterType === "subject" && (
                <div className="space-y-2">
                  <Label>Select Subject</Label>
                  <Select value={filterSubject} onValueChange={setFilterSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueSubjects.map(subj => (
                        <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {filterType === "performance" && (
                <div className="space-y-2">
                  <Label>Select Grade</Label>
                  <Select value={filterGrade} onValueChange={setFilterGrade}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {filterType === "custom" && (
                <div className="space-y-2">
                  <Label>Select Students</Label>
                  <ScrollArea className="h-40 border rounded-md p-2">
                    {students.map(student => (
                      <div key={student.id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => toggleStudentSelection(student.id)}
                        />
                        <span className="text-sm">{student.full_name}</span>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}

              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  placeholder="Message subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                />
              </div>

              <Button 
                className="w-full" 
                onClick={() => sendMessageMutation.mutate()}
                disabled={sendMessageMutation.isPending || !subject.trim() || !message.trim() || filteredStudents.length === 0}
              >
                <Send className="w-4 h-4 mr-2" />
                {sendMessageMutation.isPending ? "Sending..." : `Send to ${filteredStudents.length} Student(s)`}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Recipients Preview
              </CardTitle>
              <CardDescription>
                {filteredStudents.length} student(s) will receive this message
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                {filteredStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No students match the selected filter
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredStudents.map(student => (
                      <div key={student.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                        <span className="text-sm font-medium">{student.full_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {student.admission_number}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="sent">
        <Card>
          <CardHeader>
            <CardTitle>Sent Messages</CardTitle>
            <CardDescription>View messages you've sent to students</CardDescription>
          </CardHeader>
          <CardContent>
            {sentMessages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No messages sent yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Read Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sentMessages.map((msg: any) => {
                    const totalRecipients = msg.message_recipients?.length || 0;
                    const readCount = msg.message_recipients?.filter((r: any) => r.is_read).length || 0;
                    
                    return (
                      <TableRow key={msg.id}>
                        <TableCell className="font-medium">{msg.subject}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{totalRecipients} students</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {readCount === totalRecipients ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-yellow-600" />
                            )}
                            <span className="text-sm">{readCount}/{totalRecipients}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewMessageDetails(msg)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* View Message Dialog */}
      <Dialog open={viewMessageOpen} onOpenChange={setViewMessageOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
            <DialogDescription>
              Sent on {selectedMessage && new Date(selectedMessage.created_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md">
              <p className="text-sm whitespace-pre-wrap">{selectedMessage?.message}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Recipients ({selectedMessage?.message_recipients?.length || 0})</Label>
              <ScrollArea className="h-40 mt-2 border rounded-md p-2">
                {selectedMessage?.message_recipients?.map((r: any) => {
                  const student = students.find(s => s.id === r.student_id);
                  return (
                    <div key={r.id} className="flex items-center justify-between py-1">
                      <span className="text-sm">{student?.full_name || "Unknown"}</span>
                      <Badge variant={r.is_read ? "default" : "secondary"}>
                        {r.is_read ? "Read" : "Unread"}
                      </Badge>
                    </div>
                  );
                })}
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}