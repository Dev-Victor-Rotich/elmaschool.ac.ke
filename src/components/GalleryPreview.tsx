import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Image as ImageIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const GalleryPreview = () => {
  const { data: images } = useQuery({
    queryKey: ["gallery-media-preview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_media")
        .select("*")
        .eq("media_type", "image")
        .order("display_order", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  if (!images?.length) return null;

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 mb-4">
            <ImageIcon className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in-up">Experience Campus Life</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up">
            Take a glimpse into daily life at Elma School
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto mb-8">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative aspect-square rounded-lg overflow-hidden group animate-scale-in shadow-soft hover:shadow-hover transition-smooth"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <img
                src={image.file_url}
                alt={image.title || "Gallery image"}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {image.title && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white font-semibold">{image.title}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center animate-fade-in-up">
          <Link to="/gallery">
            <Button size="lg" className="gap-2 shadow-hover hover:scale-105 transition-smooth">
              View Full Gallery
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default GalleryPreview;
