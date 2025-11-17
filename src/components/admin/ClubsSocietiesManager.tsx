import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "./ImageUploader";

export const ClubsSocietiesManager = () => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    member_count: 0,
    display_order: 0
  });

  const queryClient = useQueryClient();

  const { data: clubs } = useQuery({
    queryKey: ["clubs-societies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clubs_societies")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("clubs_societies").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clubs-societies"] });
      toast.success("Club added");
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("clubs_societies").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clubs-societies"] });
      toast.success("Club updated");
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clubs_societies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clubs-societies"] });
      toast.success("Club deleted");
    },
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", image_url: "", member_count: 0, display_order: 0 });
    setEditingId(null);
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

  const handleEdit = (club: any) => {
    setFormData({
      name: club.name,
      description: club.description,
      image_url: club.image_url || "",
      member_count: club.member_count || 0,
      display_order: club.display_order || 0
    });
    setEditingId(club.id);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Club/Society
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} Club/Society</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <Label>Image</Label>
              <ImageUploader
                bucket="clubs"
                folder="societies"
                onUpload={(url) => setFormData({ ...formData, image_url: url })}
                defaultValue={formData.image_url}
              />
            </div>
            <div>
              <Label>Member Count</Label>
              <Input
                type="number"
                value={formData.member_count}
                onChange={(e) => setFormData({ ...formData, member_count: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Display Order</Label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              />
            </div>
            <Button type="submit" className="w-full">
              {editingId ? "Update" : "Add"} Club/Society
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clubs?.map((club) => (
            <TableRow key={club.id}>
              <TableCell>{club.name}</TableCell>
              <TableCell>{club.description}</TableCell>
              <TableCell>{club.member_count}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(club)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(club.id)}>
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
