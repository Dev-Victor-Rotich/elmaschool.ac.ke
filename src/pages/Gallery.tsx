import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import gallery5 from "@/assets/gallery-5.jpg";
import gallery6 from "@/assets/gallery-6.jpg";
import { Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import EnhancedFooter from "@/components/EnhancedFooter";

const Gallery = () => {
  const images = [
    { src: gallery1, alt: "Students in classroom", caption: "Engaged Learning" },
    { src: gallery2, alt: "Science experiment", caption: "Hands-On Science" },
    { src: gallery3, alt: "Sports day", caption: "Athletic Excellence" },
    { src: gallery4, alt: "School assembly", caption: "Community Gathering" },
    { src: gallery5, alt: "Art class", caption: "Creative Expression" },
    { src: gallery6, alt: "Graduation ceremony", caption: "Celebrating Success" }
  ];

  const videos = [
    { 
      id: "video1", 
      title: "School Tour", 
      thumbnail: gallery1,
      description: "Take a virtual tour of our campus"
    },
    { 
      id: "video2", 
      title: "Student Life", 
      thumbnail: gallery2,
      description: "Experience daily life at Elma School"
    },
    { 
      id: "video3", 
      title: "Sports Day Highlights", 
      thumbnail: gallery3,
      description: "Watch our students excel in athletics"
    },
    { 
      id: "video4", 
      title: "Graduation Ceremony", 
      thumbnail: gallery6,
      description: "Celebrating our graduating class"
    }
  ];

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">School Gallery</h1>
          
          <p className="text-lg text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            A glimpse into daily life at Elma School, Kamonong—moments of learning, growth, and joy
          </p>

          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Photo Gallery</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image, index) => (
                <div 
                  key={index}
                  className="group relative overflow-hidden rounded-xl shadow-soft hover:shadow-hover transition-smooth"
                >
                  <img 
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <p className="text-white font-semibold text-lg">{image.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Video Gallery</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {videos.map((video) => (
                <Card key={video.id} className="group overflow-hidden shadow-soft hover:shadow-hover transition-smooth border-0">
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden">
                      <img 
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                        <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer">
                          <Play className="h-8 w-8 text-primary ml-1" fill="currentColor" />
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2">{video.title}</h3>
                      <p className="text-muted-foreground">{video.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

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
