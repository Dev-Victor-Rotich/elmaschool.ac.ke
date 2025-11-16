import { Award, CheckCircle, Shield, Star } from "lucide-react";

const TrustBadges = () => {
  const badges = [
    {
      icon: Award,
      title: "CBC Accredited",
      description: "Ministry of Education Approved",
    },
    {
      icon: CheckCircle,
      title: "Quality Assured",
      description: "Regular Inspections & Standards",
    },
    {
      icon: Shield,
      title: "Safe Environment",
      description: "24/7 Security & Supervision",
    },
    {
      icon: Star,
      title: "Top Rated",
      description: "4.9/5 Parent Satisfaction",
    },
  ];

  return (
    <section className="py-12 bg-gradient-to-r from-primary/5 to-accent/5">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center gap-3 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-elegant">
                  <Icon className="h-7 w-7" />
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
