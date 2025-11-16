import Hero from "@/components/Hero";
import StatsCounter from "@/components/StatsCounter";
import Testimonials from "@/components/Testimonials";
import CTABanner from "@/components/CTABanner";
import GalleryPreview from "@/components/GalleryPreview";
import EnhancedFooter from "@/components/EnhancedFooter";
import TrustBadges from "@/components/TrustBadges";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Award, Heart, Calendar, Quote, HelpCircle, Handshake, Phone } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const { data: homeFeatures = [] } = useQuery({
    queryKey: ["home-features"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_features")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("approved", true)
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data.map((e: any) => ({
        date: new Date(e.event_date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
        title: e.title,
        description: e.description,
      }));
    },
  });

  // Fetch current duty roster based on today's date
  const { data: currentDutyRoster } = useQuery({
    queryKey: ["current-duty-roster"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("duty_rosters")
        .select("*")
        .lte("start_date", today)
        .gte("end_date", today)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Fetch current school occasion based on today's date
  const { data: currentOccasion } = useQuery({
    queryKey: ["current-occasion"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("school_occasions")
        .select("*")
        .lte("start_date", today)
        .gte("end_date", today)
        .order("display_order", { ascending: true })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const { data: faqs = [] } = useQuery({
    queryKey: ["faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  // Determine if school is in session (has active duty roster) or if there's a special occasion
  const isSchoolInSession = !!currentDutyRoster;
  const hasSpecialOccasion = !!currentOccasion;

  return (
    <div className="min-h-screen">
      <Hero />

      {/* Trust Badges */}
      <TrustBadges />

      {/* Dynamic Section - Occasion Message or Duty Roster */}
      <section className="py-16 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto border-0 shadow-hover gradient-card">
            <CardContent className="pt-6 space-y-6">
              {hasSpecialOccasion ? (
                // Display Special Occasion Message
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 mb-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">{currentOccasion.name}</span>
                  </div>
                  <div className="text-lg md:text-xl font-medium text-foreground whitespace-pre-line">
                    {currentOccasion.message}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(currentOccasion.start_date).toLocaleDateString()} - {new Date(currentOccasion.end_date).toLocaleDateString()}
                  </p>
                </div>
              ) : isSchoolInSession && currentDutyRoster ? (
                // Display Duty Roster
                <>
                  {/* Week Info */}
                  <div className="text-center pb-4 border-b border-border">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 mb-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">
                        Week {currentDutyRoster.week_number} - {new Date(currentDutyRoster.start_date).toLocaleDateString()} to {new Date(currentDutyRoster.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Quote */}
                  <div>
                    <Quote className="h-8 w-8 text-primary mb-4 mx-auto" />
                    <blockquote className="text-xl md:text-2xl font-medium text-center mb-4">
                      "{currentDutyRoster.quote}"
                    </blockquote>
                    <p className="text-center text-muted-foreground">— {currentDutyRoster.quote_author}</p>
                  </div>

                  {/* Welfare Message */}
                  {currentDutyRoster.welfare_message && (
                    <div className="text-center text-muted-foreground italic">
                      {currentDutyRoster.welfare_message}
                    </div>
                  )}

                  {/* Teachers on Duty */}
                  <div className="pt-4 border-t border-border">
                    <h3 className="text-center font-bold text-lg mb-4 text-foreground">Teachers on Duty This Week</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {(currentDutyRoster.teachers_on_duty as any[])?.map((teacher: any, index: number) => (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                            {teacher.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{teacher.name}</p>
                            <a href={`tel:${teacher.phone}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {teacher.phone}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                // Fallback message when no data is available
                <div className="text-center text-muted-foreground">
                  <p>School calendar information will be displayed here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Why Families Trust Us */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Families Trust Us</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              At Elma School, Kamonong, we don't just teach subjects—we prepare young people for life.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {homeFeatures.map((feature, index) => {
              const iconMap: Record<string, any> = {
                BookOpen, Users, Award, Heart, Calendar, Quote, HelpCircle, Handshake, Phone
              };
              const Icon = iconMap[feature.icon_name] || BookOpen;
              return (
                <Card 
                  key={index} 
                  className="shadow-soft hover:shadow-hover transition-smooth border-0 gradient-card animate-fade-in-up group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader>
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-smooth">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Counter */}
      <StatsCounter />

      {/* Upcoming Events */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Upcoming Events</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Stay updated with our school calendar and important dates
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {events.map((event, index) => (
              <Card 
                key={index} 
                className="shadow-soft hover:shadow-hover transition-smooth border-0 gradient-card group animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold mb-3 group-hover:scale-110 transition-smooth">
                    {event.date}
                  </div>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{event.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* Gallery Preview */}
      <GalleryPreview />

      {/* FAQs Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about Elma School, Kamonong
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6 bg-card shadow-soft">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-semibold text-lg">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(var(--primary),0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(var(--accent),0.05),transparent_50%)]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 mb-4">
              <Handshake className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Our Partners
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Working together to nurture, educate, and empower every child
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card className="group relative overflow-hidden shadow-elegant hover:shadow-glow transition-all duration-500 border-2 border-primary/10 hover:border-primary/30 bg-gradient-to-br from-card to-card/50 backdrop-blur">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative z-10">
                <div className="inline-flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-accent animate-pulse" />
                  <CardDescription className="text-base font-semibold uppercase tracking-wider text-primary">Primary Partner</CardDescription>
                </div>
                <CardTitle className="text-2xl md:text-3xl group-hover:text-primary transition-colors duration-300">
                  Walindwa Charitable Corporation (U.S.A)
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-muted-foreground text-base leading-relaxed">
                  Supporting education, housing, and holistic care for vulnerable children through sponsorships, teacher support, and program development.
                </p>
              </CardContent>
            </Card>
            
            <Card className="group relative overflow-hidden shadow-elegant hover:shadow-glow transition-all duration-500 border-2 border-accent/10 hover:border-accent/30 bg-gradient-to-br from-card to-card/50 backdrop-blur">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative z-10">
                <div className="inline-flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-gradient-to-r from-accent to-primary animate-pulse" />
                  <CardDescription className="text-base font-semibold uppercase tracking-wider text-accent">Local Partner</CardDescription>
                </div>
                <CardTitle className="text-2xl md:text-3xl group-hover:text-accent transition-colors duration-300">
                  EBCCK Kenyan Board & Staff
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-muted-foreground text-base leading-relaxed">
                  Managing daily operations, providing mentorship, and ensuring a safe, loving environment for all students.
                </p>
              </CardContent>
            </Card>
            
            <Card className="group relative overflow-hidden shadow-elegant hover:shadow-glow transition-all duration-500 border-2 border-primary/10 hover:border-primary/30 bg-gradient-to-br from-card to-card/50 backdrop-blur">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative z-10">
                <div className="inline-flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-accent animate-pulse" />
                  <CardDescription className="text-base font-semibold uppercase tracking-wider text-primary">Educational Partner</CardDescription>
                </div>
                <CardTitle className="text-2xl md:text-3xl group-hover:text-primary transition-colors duration-300">
                  St. John's Primary School
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-muted-foreground text-base leading-relaxed">
                  Collaborating to provide foundational education and a smooth transition into secondary school life.
                </p>
              </CardContent>
            </Card>
            
            <Card className="group relative overflow-hidden shadow-elegant hover:shadow-glow transition-all duration-500 border-2 border-accent/10 hover:border-accent/30 bg-gradient-to-br from-card to-card/50 backdrop-blur">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative z-10">
                <div className="inline-flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-gradient-to-r from-accent to-primary animate-pulse" />
                  <CardDescription className="text-base font-semibold uppercase tracking-wider text-accent">Support Partners</CardDescription>
                </div>
                <CardTitle className="text-2xl md:text-3xl group-hover:text-accent transition-colors duration-300">
                  Community Sponsors & Volunteers
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-muted-foreground text-base leading-relaxed">
                  Offering resources, mentorship, and long-term support to empower students from childhood to career.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <CTABanner />

      {/* Enhanced Footer */}
      <EnhancedFooter />
    </div>
  );
};

export default Home;
