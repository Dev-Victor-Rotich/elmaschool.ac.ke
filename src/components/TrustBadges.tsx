import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as Icons from "lucide-react";

const TrustBadges = () => {
  const { data: badges } = useQuery({
    queryKey: ["trust-badges"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trust_badges").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  if (!badges?.length) return null;

  return (
    <section className="py-12 bg-gradient-to-r from-primary/5 to-accent/5">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {badges.map((badge, index) => {
            const IconComponent = Icons[badge.icon_name as keyof typeof Icons] as any;
            return (
              <div key={badge.id} className="flex flex-col items-center text-center gap-3 animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-elegant">
                  {IconComponent && <IconComponent className="h-7 w-7" />}
                </div>
                <div>
                  <p className="font-bold text-sm mb-1">{badge.title}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
