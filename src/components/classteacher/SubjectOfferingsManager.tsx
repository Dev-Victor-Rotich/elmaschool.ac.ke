import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BookMarked, Plus, Trash2, Save, Settings2 } from "lucide-react";
import { toast } from "sonner";

interface SubjectOfferingsManagerProps {
  assignedClass: string;
}

interface SubjectOffering {
  id: string;
  class_name: string;
  subject_id: string;
  sub_subject: string | null;
  offering_type: "compulsory" | "selective";
  created_at: string;
}

export const SubjectOfferingsManager = ({ assignedClass }: SubjectOfferingsManagerProps) => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<{
    subjectId: string;
    subSubject: string | null;
    offeringType: "compulsory" | "selective";
  }[]>([]);

  // Fetch all subjects from database
  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch class subject offerings
  const { data: offerings = [], isLoading, error: offeringsError } = useQuery({
    queryKey: ["class-subject-offerings", assignedClass],
    queryFn: async () => {
      if (!assignedClass) {
        console.log("SubjectOfferingsManager: No assignedClass provided");
        return [];
      }
      console.log("SubjectOfferingsManager: Fetching offerings for class:", assignedClass);
      const { data, error } = await supabase
        .from("class_subject_offerings")
        .select("*")
        .eq("class_name", assignedClass);
      if (error) {
        console.error("SubjectOfferingsManager: Error fetching offerings:", error);
        throw error;
      }
      console.log("SubjectOfferingsManager: Fetched offerings:", data);
      return (data || []) as SubjectOffering[];
    },
    enabled: !!assignedClass,
  });

  // Log any query errors
  if (offeringsError) {
    console.error("SubjectOfferingsManager: Query error:", offeringsError);
  }

  // Save offerings mutation
  const saveOfferingsMutation = useMutation({
    mutationFn: async (subjectsList: typeof selectedSubjects) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Delete existing offerings for this class
      await supabase
        .from("class_subject_offerings")
        .delete()
        .eq("class_name", assignedClass);

      // Insert new offerings
      if (subjectsList.length > 0) {
        const inserts = subjectsList.map((s) => ({
          class_name: assignedClass,
          subject_id: s.subjectId,
          sub_subject: s.subSubject,
          offering_type: s.offeringType,
          created_by: user?.id,
        }));
        const { error } = await supabase.from("class_subject_offerings").insert(inserts);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Subject offerings saved successfully");
      queryClient.invalidateQueries({ queryKey: ["class-subject-offerings"] });
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save offerings");
    },
  });

  // Delete single offering mutation
  const deleteOfferingMutation = useMutation({
    mutationFn: async (offeringId: string) => {
      const { error } = await supabase
        .from("class_subject_offerings")
        .delete()
        .eq("id", offeringId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Subject removed from offerings");
      queryClient.invalidateQueries({ queryKey: ["class-subject-offerings"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove subject");
    },
  });

  const openConfigDialog = () => {
    // Load existing offerings into the selection state
    setSelectedSubjects(
      offerings.map((o) => ({
        subjectId: o.subject_id,
        subSubject: o.sub_subject,
        offeringType: o.offering_type,
      }))
    );
    setDialogOpen(true);
  };

  const toggleSubject = (subjectId: string, subSubject: string | null, offeringType: "compulsory" | "selective") => {
    const existingIndex = selectedSubjects.findIndex(
      (s) => s.subjectId === subjectId && s.subSubject === subSubject
    );

    if (existingIndex >= 0) {
      // Update type if already selected
      const updated = [...selectedSubjects];
      updated[existingIndex].offeringType = offeringType;
      setSelectedSubjects(updated);
    } else {
      // Add new selection
      setSelectedSubjects([...selectedSubjects, { subjectId, subSubject, offeringType }]);
    }
  };

  const removeSubject = (subjectId: string, subSubject: string | null) => {
    setSelectedSubjects(
      selectedSubjects.filter(
        (s) => !(s.subjectId === subjectId && s.subSubject === subSubject)
      )
    );
  };

  const getSelection = (subjectId: string, subSubject: string | null) => {
    return selectedSubjects.find(
      (s) => s.subjectId === subjectId && s.subSubject === subSubject
    );
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((s: any) => s.id === subjectId);
    return subject?.title || "Unknown Subject";
  };

  const handleSave = () => {
    saveOfferingsMutation.mutate(selectedSubjects);
  };

  const compulsoryOfferings = offerings.filter((o) => o.offering_type === "compulsory");
  const selectiveOfferings = offerings.filter((o) => o.offering_type === "selective");

  if (isLoading) {
    return <Card><CardContent className="py-8 text-center">Loading...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BookMarked className="h-5 w-5" />
            Subject Offerings - {assignedClass}
          </CardTitle>
          <CardDescription>
            Configure compulsory and selective subjects for your class
          </CardDescription>
        </div>
        <Button onClick={openConfigDialog}>
          <Settings2 className="h-4 w-4 mr-2" />
          Configure Offerings
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Compulsory Subjects */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Badge variant="default" className="bg-primary">Compulsory</Badge>
            <span className="text-muted-foreground text-sm font-normal">
              ({compulsoryOfferings.length} subjects)
            </span>
          </h3>
          {compulsoryOfferings.length === 0 ? (
            <p className="text-muted-foreground text-sm">No compulsory subjects configured</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {compulsoryOfferings.map((offering) => (
                <div
                  key={offering.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-primary/5"
                >
                  <div>
                    <span className="font-medium">{getSubjectName(offering.subject_id)}</span>
                    {offering.sub_subject && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {offering.sub_subject}
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => deleteOfferingMutation.mutate(offering.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Selective Subjects */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Badge variant="secondary">Selective</Badge>
            <span className="text-muted-foreground text-sm font-normal">
              ({selectiveOfferings.length} subjects)
            </span>
          </h3>
          {selectiveOfferings.length === 0 ? (
            <p className="text-muted-foreground text-sm">No selective subjects configured</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {selectiveOfferings.map((offering) => (
                <div
                  key={offering.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-secondary/20"
                >
                  <div>
                    <span className="font-medium">{getSubjectName(offering.subject_id)}</span>
                    {offering.sub_subject && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {offering.sub_subject}
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => deleteOfferingMutation.mutate(offering.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {offerings.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <BookMarked className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No subject offerings configured yet</p>
            <p className="text-sm">Click "Configure Offerings" to set up subjects for this class</p>
          </div>
        )}
      </CardContent>

      {/* Configuration Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Subject Offerings for {assignedClass}</DialogTitle>
            <DialogDescription>
              Select subjects and mark them as compulsory (auto-assigned to all students) or selective (manually assigned)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {subjects.map((subject: any) => {
              const hasSubSubjects = (subject.sub_subjects as string[] || []).length > 0;

              return (
                <Card key={subject.id} className="border">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base font-medium">{subject.title}</CardTitle>
                    <CardDescription className="text-sm">{subject.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3">
                    {hasSubSubjects ? (
                      <div className="space-y-3">
                        {(subject.sub_subjects as string[]).map((subSubject: string, idx: number) => {
                          const selection = getSelection(subject.id, subSubject);
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 rounded border bg-muted/30"
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={!!selection}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      toggleSubject(subject.id, subSubject, "selective");
                                    } else {
                                      removeSubject(subject.id, subSubject);
                                    }
                                  }}
                                />
                                <span className="font-medium">{subSubject}</span>
                              </div>
                              {selection && (
                                <RadioGroup
                                  value={selection.offeringType}
                                  onValueChange={(value: "compulsory" | "selective") =>
                                    toggleSubject(subject.id, subSubject, value)
                                  }
                                  className="flex gap-4"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="compulsory" id={`compulsory-${subject.id}-${idx}`} />
                                    <Label htmlFor={`compulsory-${subject.id}-${idx}`} className="text-sm">
                                      Compulsory
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="selective" id={`selective-${subject.id}-${idx}`} />
                                    <Label htmlFor={`selective-${subject.id}-${idx}`} className="text-sm">
                                      Selective
                                    </Label>
                                  </div>
                                </RadioGroup>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 rounded border bg-muted/30">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={!!getSelection(subject.id, null)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                toggleSubject(subject.id, null, "selective");
                              } else {
                                removeSubject(subject.id, null);
                              }
                            }}
                          />
                          <span className="font-medium">Include this subject</span>
                        </div>
                        {getSelection(subject.id, null) && (
                          <RadioGroup
                            value={getSelection(subject.id, null)?.offeringType || "selective"}
                            onValueChange={(value: "compulsory" | "selective") =>
                              toggleSubject(subject.id, null, value)
                            }
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="compulsory" id={`compulsory-${subject.id}`} />
                              <Label htmlFor={`compulsory-${subject.id}`} className="text-sm">
                                Compulsory
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="selective" id={`selective-${subject.id}`} />
                              <Label htmlFor={`selective-${subject.id}`} className="text-sm">
                                Selective
                              </Label>
                            </div>
                          </RadioGroup>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{selectedSubjects.filter((s) => s.offeringType === "compulsory").length}</span> compulsory,{" "}
              <span className="font-medium">{selectedSubjects.filter((s) => s.offeringType === "selective").length}</span> selective
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saveOfferingsMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {saveOfferingsMutation.isPending ? "Saving..." : "Save Offerings"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
