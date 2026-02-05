import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "./ImageUploader";

// Sentinel value for "no patron" - empty strings crash Radix Select
const NO_PATRON = "__none__";

interface ClubFormData {
  name: string;
  description: string;
  image_url: string;
  member_count: number;
  display_order: number;
  patron_id: string;
  motto: string;
  meeting_schedule: string;
  is_active: boolean;
  features: {
    feed: boolean;
    gallery: boolean;
    events: boolean;
    resources: boolean;
  };
}

const defaultFormData: ClubFormData = {
  name: "",
  description: "",
  image_url: "",
  member_count: 0,
  display_order: 0,
  patron_id: NO_PATRON,
  motto: "",
  meeting_schedule: "",
  is_active: true,
  features: {
    feed: true,
    gallery: false,
    events: false,
    resources: false,
  },
};

export const ClubsSocietiesManager = () => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClubFormData>(defaultFormData);

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

  // Fetch teachers/staff for patron selection
  const { data: staffMembers = [] } = useQuery({
    queryKey: ["staff-for-patron"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_registry")
        .select("id, full_name, email, role")
        .eq("status", "active")
        .order("full_name");
      if (error) throw error;

      // Get user IDs for staff members
      const staffWithUserIds = await Promise.all(
        (data || []).map(async (staff) => {
          const { data: authUser } = await supabase.auth.admin.getUserById
            ? { data: null } // admin API not available in client
            : await supabase
                .from("profiles")
                .select("id")
                .eq("email", staff.email)
                .single();
          return { ...staff, user_id: authUser?.id };
        })
      );

      return staffWithUserIds;
    },
  });

  // Fetch profiles to get user IDs by email
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-for-patron"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email");
      if (error) throw error;
      return data || [];
    },
  });

  // Combine staff with profile IDs
  const patronOptions = profiles.filter((p) => 
    staffMembers.some((s) => s.email?.toLowerCase() === p.email?.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: async (data: ClubFormData) => {
      const patronId = data.patron_id === NO_PATRON ? null : data.patron_id || null;
      const { error } = await supabase.from("clubs_societies").insert({
        name: data.name,
        description: data.description,
        image_url: data.image_url || null,
        member_count: data.member_count,
        display_order: data.display_order,
        patron_id: patronId,
        motto: data.motto || null,
        meeting_schedule: data.meeting_schedule || null,
        is_active: data.is_active,
        features: data.features,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clubs-societies"] });
      toast.success("Club added");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add club");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClubFormData }) => {
      const patronId = data.patron_id === NO_PATRON ? null : data.patron_id || null;
      const { error } = await supabase.from("clubs_societies").update({
        name: data.name,
        description: data.description,
        image_url: data.image_url || null,
        member_count: data.member_count,
        display_order: data.display_order,
        patron_id: patronId,
        motto: data.motto || null,
        meeting_schedule: data.meeting_schedule || null,
        is_active: data.is_active,
        features: data.features,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clubs-societies"] });
      toast.success("Club updated");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update club");
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
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete club");
    },
  });

  const resetForm = () => {
    setFormData(defaultFormData);
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
    const features = club.features || { feed: true, gallery: false, events: false, resources: false };
    setFormData({
      name: club.name,
      description: club.description,
      image_url: club.image_url || "",
      member_count: club.member_count || 0,
      display_order: club.display_order || 0,
      patron_id: club.patron_id || NO_PATRON,
      motto: club.motto || "",
      meeting_schedule: club.meeting_schedule || "",
      is_active: club.is_active ?? true,
      features: typeof features === "object" ? features : { feed: true, gallery: false, events: false, resources: false },
    });
    setEditingId(club.id);
    setOpen(true);
  };

  const getPatronName = (patronId: string) => {
    const patron = profiles.find((p) => p.id === patronId);
    return patron?.full_name || "Not assigned";
  };

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => setFormData(defaultFormData)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Club/Society
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[80vh] overflow-y-auto max-w-lg">
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
              <Label>Motto/Tagline</Label>
              <Input
                value={formData.motto}
                onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                placeholder="e.g., 'Building Tomorrow's Leaders'"
              />
            </div>
            <div>
              <Label>Patron (Teacher/Staff)</Label>
              <Select
                value={formData.patron_id || NO_PATRON}
                onValueChange={(value) => setFormData({ ...formData, patron_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patron" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PATRON}>No patron assigned</SelectItem>
                  {patronOptions.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Meeting Schedule</Label>
              <Input
                value={formData.meeting_schedule}
                onChange={(e) => setFormData({ ...formData, meeting_schedule: e.target.value })}
                placeholder="e.g., 'Every Friday, 4:00 PM'"
              />
            </div>
            <div>
              <Label>Image</Label>
              <ImageUploader
                bucket="general-assets"
                folder="clubs"
                onUpload={(url) => setFormData({ ...formData, image_url: url })}
                defaultValue={formData.image_url}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            
            <div className="space-y-3 border rounded-lg p-4">
              <Label className="text-base font-semibold">Features</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between">
                  <Label className="font-normal">Feed</Label>
                  <Switch
                    checked={formData.features.feed}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, features: { ...formData.features, feed: checked } })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-normal">Gallery</Label>
                  <Switch
                    checked={formData.features.gallery}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, features: { ...formData.features, gallery: checked } })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-normal">Events</Label>
                  <Switch
                    checked={formData.features.events}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, features: { ...formData.features, events: checked } })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-normal">Resources</Label>
                  <Switch
                    checked={formData.features.resources}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, features: { ...formData.features, resources: checked } })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
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
            <TableHead>Patron</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clubs?.map((club) => (
            <TableRow key={club.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{club.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{club.description}</p>
                </div>
              </TableCell>
              <TableCell>{getPatronName(club.patron_id)}</TableCell>
              <TableCell>
                <Badge variant={club.is_active ? "default" : "secondary"}>
                  {club.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
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