import { Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import EnhancedFooter from "@/components/EnhancedFooter";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Gallery = () => {
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

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">School Gallery</h1>
          
          <p className="text-lg text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            A glimpse into daily life at Elma School, Kamonong—moments of learning, growth, and joy
          </p>

          {images && images.length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8">Photo Gallery</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map((image, index) => (
                  <div 
                    key={image.id}
                    className="group relative overflow-hidden rounded-xl shadow-soft hover:shadow-hover transition-smooth"
                  >
                    <img 
                      src={image.file_url}
                      alt={image.title || "Gallery image"}
                      className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                      <div>
                        {image.title && <p className="text-white font-semibold text-lg">{image.title}</p>}
                        {image.description && <p className="text-white/90 text-sm mt-1">{image.description}</p>}
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
                        {video.thumbnail_url ? (
                          <img 
                            src={video.thumbnail_url}
                            alt={video.title || "Video thumbnail"}
                            className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <video 
                            id={`video-${video.id}`}
                            src={video.file_url}
                            className="w-full h-64 object-cover"
                            preload="metadata"
                          />
                        )}
                        <button
                          onClick={() => {
                            const videoEl = document.getElementById(`video-${video.id}`) as HTMLVideoElement;
                            if (videoEl) {
                              if (videoEl.paused) {
                                videoEl.play();
                                videoEl.controls = true;
                              } else {
                                videoEl.pause();
                              }
                            }
                          }}
                          className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center"
                        >
                          <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer">
                            <Play className="h-8 w-8 text-primary ml-1" fill="currentColor" />
                          </div>
                        </button>
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
