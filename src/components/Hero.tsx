import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  const { data: heroContent } = useQuery({
    queryKey: ["hero-content"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hero_content").select("*").single();
      if (error) throw error;
      return data;
    },
  });

  if (!heroContent) return null;

  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] ease-out hover:scale-105"
        style={{ backgroundImage: `url(${heroContent.image_url})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-accent/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
      </div>
      
      <div className="container relative z-10 px-4 py-20 text-center text-white">
        {/* Eye-catching Enrollment Badge */}
        <div className="relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/25 backdrop-blur-md border-2 border-white/50 mb-6 shadow-glow hover:scale-105 transition-all duration-300 animate-pulse-glow">
          {/* Animated Background Layers */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/30 via-white/10 to-white/30 animate-gradient" />
          <div className="absolute inset-0 rounded-full bg-white/20 blur-xl animate-pulse" />
          
          {/* Sparkle Effects */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full animate-ping opacity-75" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white rounded-full animate-ping opacity-50" style={{ animationDelay: '0.5s' }} />
          
          <div className="relative flex items-center gap-3 z-10">
            <div className="h-4 w-4 rounded-full bg-white animate-pulse shadow-premium relative">
              <div className="absolute inset-0 rounded-full bg-white animate-ping" />
            </div>
            <span className="text-lg font-black tracking-wider text-white drop-shadow-lg">
              {heroContent.enrollment_badge_text}
            </span>
            <div className="h-4 w-4 rounded-full bg-white animate-pulse shadow-premium relative">
              <div className="absolute inset-0 rounded-full bg-white animate-ping" />
            </div>
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up leading-tight">
          {heroContent.heading_line1}<br />{heroContent.heading_line2}
        </h1>
        
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-95 animate-fade-in-up leading-relaxed">
          {heroContent.description}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-in">
          <Link to={heroContent.cta1_link || "/admissions"}>
            <Button size="lg" variant="secondary" className="gap-2 shadow-premium hover:scale-105 transition-smooth">
              <Calendar className="h-5 w-5" />
              {heroContent.cta1_text}
            </Button>
          </Link>
          <Link to={heroContent.cta2_link || "/about"}>
            <Button size="lg" variant="outline" className="gap-2 bg-white/10 border-white text-white hover:bg-white hover:text-primary shadow-premium hover:scale-105 transition-smooth backdrop-blur">
              {heroContent.cta2_text}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm opacity-90">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur">
              ✓
            </div>
            <span>{heroContent.badge1_text}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur">
              ✓
            </div>
            <span>{heroContent.badge2_text}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur">
              ✓
            </div>
            <span>{heroContent.badge3_text}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
