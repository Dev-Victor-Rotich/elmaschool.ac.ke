import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CTABanner = () => {
  const { data: banner } = useQuery({
    queryKey: ["cta-banner"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cta_banner")
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (!banner) return null;

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Animated Background Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-accent animate-gradient" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_50%)] animate-pulse" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.1),transparent_50%)] animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Floating Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white/10 blur-xl animate-bounce" style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center text-white space-y-8">
          {/* Eye-catching Enrollment Badge */}
          <div className="relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/25 backdrop-blur-md border-2 border-white/50 mb-4 shadow-glow hover:scale-105 transition-all duration-300 animate-pulse-glow">
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
                {banner.badge_text}
              </span>
              <div className="h-4 w-4 rounded-full bg-white animate-pulse shadow-premium relative">
                <div className="absolute inset-0 rounded-full bg-white animate-ping" />
              </div>
            </div>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold leading-tight animate-fade-in-up">
            {banner.heading}
          </h2>
          
          <p className="text-lg md:text-xl opacity-95 max-w-2xl mx-auto animate-fade-in-up">
            {banner.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-scale-in">
            <Link to={banner.cta1_link || "/admissions"}>
              <Button size="lg" variant="secondary" className="gap-2 shadow-glow hover:scale-110 transition-all duration-300 text-primary font-bold animate-pulse">
                <Phone className="h-5 w-5" />
                {banner.cta1_text}
              </Button>
            </Link>
            <Link to={banner.cta2_link || "/contact"}>
              <Button 
                size="lg" 
                variant="outline" 
                className="gap-2 bg-white/10 border-white text-white hover:bg-white hover:text-primary shadow-hover hover:scale-105 transition-smooth backdrop-blur"
              >
                {banner.cta2_text}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8 text-sm opacity-90">
            {banner.feature1_text && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>{banner.feature1_text}</span>
              </div>
            )}
            {banner.feature2_text && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>{banner.feature2_text}</span>
              </div>
            )}
            {banner.feature3_text && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>{banner.feature3_text}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTABanner;
