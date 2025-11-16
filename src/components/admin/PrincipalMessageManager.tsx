import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ImageUploader } from "./ImageUploader";
import { Edit } from "lucide-react";

export const PrincipalMessageManager = () => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    image_url: "",
    message: "",
  });

  const queryClient = useQueryClient();

  const { data: principalMessage } = useQuery({
    queryKey: ["principal-message"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("principal_message")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("principal_message")
        .upsert(data, { onConflict: "id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["principal-message"] });
      toast.success("Principal message updated");
      setEditing(false);
    },
  });

  const handleEdit = () => {
    if (principalMessage) {
      setFormData({
        name: principalMessage.name,
        image_url: principalMessage.image_url,
        message: principalMessage.message,
      });
    }
    setEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = principalMessage
      ? { ...formData, id: principalMessage.id }
      : formData;
    upsertMutation.mutate(data);
  };

  if (!editing && principalMessage) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
            <img
              src={principalMessage.image_url}
              alt={principalMessage.name}
              className="w-32 h-32 rounded-lg object-cover"
            />
            <div>
              <h3 className="font-semibold text-lg">{principalMessage.name}</h3>
              <p className="text-muted-foreground mt-2">{principalMessage.message}</p>
            </div>
          </div>
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Principal Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Principal's full name"
          required
        />
      </div>

      <div>
        <Label>Photo</Label>
        <ImageUploader
          bucket="staff-photos"
          folder="principal"
          onUpload={(url) => setFormData({ ...formData, image_url: url })}
          defaultValue={formData.image_url}
        />
      </div>

      <div>
        <Label>Message</Label>
        <Textarea
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Principal's message to students and parents"
          rows={6}
          required
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit">Save Message</Button>
        {principalMessage && (
          <Button type="button" variant="outline" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};
