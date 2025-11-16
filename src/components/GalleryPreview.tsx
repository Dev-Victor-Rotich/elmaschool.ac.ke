import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Image as ImageIcon } from "lucide-react";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";

const GalleryPreview = () => {
  const images = [
    { src: gallery1, alt: "Students in classroom" },
    { src: gallery2, alt: "School activities" },
    { src: gallery3, alt: "Campus facilities" },
    { src: gallery4, alt: "Student life" },
  ];

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
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden group animate-scale-in shadow-soft hover:shadow-hover transition-smooth"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
