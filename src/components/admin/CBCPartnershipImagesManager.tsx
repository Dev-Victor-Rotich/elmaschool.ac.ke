import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "./ImageUploader";

export const CBCPartnershipImagesManager = () => {
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  const queryClient = useQueryClient();

  const { data: images } = useQuery({
    queryKey: ["cbc-partnership-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cbc_partnership_images")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("cbc_partnership_images").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cbc-partnership-images"] });
      toast.success("Image added");
      setOpen(false);
      setCaption("");
      setFileUrl("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cbc_partnership_images").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cbc-partnership-images"] });
      toast.success("Image deleted");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl) {
      toast.error("Please upload an image");
      return;
    }
    createMutation.mutate({
      image_url: fileUrl,
      caption,
      display_order: (images?.length || 0) + 1,
    });
  };

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Image
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Partnership Image</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Image</Label>
              <ImageUploader
                bucket="cbc-images"
                onUpload={setFileUrl}
                defaultValue={fileUrl}
              />
            </div>
            <div>
              <Label>Caption (Optional)</Label>
              <Input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Image caption"
              />
            </div>
            <Button type="submit" className="w-full">Add Image</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images?.map((item) => (
          <div key={item.id} className="relative group">
            <img
              src={item.image_url}
              alt={item.caption || "Partnership image"}
              className="w-full h-48 object-cover rounded-lg"
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => deleteMutation.mutate(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {item.caption && (
              <p className="mt-2 text-sm">{item.caption}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
