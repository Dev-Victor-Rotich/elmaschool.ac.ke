import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ImageUploader } from "./ImageUploader";

export const StudentAmbassadorManager = () => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    image_url: "",
    message: "",
    quote: ""
  });

  const queryClient = useQueryClient();

  const { data: ambassador, isLoading, error } = useQuery({
    queryKey: ["student-ambassador"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_ambassador")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("student_ambassador")
        .upsert({ id: ambassador?.id || undefined, ...data });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-ambassador"] });
      toast.success("Student ambassador updated");
      setEditing(false);
    },
  });

  const handleEdit = () => {
    if (ambassador) {
      setFormData({
        name: ambassador.name,
        image_url: ambassador.image_url,
        message: ambassador.message,
        quote: ambassador.quote || ""
      });
    }
    setEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMutation.mutate(formData);
  };

  if (isLoading) return <div>Loading...</div>;
  
  if (error) {
    return (
      <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg text-center">
        <p className="text-destructive font-medium">Failed to load student ambassador</p>
        <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!editing ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Student Ambassador</span>
              <Button onClick={handleEdit}>Edit</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ambassador ? (
              <div className="space-y-4">
                <div>
                  <strong>Name:</strong> {ambassador.name}
                </div>
                {ambassador.image_url && (
                  <img src={ambassador.image_url} alt={ambassador.name} className="h-32 w-32 object-cover rounded" />
                )}
                <div>
                  <strong>Message:</strong>
                  <p className="mt-1">{ambassador.message}</p>
                </div>
                {ambassador.quote && (
                  <div>
                    <strong>Quote:</strong>
                    <p className="mt-1 italic">"{ambassador.quote}"</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No student ambassador set. Click Edit to add one.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Edit Student Ambassador</CardTitle>
          </CardHeader>
          <CardContent>
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
                <Label>Photo</Label>
                <ImageUploader
                  bucket="student-photos"
                  onUpload={(url) => setFormData({ ...formData, image_url: url })}
                  defaultValue={formData.image_url}
                />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={6}
                  required
                />
              </div>
              <div>
                <Label>Quote (Optional)</Label>
                <Input
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
