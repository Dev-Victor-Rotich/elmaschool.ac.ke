import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "./ImageUploader";

export const AcademicExcellenceManager = () => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    mean_grade: "",
    student_name: "",
    course_pursued: "",
    university: "",
    image_url: "",
  });

  const queryClient = useQueryClient();

  const { data: records } = useQuery({
    queryKey: ["academic-excellence"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_excellence")
        .select("*")
        .order("year", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("academic_excellence").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-excellence"] });
      toast.success("Record created");
      setOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("academic_excellence").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-excellence"] });
      toast.success("Record updated");
      setOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("academic_excellence").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-excellence"] });
      toast.success("Record deleted");
    },
  });

  const resetForm = () => {
    setFormData({
      year: new Date().getFullYear(),
      mean_grade: "",
      student_name: "",
      course_pursued: "",
      university: "",
      image_url: "",
    });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (record: any) => {
    setFormData(record);
    setEditingId(record.id);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => { resetForm(); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Record
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} Academic Excellence Record</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Year</Label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label>Mean Grade</Label>
                <Input
                  value={formData.mean_grade}
                  onChange={(e) => setFormData({ ...formData, mean_grade: e.target.value })}
                  placeholder="e.g., A-"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Student Name</Label>
              <Input
                value={formData.student_name}
                onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Course Pursued</Label>
              <Input
                value={formData.course_pursued}
                onChange={(e) => setFormData({ ...formData, course_pursued: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>University (Optional)</Label>
              <Input
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
              />
            </div>

            <div>
              <Label>Photo (Optional)</Label>
              <ImageUploader
                bucket="student-photos"
                folder="academic"
                onUpload={(url) => setFormData({ ...formData, image_url: url })}
                defaultValue={formData.image_url}
              />
            </div>

            <Button type="submit" className="w-full">
              {editingId ? "Update" : "Create"} Record
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Year</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>University</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records?.map((record) => (
            <TableRow key={record.id}>
              <TableCell>{record.year}</TableCell>
              <TableCell>{record.mean_grade}</TableCell>
              <TableCell>{record.student_name}</TableCell>
              <TableCell>{record.course_pursued}</TableCell>
              <TableCell>{record.university || "-"}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="icon" variant="outline" onClick={() => handleEdit(record)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(record.id)}
                  >
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
