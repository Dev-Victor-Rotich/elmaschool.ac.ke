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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, GraduationCap, BookOpen, Target, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { DEFAULT_POINT_BOUNDARIES, uses7SubjectCalculation } from "@/lib/grading-utils";

interface GradeBoundariesManagerProps {
  assignedClass: string;
}

const GRADE_POINTS: Record<string, number> = {
  "A": 12, "A-": 11,
  "B+": 10, "B": 9, "B-": 8,
  "C+": 7, "C": 6, "C-": 5,
  "D+": 4, "D": 3, "D-": 2,
  "E": 1
};

const GRADES = Object.keys(GRADE_POINTS);

export function GradeBoundariesManager({ assignedClass }: GradeBoundariesManagerProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBoundary, setEditingBoundary] = useState<any>(null);
  const [boundaryType, setBoundaryType] = useState<"overall" | "subject" | "points">("overall");
  
  const [formData, setFormData] = useState({
    grade: "A",
    min_marks: 0,
    max_marks: 100,
    min_points: 0,
    max_points: 84,
    subject_id: "",
    sub_subject: "",
  });

  // Check if this class uses 7-subject calculation
  const uses7Subject = uses7SubjectCalculation(assignedClass);

  // Fetch grade boundaries for this class
  const { data: boundaries = [] } = useQuery({
    queryKey: ["grade-boundaries", assignedClass],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grade_boundaries")
        .select("*, subjects(title)")
        .eq("class_name", assignedClass)
        .order("max_marks", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!assignedClass,
  });

  // Fetch subject offerings for this class (for subject-specific boundaries)
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

  // Get unique sub-subjects from offerings
  const availableSubSubjects = subjectOfferings
    .filter(o => o.sub_subject)
    .map(o => ({
      subject_id: o.subject_id,
      sub_subject: o.sub_subject,
      subject_title: o.subjects?.title || "Unknown"
    }));

  // Add/Edit boundary mutation
  const saveBoundaryMutation = useMutation({
    mutationFn: async (data: any) => {
      // Map "points" UI type to "overall" DB type (constraint only allows: standard, subject_specific, subject, overall)
      const dbBoundaryType = boundaryType === "points" ? "overall" : boundaryType;
      
      const boundaryData: any = {
        class_name: assignedClass,
        boundary_type: dbBoundaryType,
        grade: data.grade,
        points: GRADE_POINTS[data.grade],
        subject_id: boundaryType === "subject" ? data.subject_id : null,
        sub_subject: boundaryType === "subject" ? data.sub_subject : null,
        boundary_for: boundaryType === "points" ? "points" : "marks",
      };

      // Set marks or points based on boundary type
      if (boundaryType === "points") {
        boundaryData.min_points = data.min_points;
        boundaryData.max_points = data.max_points;
        boundaryData.min_marks = 0;
        boundaryData.max_marks = 0;
      } else {
        boundaryData.min_marks = data.min_marks;
        boundaryData.max_marks = data.max_marks;
        boundaryData.min_points = null;
        boundaryData.max_points = null;
      }

      if (editingBoundary) {
        const { error } = await supabase
          .from("grade_boundaries")
          .update(boundaryData)
          .eq("id", editingBoundary.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("grade_boundaries")
          .insert(boundaryData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingBoundary ? "Boundary updated" : "Boundary added");
      queryClient.invalidateQueries({ queryKey: ["grade-boundaries"] });
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save boundary");
    },
  });

  // Delete boundary mutation
  const deleteBoundaryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("grade_boundaries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Boundary deleted");
      queryClient.invalidateQueries({ queryKey: ["grade-boundaries"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete boundary");
    },
  });

  const resetForm = () => {
    setFormData({ grade: "A", min_marks: 0, max_marks: 100, min_points: 0, max_points: 84, subject_id: "", sub_subject: "" });
    setEditingBoundary(null);
  };

  const openEditDialog = (boundary: any) => {
    setEditingBoundary(boundary);
    setBoundaryType(boundary.boundary_for === "points" ? "points" : boundary.boundary_type);
    setFormData({
      grade: boundary.grade,
      min_marks: boundary.min_marks || 0,
      max_marks: boundary.max_marks || 100,
      min_points: boundary.min_points || 0,
      max_points: boundary.max_points || 84,
      subject_id: boundary.subject_id || "",
      sub_subject: boundary.sub_subject || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (boundaryType === "points") {
      if (formData.min_points >= formData.max_points) {
        toast.error("Min points must be less than max points");
        return;
      }
    } else {
      if (formData.min_marks >= formData.max_marks) {
        toast.error("Min marks must be less than max marks");
        return;
      }
    }
    if (boundaryType === "subject" && (!formData.subject_id || !formData.sub_subject)) {
      toast.error("Please select a subject and sub-subject");
      return;
    }
    saveBoundaryMutation.mutate(formData);
  };

  // Filter boundaries by type
  const overallBoundaries = boundaries.filter((b: any) => b.boundary_type === "overall" && b.boundary_for !== "points");
  const subjectBoundaries = boundaries.filter((b: any) => b.boundary_type === "subject" && b.boundary_for !== "points");
  const pointsBoundaries = boundaries.filter((b: any) => b.boundary_for === "points");

  // Quick setup for default point-based boundaries (for 7-subject grading)
  const setupDefaultPointsBoundaries = async () => {
    try {
      // Delete existing point boundaries
      await supabase
        .from("grade_boundaries")
        .delete()
        .eq("class_name", assignedClass)
        .eq("boundary_for", "points");

      // Insert default point boundaries
      const { error } = await supabase.from("grade_boundaries").insert(
        DEFAULT_POINT_BOUNDARIES.map(b => ({
          class_name: assignedClass,
          boundary_type: "overall",
          boundary_for: "points",
          grade: b.grade,
          min_points: b.min_points,
          max_points: b.max_points,
          points: GRADE_POINTS[b.grade],
          min_marks: 0,
          max_marks: 0,
        }))
      );
      if (error) throw error;
      toast.success("Default point-based boundaries set up");
      queryClient.invalidateQueries({ queryKey: ["grade-boundaries"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to set up point boundaries");
    }
  };

  // Auto-calculate grade from marks
  const calculateGrade = (marks: number, type: "overall" | "subject" = "overall", subjectId?: string, subSubject?: string) => {
    let relevantBoundaries = type === "overall" 
      ? overallBoundaries 
      : subjectBoundaries.filter((b: any) => b.subject_id === subjectId && b.sub_subject === subSubject);
    
    // Fallback to overall if no subject-specific boundaries
    if (relevantBoundaries.length === 0 && type === "subject") {
      relevantBoundaries = overallBoundaries;
    }

    for (const boundary of relevantBoundaries) {
      if (marks >= boundary.min_marks && marks <= boundary.max_marks) {
        return { grade: boundary.grade, points: boundary.points };
      }
    }
    return { grade: "E", points: 1 };
  };

  // Quick setup for default 12-point scale
  const setupDefaultBoundaries = async () => {
    const defaultBoundaries = [
      { grade: "A", min_marks: 80, max_marks: 100 },
      { grade: "A-", min_marks: 75, max_marks: 79 },
      { grade: "B+", min_marks: 70, max_marks: 74 },
      { grade: "B", min_marks: 65, max_marks: 69 },
      { grade: "B-", min_marks: 60, max_marks: 64 },
      { grade: "C+", min_marks: 55, max_marks: 59 },
      { grade: "C", min_marks: 50, max_marks: 54 },
      { grade: "C-", min_marks: 45, max_marks: 49 },
      { grade: "D+", min_marks: 40, max_marks: 44 },
      { grade: "D", min_marks: 35, max_marks: 39 },
      { grade: "D-", min_marks: 30, max_marks: 34 },
      { grade: "E", min_marks: 0, max_marks: 29 },
    ];

    try {
      // Delete existing overall boundaries
      await supabase
        .from("grade_boundaries")
        .delete()
        .eq("class_name", assignedClass)
        .eq("boundary_type", "overall");

      // Insert new boundaries
      const { error } = await supabase.from("grade_boundaries").insert(
        defaultBoundaries.map(b => ({
          class_name: assignedClass,
          boundary_type: "overall",
          grade: b.grade,
          min_marks: b.min_marks,
          max_marks: b.max_marks,
          points: GRADE_POINTS[b.grade],
        }))
      );
      if (error) throw error;
      toast.success("Default grade boundaries set up");
      queryClient.invalidateQueries({ queryKey: ["grade-boundaries"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to set up default boundaries");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Grade Boundaries Setup
              </CardTitle>
              <CardDescription>
                Configure grade boundaries for {assignedClass}. Grades use 12-point scale (A=12 to E=1).
              </CardDescription>
            </div>
            {overallBoundaries.length === 0 && (
              <Button onClick={setupDefaultBoundaries} variant="secondary">
                Setup Default Scale
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={uses7Subject ? "points" : "overall"} className="space-y-4">
            <TabsList>
              {uses7Subject && (
                <TabsTrigger value="points">
                  <Target className="w-4 h-4 mr-2" />
                  Points Grade (Overall)
                </TabsTrigger>
              )}
              <TabsTrigger value="overall">
                <GraduationCap className="w-4 h-4 mr-2" />
                Marks Grade (Subject)
              </TabsTrigger>
              <TabsTrigger value="subject">
                <BookOpen className="w-4 h-4 mr-2" />
                Subject-Specific
              </TabsTrigger>
            </TabsList>

            {/* Points-based Grade Tab (for 7-subject classes) */}
            {uses7Subject && (
              <TabsContent value="points" className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    <Info className="h-4 w-4 flex-shrink-0" />
                    <span>
                      <strong>Point-Based Overall Grade:</strong> For {assignedClass}, the overall grade is based on 7-subject points (max 84). 
                      Mean marks are only used as a tie-breaker when students have the same points.
                    </span>
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Configure grade boundaries based on total points (0-84 for 7 subjects × 12 points each).
                  </p>
                  <div className="flex gap-2">
                    {pointsBoundaries.length === 0 && (
                      <Button onClick={setupDefaultPointsBoundaries} variant="secondary">
                        Setup Default Scale
                      </Button>
                    )}
                    <Dialog open={dialogOpen && boundaryType === "points"} onOpenChange={(open) => {
                      setDialogOpen(open);
                      if (open) {
                        setBoundaryType("points");
                        resetForm();
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Boundary
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{editingBoundary ? "Edit" : "Add"} Point Boundary</DialogTitle>
                          <DialogDescription>Set points range for an overall grade (max 84 points)</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label>Grade</Label>
                            <Select value={formData.grade} onValueChange={(v) => setFormData({ ...formData, grade: v })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {GRADES.map(g => (
                                  <SelectItem key={g} value={g}>{g}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Min Points</Label>
                              <Input
                                type="number"
                                min={0}
                                max={84}
                                value={formData.min_points}
                                onChange={(e) => setFormData({ ...formData, min_points: parseInt(e.target.value) || 0 })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Max Points</Label>
                              <Input
                                type="number"
                                min={0}
                                max={84}
                                value={formData.max_points}
                                onChange={(e) => setFormData({ ...formData, max_points: parseInt(e.target.value) || 0 })}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={saveBoundaryMutation.isPending}>
                              {saveBoundaryMutation.isPending ? "Saving..." : "Save"}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grade</TableHead>
                      <TableHead>Min Points</TableHead>
                      <TableHead>Max Points</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pointsBoundaries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No point boundaries configured. Click "Setup Default Scale" to use standard grading.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pointsBoundaries
                        .sort((a: any, b: any) => b.max_points - a.max_points)
                        .map((b: any) => (
                          <TableRow key={b.id}>
                            <TableCell>
                              <Badge variant="outline" className="font-bold">{b.grade}</Badge>
                            </TableCell>
                            <TableCell>{b.min_points}</TableCell>
                            <TableCell>{b.max_points}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => openEditDialog(b)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => deleteBoundaryMutation.mutate(b.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            )}

            <TabsContent value="overall" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Overall grade boundaries apply to mean scores and subjects without specific boundaries.
                </p>
                <Dialog open={dialogOpen && boundaryType === "overall"} onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (open) {
                    setBoundaryType("overall");
                    resetForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Boundary
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingBoundary ? "Edit" : "Add"} Overall Boundary</DialogTitle>
                      <DialogDescription>Set marks range for a grade</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Grade</Label>
                        <Select value={formData.grade} onValueChange={(v) => setFormData({ ...formData, grade: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADES.map(g => (
                              <SelectItem key={g} value={g}>{g} ({GRADE_POINTS[g]} points)</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Min Marks</Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={formData.min_marks}
                            onChange={(e) => setFormData({ ...formData, min_marks: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Marks</Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={formData.max_marks}
                            onChange={(e) => setFormData({ ...formData, max_marks: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={saveBoundaryMutation.isPending}>
                          {saveBoundaryMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grade</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Min Marks</TableHead>
                    <TableHead>Max Marks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overallBoundaries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No overall boundaries configured. Click "Setup Default Scale" to use standard grading.
                      </TableCell>
                    </TableRow>
                  ) : (
                    overallBoundaries.map((b: any) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-bold">{b.grade}</Badge>
                        </TableCell>
                        <TableCell>{b.points}</TableCell>
                        <TableCell>{b.min_marks}</TableCell>
                        <TableCell>{b.max_marks}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditDialog(b)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteBoundaryMutation.mutate(b.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="subject" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Subject-specific boundaries override overall boundaries for specific sub-subjects.
                </p>
                <Dialog open={dialogOpen && boundaryType === "subject"} onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (open) {
                    setBoundaryType("subject");
                    resetForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Subject Boundary
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingBoundary ? "Edit" : "Add"} Subject Boundary</DialogTitle>
                      <DialogDescription>Set marks range for a specific subject grade</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Sub-Subject</Label>
                        <Select 
                          value={`${formData.subject_id}|${formData.sub_subject}`} 
                          onValueChange={(v) => {
                            const [subjectId, subSubject] = v.split("|");
                            setFormData({ ...formData, subject_id: subjectId, sub_subject: subSubject });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select sub-subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSubSubjects.map((s, i) => (
                              <SelectItem key={i} value={`${s.subject_id}|${s.sub_subject}`}>
                                {s.subject_title} - {s.sub_subject}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Grade</Label>
                        <Select value={formData.grade} onValueChange={(v) => setFormData({ ...formData, grade: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADES.map(g => (
                              <SelectItem key={g} value={g}>{g} ({GRADE_POINTS[g]} points)</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Min Marks</Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={formData.min_marks}
                            onChange={(e) => setFormData({ ...formData, min_marks: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Marks</Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={formData.max_marks}
                            onChange={(e) => setFormData({ ...formData, max_marks: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={saveBoundaryMutation.isPending}>
                          {saveBoundaryMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {availableSubSubjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No sub-subjects configured. Add subject offerings with sub-subjects first.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Sub-Subject</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Min</TableHead>
                      <TableHead>Max</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjectBoundaries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No subject-specific boundaries. Overall boundaries will be used.
                        </TableCell>
                      </TableRow>
                    ) : (
                      subjectBoundaries.map((b: any) => (
                        <TableRow key={b.id}>
                          <TableCell>{b.subjects?.title || "Unknown"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{b.sub_subject}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-bold">{b.grade}</Badge>
                          </TableCell>
                          <TableCell>{b.points}</TableCell>
                          <TableCell>{b.min_marks}</TableCell>
                          <TableCell>{b.max_marks}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => openEditDialog(b)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteBoundaryMutation.mutate(b.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Grade Calculator Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Grade Calculator Preview</CardTitle>
          <CardDescription>Test your grade boundaries by entering marks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Enter Marks</Label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="Enter marks (0-100)"
                onChange={(e) => {
                  const marks = parseInt(e.target.value) || 0;
                  const result = calculateGrade(marks, "overall");
                  const preview = document.getElementById("grade-preview");
                  if (preview) {
                    preview.textContent = `Grade: ${result.grade} (${result.points} points)`;
                  }
                }}
              />
            </div>
            <div className="flex-1">
              <Label>Result</Label>
              <div id="grade-preview" className="text-lg font-bold text-primary p-2 border rounded-md bg-muted">
                Enter marks to see grade
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
