import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const ContactInfoManager = () => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    email: "",
    address: "",
    office_hours: "",
    social_media: {
      facebook: "",
      twitter: "",
      instagram: ""
    }
  });

  const queryClient = useQueryClient();

  const { data: contactInfo, isLoading } = useQuery({
    queryKey: ["contact-info"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_info")
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("contact_info")
        .upsert({ id: contactInfo?.id || undefined, ...data });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-info"] });
      toast.success("Contact information updated");
      setEditing(false);
    },
  });

  const handleEdit = () => {
    if (contactInfo) {
      setFormData({
        phone: contactInfo.phone,
        email: contactInfo.email,
        address: contactInfo.address,
        office_hours: contactInfo.office_hours || "",
        social_media: (contactInfo.social_media as any) || { facebook: "", twitter: "", instagram: "" }
      });
    }
    setEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMutation.mutate(formData);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      {!editing ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Contact Information</span>
              <Button onClick={handleEdit}>Edit</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contactInfo ? (
              <div className="space-y-2">
                <div><strong>Phone:</strong> {contactInfo.phone}</div>
                <div><strong>Email:</strong> {contactInfo.email}</div>
                <div><strong>Address:</strong> {contactInfo.address}</div>
                <div><strong>Office Hours:</strong> {contactInfo.office_hours}</div>
                <div>
                  <strong>Social Media:</strong>
                  <div className="ml-4 mt-1 space-y-1">
                    {contactInfo.social_media && (
                      <>
                        {(contactInfo.social_media as any).facebook && (
                          <div>Facebook: {(contactInfo.social_media as any).facebook}</div>
                        )}
                        {(contactInfo.social_media as any).twitter && (
                          <div>Twitter: {(contactInfo.social_media as any).twitter}</div>
                        )}
                        {(contactInfo.social_media as any).instagram && (
                          <div>Instagram: {(contactInfo.social_media as any).instagram}</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No contact info set</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Edit Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Address</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Office Hours</Label>
                <Textarea
                  value={formData.office_hours}
                  onChange={(e) => setFormData({ ...formData, office_hours: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Social Media</Label>
                <Input
                  placeholder="Facebook URL"
                  value={formData.social_media.facebook}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_media: { ...formData.social_media, facebook: e.target.value }
                  })}
                />
                <Input
                  placeholder="Twitter URL"
                  value={formData.social_media.twitter}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_media: { ...formData.social_media, twitter: e.target.value }
                  })}
                />
                <Input
                  placeholder="Instagram URL"
                  value={formData.social_media.instagram}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_media: { ...formData.social_media, instagram: e.target.value }
                  })}
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
