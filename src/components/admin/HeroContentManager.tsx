import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ImageUploader } from "./ImageUploader";
import { Loader2 } from "lucide-react";

export const HeroContentManager = () => {
  const [editing, setEditing] = useState(false);
  const queryClient = useQueryClient();

  const { data: heroContent, isLoading } = useQuery({
    queryKey: ["hero-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_content")
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
  });

  const [formData, setFormData] = useState({
    heading_line1: "",
    heading_line2: "",
    description: "",
    image_url: "",
    enrollment_badge_text: "",
    cta1_text: "",
    cta1_link: "",
    cta2_text: "",
    cta2_link: "",
    badge1_text: "",
    badge2_text: "",
    badge3_text: "",
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("hero_content")
        .upsert({ id: heroContent?.id, ...data });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero-content"] });
      toast.success("Hero content updated successfully");
      setEditing(false);
    },
    onError: () => {
      toast.error("Failed to update hero content");
    },
  });

  const handleEdit = () => {
    if (heroContent) {
      setFormData({
        heading_line1: heroContent.heading_line1 || "",
        heading_line2: heroContent.heading_line2 || "",
        description: heroContent.description || "",
        image_url: heroContent.image_url || "",
        enrollment_badge_text: heroContent.enrollment_badge_text || "",
        cta1_text: heroContent.cta1_text || "",
        cta1_link: heroContent.cta1_link || "",
        cta2_text: heroContent.cta2_text || "",
        cta2_link: heroContent.cta2_link || "",
        badge1_text: heroContent.badge1_text || "",
        badge2_text: heroContent.badge2_text || "",
        badge3_text: heroContent.badge3_text || "",
      });
      setEditing(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!editing) {
    return (
      <div className="space-y-4">
        {heroContent?.image_url && (
          <img src={heroContent.image_url} alt="Hero" className="w-full h-48 object-cover rounded-lg" />
        )}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Heading:</p>
          <p className="font-semibold">{heroContent?.heading_line1}</p>
          <p className="font-semibold">{heroContent?.heading_line2}</p>
          <p className="text-sm mt-2">{heroContent?.description}</p>
        </div>
        <Button onClick={handleEdit}>Edit Hero Content</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Hero Image</Label>
        <ImageUploader
          bucket="general-assets"
          folder="hero"
          onUpload={(url) => setFormData({ ...formData, image_url: url })}
          defaultValue={formData.image_url}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Heading Line 1</Label>
          <Input
            value={formData.heading_line1}
            onChange={(e) => setFormData({ ...formData, heading_line1: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Heading Line 2</Label>
          <Input
            value={formData.heading_line2}
            onChange={(e) => setFormData({ ...formData, heading_line2: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Enrollment Badge Text</Label>
        <Input
          value={formData.enrollment_badge_text}
          onChange={(e) => setFormData({ ...formData, enrollment_badge_text: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>CTA 1 Text</Label>
          <Input
            value={formData.cta1_text}
            onChange={(e) => setFormData({ ...formData, cta1_text: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>CTA 1 Link</Label>
          <Input
            value={formData.cta1_link}
            onChange={(e) => setFormData({ ...formData, cta1_link: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>CTA 2 Text</Label>
          <Input
            value={formData.cta2_text}
            onChange={(e) => setFormData({ ...formData, cta2_text: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>CTA 2 Link</Label>
          <Input
            value={formData.cta2_link}
            onChange={(e) => setFormData({ ...formData, cta2_link: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Badge 1 Text</Label>
          <Input
            value={formData.badge1_text}
            onChange={(e) => setFormData({ ...formData, badge1_text: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Badge 2 Text</Label>
          <Input
            value={formData.badge2_text}
            onChange={(e) => setFormData({ ...formData, badge2_text: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Badge 3 Text</Label>
          <Input
            value={formData.badge3_text}
            onChange={(e) => setFormData({ ...formData, badge3_text: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={upsertMutation.isPending}>
          {upsertMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
        <Button type="button" variant="outline" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
};