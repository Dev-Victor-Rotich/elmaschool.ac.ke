import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "./ImageUploader";
import { VideoUploader } from "./VideoUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const GalleryManager = () => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");

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
      toast.success(`${mediaType === "image" ? "Image" : "Video"} added to gallery`);
      resetForm();
    },
  });

  const resetForm = () => {
    setOpen(false);
    setTitle("");
    setDescription("");
    setFileUrl("");
    setEditingId(null);
    setMediaType("image");
  };

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("gallery_media")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-media"] });
      toast.success(`${mediaType === "image" ? "Image" : "Video"} updated`);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gallery_media").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-media"] });
      toast.success(`${mediaType === "image" ? "Image" : "Video"} deleted`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl) {
      toast.error(`Please upload ${mediaType === "image" ? "an image" : "a video"}`);
      return;
    }
    
    const data = {
      media_type: mediaType,
      file_url: fileUrl,
      title,
      description,
      display_order: (gallery?.length || 0) + 1,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setTitle(item.title || "");
    setDescription(item.description || "");
    setFileUrl(item.file_url);
    setMediaType(item.media_type);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Media
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} Gallery Media</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingId && (
              <Tabs value={mediaType} onValueChange={(v) => setMediaType(v as "image" | "video")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="image">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Image
                  </TabsTrigger>
                  <TabsTrigger value="video">
                    <VideoIcon className="h-4 w-4 mr-2" />
                    Video
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            <div>
              <Label>{mediaType === "image" ? "Image" : "Video"}</Label>
              {mediaType === "image" ? (
                <ImageUploader
                  bucket="gallery"
                  onUpload={setFileUrl}
                  defaultValue={fileUrl}
                />
              ) : (
                <VideoUploader
                  bucket="gallery"
                  onUpload={setFileUrl}
                  defaultValue={fileUrl}
                />
              )}
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
            <Button type="submit" className="w-full">
              {editingId ? "Update" : "Add"} {mediaType === "image" ? "Image" : "Video"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {gallery?.map((item) => (
          <div key={item.id} className="relative group">
            {item.media_type === "image" ? (
              <img
                src={item.file_url}
                alt={item.title || "Gallery item"}
                className="w-full h-48 object-cover rounded-lg"
              />
            ) : (
              <div className="relative">
                <video
                  src={item.file_url}
                  className="w-full h-48 object-cover rounded-lg"
                  preload="metadata"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <VideoIcon className="h-12 w-12 text-white opacity-80" />
                </div>
              </div>
            )}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                onClick={() => handleEdit(item)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="destructive"
                onClick={() => deleteMutation.mutate(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {item.title && (
              <p className="mt-2 text-sm font-medium truncate">{item.title}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
