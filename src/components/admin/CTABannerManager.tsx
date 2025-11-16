import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const CTABannerManager = () => {
  const [editing, setEditing] = useState(false);
  const queryClient = useQueryClient();

  const { data: ctaBanner, isLoading } = useQuery({
    queryKey: ["cta-banner"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cta_banner")
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
  });

  const [formData, setFormData] = useState({
    badge_text: "",
    heading: "",
    description: "",
    cta1_text: "",
    cta1_link: "",
    cta2_text: "",
    cta2_link: "",
    feature1_text: "",
    feature2_text: "",
    feature3_text: "",
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("cta_banner")
        .upsert({ id: ctaBanner?.id, ...data });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cta-banner"] });
      toast.success("CTA banner updated successfully");
      setEditing(false);
    },
    onError: () => {
      toast.error("Failed to update CTA banner");
    },
  });

  const handleEdit = () => {
    if (ctaBanner) {
      setFormData({
        badge_text: ctaBanner.badge_text || "",
        heading: ctaBanner.heading || "",
        description: ctaBanner.description || "",
        cta1_text: ctaBanner.cta1_text || "",
        cta1_link: ctaBanner.cta1_link || "",
        cta2_text: ctaBanner.cta2_text || "",
        cta2_link: ctaBanner.cta2_link || "",
        feature1_text: ctaBanner.feature1_text || "",
        feature2_text: ctaBanner.feature2_text || "",
        feature3_text: ctaBanner.feature3_text || "",
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
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Heading:</p>
          <p className="font-semibold">{ctaBanner?.heading}</p>
          <p className="text-sm mt-2">{ctaBanner?.description}</p>
        </div>
        <Button onClick={handleEdit}>Edit CTA Banner</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Badge Text</Label>
        <Input
          value={formData.badge_text}
          onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Heading</Label>
        <Input
          value={formData.heading}
          onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          required
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
          <Label>Feature 1</Label>
          <Input
            value={formData.feature1_text}
            onChange={(e) => setFormData({ ...formData, feature1_text: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Feature 2</Label>
          <Input
            value={formData.feature2_text}
            onChange={(e) => setFormData({ ...formData, feature2_text: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Feature 3</Label>
          <Input
            value={formData.feature3_text}
            onChange={(e) => setFormData({ ...formData, feature3_text: e.target.value })}
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