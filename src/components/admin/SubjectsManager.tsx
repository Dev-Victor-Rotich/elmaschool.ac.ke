import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const ICON_OPTIONS = [
  "BookOpen", "Calculator", "Beaker", "Globe", "Palette", "Music"
];

export const SubjectsManager = () => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSubSubject, setNewSubSubject] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon_name: "BookOpen",
    display_order: 0,
    sub_subjects: [] as string[]
  });

  const queryClient = useQueryClient();

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("subjects").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject added");
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("subjects").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject updated");
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject deleted");
    },
  });

  const resetForm = () => {
    setFormData({ title: "", description: "", icon_name: "BookOpen", display_order: 0, sub_subjects: [] });
    setEditingId(null);
    setNewSubSubject("");
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (subject: any) => {
    setFormData({
      title: subject.title,
      description: subject.description,
      icon_name: subject.icon_name,
      display_order: subject.display_order || 0,
      sub_subjects: subject.sub_subjects || []
    });
    setEditingId(subject.id);
    setOpen(true);
  };

  const addSubSubject = () => {
    if (newSubSubject.trim() && !formData.sub_subjects.includes(newSubSubject.trim())) {
      setFormData({
        ...formData,
        sub_subjects: [...formData.sub_subjects, newSubSubject.trim()]
      });
      setNewSubSubject("");
    }
  };

  const removeSubSubject = (subSubject: string) => {
    setFormData({
      ...formData,
      sub_subjects: formData.sub_subjects.filter(s => s !== subSubject)
    });
  };

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Subject
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} Subject</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Icon</Label>
              <select
                value={formData.icon_name}
                onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
                className="w-full p-2 border rounded bg-background"
              >
                {ICON_OPTIONS.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Display Order</Label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              />
            </div>
            
            {/* Sub-subjects section */}
            <div>
              <Label>Sub-Subjects (e.g., Biology, Chemistry, Physics for Sciences)</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newSubSubject}
                  onChange={(e) => setNewSubSubject(e.target.value)}
                  placeholder="Enter sub-subject name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSubSubject();
                    }
                  }}
                />
                <Button type="button" onClick={addSubSubject} variant="secondary">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.sub_subjects.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.sub_subjects.map((sub, idx) => (
                    <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                      {sub}
                      <button
                        type="button"
                        onClick={() => removeSubSubject(sub)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <Button type="submit" className="w-full">
              {editingId ? "Update" : "Add"} Subject
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Sub-Subjects</TableHead>
            <TableHead>Icon</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subjects?.map((subject) => (
            <TableRow key={subject.id}>
              <TableCell className="font-medium">{subject.title}</TableCell>
              <TableCell className="max-w-xs truncate">{subject.description}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {(subject.sub_subjects as string[] || []).length > 0 ? (
                    (subject.sub_subjects as string[]).map((sub, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {sub}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-xs">None</span>
                  )}
                </div>
              </TableCell>
              <TableCell>{subject.icon_name}</TableCell>
              <TableCell>{subject.display_order}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(subject)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(subject.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
