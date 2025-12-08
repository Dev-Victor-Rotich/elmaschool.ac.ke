import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Calendar, Clock, FileText, ChevronRight, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Json } from "@/integrations/supabase/types";
import { ExamResultsMatrix } from "./ExamResultsMatrix";

interface ExamsManagerProps {
  assignedClass: string;
}

interface TimetableEntry {
  subject: string;
  sub_subject: string;
  date: string;
  start_time: string;
  end_time: string;
}

const TERMS = ["Term 1", "Term 2", "Term 3"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

export function ExamsManager({ assignedClass }: ExamsManagerProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [timetableDialogOpen, setTimetableDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"list" | "details" | "results">("list");
  
  const [formData, setFormData] = useState({
    exam_name: "",
    term: "Term 1",
    year: CURRENT_YEAR,
    start_date: "",
    end_date: "",
  });

  const [timetableEntry, setTimetableEntry] = useState<TimetableEntry>({
    subject: "",
    sub_subject: "",
    date: "",
    start_time: "",
    end_time: "",
  });

  // Fetch exams for this class
  const { data: exams = [] } = useQuery({
    queryKey: ["class-exams", assignedClass],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .eq("class_name", assignedClass)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!assignedClass,
  });

  // Fetch subject offerings for timetable
  const { data: subjectOfferings = [] } = useQuery({
    queryKey: ["class-subject-offerings", assignedClass],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_subject_offerings")
        .select("*, subjects(id, title, sub_subjects)")
        .eq("class_name", assignedClass);
      if (error) throw error;
      return data || [];
    },
    enabled: !!assignedClass,
  });

  // Add/Edit exam mutation
  const saveExamMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const examData = {
        class_name: assignedClass,
        exam_name: data.exam_name,
        term: data.term,
        year: data.year,
        start_date: data.start_date,
        end_date: data.end_date,
        status: new Date(data.start_date) > new Date() ? "upcoming" : 
                new Date(data.end_date) < new Date() ? "completed" : "ongoing",
      };

      if (selectedExam) {
        const { error } = await supabase
          .from("exams")
          .update(examData)
          .eq("id", selectedExam.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("exams").insert(examData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(selectedExam ? "Exam updated" : "Exam created");
      queryClient.invalidateQueries({ queryKey: ["class-exams"] });
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save exam");
    },
  });

  // Delete exam mutation
  const deleteExamMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Exam deleted");
      queryClient.invalidateQueries({ queryKey: ["class-exams"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete exam");
    },
  });

  // Update timetable mutation
  const updateTimetableMutation = useMutation({
    mutationFn: async ({ examId, timetable }: { examId: string; timetable: Json }) => {
      const { error } = await supabase
        .from("exams")
        .update({ timetable })
        .eq("id", examId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Timetable updated");
      queryClient.invalidateQueries({ queryKey: ["class-exams"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update timetable");
    },
  });

  const resetForm = () => {
    setFormData({
      exam_name: "",
      term: "Term 1",
      year: CURRENT_YEAR,
      start_date: "",
      end_date: "",
    });
    setSelectedExam(null);
  };

  const openEditDialog = (exam: any) => {
    setSelectedExam(exam);
    setFormData({
      exam_name: exam.exam_name,
      term: exam.term,
      year: exam.year,
      start_date: exam.start_date,
      end_date: exam.end_date,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.exam_name || !formData.start_date || !formData.end_date) {
      toast.error("Please fill all required fields");
      return;
    }
    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      toast.error("End date must be after start date");
      return;
    }
    saveExamMutation.mutate(formData);
  };

  const addTimetableEntry = () => {
    if (!selectedExam || !timetableEntry.subject || !timetableEntry.date || !timetableEntry.start_time) {
      toast.error("Please fill subject, date and start time");
      return;
    }

    const currentTimetable = (selectedExam.timetable as TimetableEntry[] | null) || [];
    const newTimetable = [...currentTimetable, timetableEntry];
    
    updateTimetableMutation.mutate({ 
      examId: selectedExam.id, 
      timetable: newTimetable as unknown as Json
    });
    setTimetableEntry({ subject: "", sub_subject: "", date: "", start_time: "", end_time: "" });
    
    // Update local state
    setSelectedExam({ ...selectedExam, timetable: newTimetable });
  };

  const removeTimetableEntry = (index: number) => {
    if (!selectedExam) return;
    const currentTimetable = (selectedExam.timetable as TimetableEntry[] | null) || [];
    const newTimetable = currentTimetable.filter((_, i) => i !== index);
    
    updateTimetableMutation.mutate({ 
      examId: selectedExam.id, 
      timetable: newTimetable as unknown as Json
    });
    setSelectedExam({ ...selectedExam, timetable: newTimetable });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge variant="secondary">Upcoming</Badge>;
      case "ongoing":
        return <Badge className="bg-amber-500">Ongoing</Badge>;
      case "completed":
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const viewExamDetails = (exam: any) => {
    setSelectedExam(exam);
    setViewMode("details");
  };

  // Results Matrix View
  if (viewMode === "results" && selectedExam) {
    return (
      <ExamResultsMatrix 
        exam={selectedExam} 
        assignedClass={assignedClass} 
        onBack={() => setViewMode("details")} 
      />
    );
  }

  if (viewMode === "details" && selectedExam) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" size="sm" onClick={() => setViewMode("list")} className="mb-2">
                ← Back to Exams
              </Button>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {selectedExam.exam_name}
              </CardTitle>
              <CardDescription>
                {selectedExam.term} {selectedExam.year} • {format(new Date(selectedExam.start_date), "MMM d")} - {format(new Date(selectedExam.end_date), "MMM d, yyyy")}
              </CardDescription>
            </div>
            {getStatusBadge(selectedExam.status)}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="timetable">
            <TabsList>
              <TabsTrigger value="timetable">
                <Calendar className="w-4 h-4 mr-2" />
                Timetable
              </TabsTrigger>
              <TabsTrigger value="results">
                <FileText className="w-4 h-4 mr-2" />
                Results Matrix
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timetable" className="space-y-4 mt-4">
              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="font-medium">Add Timetable Entry</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Subject</Label>
                    <Select
                      value={`${timetableEntry.subject}|${timetableEntry.sub_subject}`}
                      onValueChange={(v) => {
                        const [subject, sub] = v.split("|");
                        setTimetableEntry({ ...timetableEntry, subject, sub_subject: sub || "" });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjectOfferings.map((o: any) => (
                          <SelectItem 
                            key={o.id} 
                            value={`${o.subjects?.title || ""}|${o.sub_subject || ""}`}
                          >
                            {o.subjects?.title} {o.sub_subject && `- ${o.sub_subject}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Date</Label>
                    <Input
                      type="date"
                      value={timetableEntry.date}
                      min={selectedExam.start_date}
                      max={selectedExam.end_date}
                      onChange={(e) => setTimetableEntry({ ...timetableEntry, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Start Time</Label>
                    <Input
                      type="time"
                      value={timetableEntry.start_time}
                      onChange={(e) => setTimetableEntry({ ...timetableEntry, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">End Time</Label>
                    <Input
                      type="time"
                      value={timetableEntry.end_time}
                      onChange={(e) => setTimetableEntry({ ...timetableEntry, end_time: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addTimetableEntry} disabled={updateTimetableMutation.isPending}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!selectedExam.timetable || (selectedExam.timetable as TimetableEntry[]).length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No timetable entries. Add subjects above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ((selectedExam.timetable as TimetableEntry[]) || [])
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((entry, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <span className="font-medium">{entry.subject}</span>
                            {entry.sub_subject && (
                              <span className="text-muted-foreground ml-1">- {entry.sub_subject}</span>
                            )}
                          </TableCell>
                          <TableCell>{format(new Date(entry.date), "EEE, MMM d")}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="w-3 h-3" />
                              {entry.start_time}
                              {entry.end_time && ` - ${entry.end_time}`}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => removeTimetableEntry(idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="results" className="mt-4">
              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h4 className="font-medium mb-2">Results Matrix</h4>
                <p className="text-sm">
                  View full exam results with student scores, grades, positions and analytics.
                </p>
                <Button className="mt-4" onClick={() => setViewMode("results")}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Full Results Matrix
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Exams
            </CardTitle>
            <CardDescription>
              Manage exams and timetables for {assignedClass}
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Exam
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedExam ? "Edit Exam" : "Add New Exam"}</DialogTitle>
                <DialogDescription>Create an exam for {assignedClass}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Exam Name *</Label>
                  <Input
                    placeholder="e.g., Mid-Term Examination"
                    value={formData.exam_name}
                    onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Term</Label>
                    <Select value={formData.term} onValueChange={(v) => setFormData({ ...formData, term: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TERMS.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select 
                      value={formData.year.toString()} 
                      onValueChange={(v) => setFormData({ ...formData, year: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map(y => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date *</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saveExamMutation.isPending}>
                    {saveExamMutation.isPending ? "Saving..." : selectedExam ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exam Name</TableHead>
              <TableHead>Term</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No exams created yet. Click "Add Exam" to create one.
                </TableCell>
              </TableRow>
            ) : (
              exams.map((exam: any) => (
                <TableRow key={exam.id} className="cursor-pointer hover:bg-muted/50" onClick={() => viewExamDetails(exam)}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {exam.exam_name}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </TableCell>
                  <TableCell>{exam.term}</TableCell>
                  <TableCell>{exam.year}</TableCell>
                  <TableCell>
                    {format(new Date(exam.start_date), "MMM d")} - {format(new Date(exam.end_date), "MMM d")}
                  </TableCell>
                  <TableCell>{getStatusBadge(exam.status)}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(exam)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteExamMutation.mutate(exam.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
