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

export const GalleryManager = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  const queryClient = useQueryClient();

  const { data: gallery } = useQuery({
    queryKey: ["gallery-media"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_media")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("gallery_media").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-media"] });
      toast.success("Image added to gallery");
      setOpen(false);
      setTitle("");
      setDescription("");
      setFileUrl("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gallery_media").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-media"] });
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
      media_type: "image",
      file_url: fileUrl,
      title,
      description,
      display_order: (gallery?.length || 0) + 1,
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
            <DialogTitle>Add Image to Gallery</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Image</Label>
              <ImageUploader
                bucket="gallery"
                onUpload={setFileUrl}
                defaultValue={fileUrl}
              />
            </div>
            <div>
              <Label>Title (Optional)</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Image title"
              />
            </div>
            <div>
              <Label>Description (Optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Image description"
              />
            </div>
            <Button type="submit" className="w-full">Add to Gallery</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {gallery?.map((item) => (
          <div key={item.id} className="relative group">
            <img
              src={item.file_url}
              alt={item.title || "Gallery image"}
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
            {item.title && (
              <p className="mt-2 text-sm font-medium">{item.title}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
