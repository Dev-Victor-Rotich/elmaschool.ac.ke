import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const DutyRosterManager = () => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    term: "",
    week_number: "",
    start_date: "",
    end_date: "",
    month: "",
    quote: "",
    quote_author: "",
    teachers: [{ name: "", phone: "" }],
  });

  const queryClient = useQueryClient();

  const { data: rosters, isLoading } = useQuery({
    queryKey: ["duty-rosters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("duty_rosters")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("duty_rosters").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duty-rosters"] });
      toast.success("Duty roster created");
      setOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("duty_rosters")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duty-rosters"] });
      toast.success("Duty roster updated");
      setOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("duty_rosters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duty-rosters"] });
      toast.success("Duty roster deleted");
    },
  });

  const resetForm = () => {
    setFormData({
      term: "",
      week_number: "",
      start_date: "",
      end_date: "",
      month: "",
      quote: "",
      quote_author: "",
      teachers: [{ name: "", phone: "" }],
    });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      term: formData.term,
      week_number: parseInt(formData.week_number),
      start_date: formData.start_date,
      end_date: formData.end_date,
      month: formData.month,
      quote: formData.quote,
      quote_author: formData.quote_author,
      teachers_on_duty: formData.teachers,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (roster: any) => {
    setFormData({
      term: roster.term,
      week_number: roster.week_number.toString(),
      start_date: roster.start_date,
      end_date: roster.end_date,
      month: roster.month,
      quote: roster.quote,
      quote_author: roster.quote_author,
      teachers: roster.teachers_on_duty || [{ name: "", phone: "" }],
    });
    setEditingId(roster.id);
    setOpen(true);
  };

  const addTeacher = () => {
    setFormData({
      ...formData,
      teachers: [...formData.teachers, { name: "", phone: "" }],
    });
  };

  const removeTeacher = (index: number) => {
    setFormData({
      ...formData,
      teachers: formData.teachers.filter((_, i) => i !== index),
    });
  };

  const updateTeacher = (index: number, field: string, value: string) => {
    const newTeachers = [...formData.teachers];
    newTeachers[index] = { ...newTeachers[index], [field]: value };
    setFormData({ ...formData, teachers: newTeachers });
  };

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => { resetForm(); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Duty Roster
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} Duty Roster</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Term</Label>
                <Input
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                  placeholder="e.g., Term 1 2025"
                  required
                />
              </div>
              <div>
                <Label>Week Number</Label>
                <Input
                  type="number"
                  value={formData.week_number}
                  onChange={(e) => setFormData({ ...formData, week_number: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Month</Label>
              <Input
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                placeholder="e.g., January"
                required
              />
            </div>

            <div>
              <Label>Quote</Label>
              <Textarea
                value={formData.quote}
                onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                placeholder="Inspirational quote"
                required
              />
            </div>

            <div>
              <Label>Quote Author</Label>
              <Input
                value={formData.quote_author}
                onChange={(e) => setFormData({ ...formData, quote_author: e.target.value })}
                placeholder="Author name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Teachers on Duty</Label>
              {formData.teachers.map((teacher, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Teacher name"
                    value={teacher.name}
                    onChange={(e) => updateTeacher(index, "name", e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Phone number"
                    value={teacher.phone}
                    onChange={(e) => updateTeacher(index, "phone", e.target.value)}
                    required
                  />
                  {formData.teachers.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeTeacher(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addTeacher} className="w-full">
                Add Teacher
              </Button>
            </div>

            <Button type="submit" className="w-full">
              {editingId ? "Update" : "Create"} Roster
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Term</TableHead>
            <TableHead>Week</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Quote</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rosters?.map((roster) => (
            <TableRow key={roster.id}>
              <TableCell>{roster.term}</TableCell>
              <TableCell>Week {roster.week_number}</TableCell>
              <TableCell>
                {format(new Date(roster.start_date), "MMM d")} - {format(new Date(roster.end_date), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="max-w-xs truncate">{roster.quote}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="icon" variant="outline" onClick={() => handleEdit(roster)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(roster.id)}
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
