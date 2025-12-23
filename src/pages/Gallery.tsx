import { useState } from "react";
import { Download, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EnhancedFooter from "@/components/EnhancedFooter";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Gallery = () => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: images } = useQuery({
    queryKey: ["gallery-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_media")
        .select("*")
        .eq("media_type", "image")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: videos } = useQuery({
    queryKey: ["gallery-videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_media")
        .select("*")
        .eq("media_type", "video")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const downloadImage = async (imageUrl: string, title: string, id: string) => {
    setDownloadingId(id);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title || "gallery-image"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch (error) {
      toast.error("Failed to download image");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">School Gallery</h1>
          
          <p className="text-lg text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            A glimpse into daily life at Elma School, Kamonong—moments of learning, growth, and joy. Click any image to download!
          </p>

          {images && images.length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8">Photo Gallery</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map((image) => (
                  <div 
                    key={image.id}
                    className="group relative overflow-hidden rounded-xl shadow-soft hover:shadow-hover transition-smooth cursor-pointer"
                    onClick={() => downloadImage(image.file_url, image.title || "gallery-image", image.id)}
                  >
                    <img 
                      src={image.file_url}
                      alt={image.title || "Gallery image"}
                      className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          {image.title && <p className="text-white font-semibold text-lg">{image.title}</p>}
                          {image.description && <p className="text-white/90 text-sm mt-1">{image.description}</p>}
                        </div>
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          className="shrink-0"
                          disabled={downloadingId === image.id}
                        >
                          {downloadingId === image.id ? (
                            <span className="animate-spin">⏳</span>
                          ) : (
                            <Download className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {videos && videos.length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8">Video Gallery</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {videos.map((video) => (
                  <Card key={video.id} className="group overflow-hidden shadow-soft hover:shadow-hover transition-smooth border-0">
                    <CardContent className="p-0">
                      <div className="relative overflow-hidden">
                        <video 
                          id={`video-${video.id}`}
                          src={video.file_url}
                          className="w-full h-64 object-cover"
                          controls
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-semibold mb-2">{video.title || "Video"}</h3>
                        {video.description && <p className="text-muted-foreground">{video.description}</p>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="mt-16 text-center">
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">Visit Us in Person</h2>
              <p className="text-lg text-muted-foreground">
                Nothing captures the spirit of our school better than experiencing it yourself. Schedule a visit to meet our staff, tour our facilities, and see our students in action.
              </p>
            </div>
          </div>
        </div>
      </div>
      <EnhancedFooter />
    </div>
  );
};

export default Gallery;
