import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface ClubSettingsProps {
  club: {
    id: string;
    name: string;
    description: string;
    image_url?: string;
    motto?: string;
    meeting_schedule?: string;
    features: {
      feed: boolean;
      gallery: boolean;
      events: boolean;
      resources: boolean;
    };
    is_active: boolean;
  };
}

const ClubSettings = ({ club }: ClubSettingsProps) => {
  const [name, setName] = useState(club.name);
  const [description, setDescription] = useState(club.description);
  const [imageUrl, setImageUrl] = useState(club.image_url || "");
  const [motto, setMotto] = useState(club.motto || "");
  const [meetingSchedule, setMeetingSchedule] = useState(club.meeting_schedule || "");
  const [features, setFeatures] = useState(club.features);
  const [isActive, setIsActive] = useState(club.is_active);

  const queryClient = useQueryClient();

  useEffect(() => {
    setName(club.name);
    setDescription(club.description);
    setImageUrl(club.image_url || "");
    setMotto(club.motto || "");
    setMeetingSchedule(club.meeting_schedule || "");
    setFeatures(club.features);
    setIsActive(club.is_active);
  }, [club]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("clubs_societies")
        .update({
          name,
          description,
          image_url: imageUrl || null,
          motto: motto || null,
          meeting_schedule: meetingSchedule || null,
          features,
          is_active: isActive,
        })
        .eq("id", club.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-details"] });
      queryClient.invalidateQueries({ queryKey: ["my-clubs"] });
      toast.success("Club settings updated");
    },
    onError: () => {
      toast.error("Failed to update settings");
    },
  });

  const toggleFeature = (feature: keyof typeof features) => {
    setFeatures((prev) => ({ ...prev, [feature]: !prev[feature] }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Update your club's basic details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Club Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Motto/Tagline</Label>
            <Input
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              placeholder="e.g., 'Building Tomorrow's Leaders'"
            />
          </div>

          <div className="space-y-2">
            <Label>Meeting Schedule</Label>
            <Input
              value={meetingSchedule}
              onChange={(e) => setMeetingSchedule(e.target.value)}
              placeholder="e.g., 'Every Friday, 4:00 PM - 5:00 PM'"
            />
          </div>

          <div className="space-y-2">
            <Label>Club Image</Label>
            <ImageUploader
              bucket="general-assets"
              folder="clubs"
              onUpload={(url) => setImageUrl(url)}
              defaultValue={imageUrl}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>
            Enable or disable features for your club space
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Feed</Label>
              <p className="text-sm text-muted-foreground">
                Allow members to post and comment
              </p>
            </div>
            <Switch
              checked={features.feed}
              onCheckedChange={() => toggleFeature("feed")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Gallery</Label>
              <p className="text-sm text-muted-foreground">
                Photo gallery for club activities
              </p>
            </div>
            <Switch
              checked={features.gallery}
              onCheckedChange={() => toggleFeature("gallery")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Events</Label>
              <p className="text-sm text-muted-foreground">
                Club-specific events calendar
              </p>
            </div>
            <Switch
              checked={features.events}
              onCheckedChange={() => toggleFeature("events")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Resources</Label>
              <p className="text-sm text-muted-foreground">
                Shared documents and links
              </p>
            </div>
            <Switch
              checked={features.resources}
              onCheckedChange={() => toggleFeature("resources")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Club Status</CardTitle>
          <CardDescription>Control visibility of your club</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>Active</Label>
              <p className="text-sm text-muted-foreground">
                When inactive, club won't appear in student portals
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={() => updateMutation.mutate()}
        disabled={updateMutation.isPending}
        className="w-full"
      >
        {updateMutation.isPending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Save Changes
      </Button>
    </div>
  );
};

export default ClubSettings;
