import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Njeri",
      role: "Parent",
      content: "The transformation in my daughter has been incredible. The teachers genuinely care about each student's success and the CBC curriculum has helped her develop practical skills.",
      rating: 5,
      initials: "SN",
    },
    {
      name: "David Kimani",
      role: "Former Student",
      content: "Elma School gave me more than education - it gave me confidence and leadership skills. I'm now studying engineering at university, and I owe so much to my teachers here.",
      rating: 5,
      initials: "DK",
    },
    {
      name: "Grace Wanjiku",
      role: "Parent",
      content: "What sets this school apart is the sense of community. My son feels safe, valued, and excited to learn every day. The boarding facilities are excellent too.",
      rating: 5,
      initials: "GW",
    },
  ];

  return (
    <section className="py-20 bg-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(var(--primary),0.05),transparent_50%)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 mb-4">
            <Quote className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in-up">What Our Community Says</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up">
            Real experiences from parents and students who are part of our family
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="shadow-elegant hover:shadow-glow transition-all duration-500 border-0 gradient-card animate-fade-in-up"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-1 mb-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                
                <p className="text-muted-foreground italic leading-relaxed">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center gap-3 pt-4 border-t">
                  <Avatar className="h-12 w-12 bg-gradient-to-br from-primary to-accent">
                    <AvatarFallback className="text-white font-semibold">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
