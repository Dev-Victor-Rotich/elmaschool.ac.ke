import { Card, CardContent } from "@/components/ui/card";
import { Quote, Play, Star } from "lucide-react";
import EnhancedFooter from "@/components/EnhancedFooter";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Student = () => {
  const { data: ambassador } = useQuery({
    queryKey: ["student-ambassador"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_ambassador")
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: clubs } = useQuery({
    queryKey: ["clubs-societies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clubs_societies")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: previousLeaders } = useQuery({
    queryKey: ["previous-leaders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("previous_leaders")
        .select("*")
        .order("year", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: studentStats } = useQuery({
    queryKey: ["student-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_stats")
        .select("*")
        .in("label", ["Active Students", "Clubs & Activities", "Student Satisfaction"])
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">Student Voice</h1>
          
          <p className="text-lg text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Hear directly from our students about their experience at Elma Kamonong High School
          </p>

          {ambassador && (
            <Card className="shadow-soft border-0 overflow-hidden">
              <div className="md:flex">
                <div className="md:w-2/5">
                  <img 
                    src={ambassador.image_url}
                    alt={ambassador.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="md:w-3/5 p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">{ambassador.name}</h2>
                    <p className="text-muted-foreground">Senior Prefect & Student Ambassador</p>
                  </div>
                  
                  <CardContent className="p-0 space-y-4">
                    <p className="text-lg leading-relaxed whitespace-pre-line">
                      {ambassador.message}
                    </p>
                    
                    {ambassador.quote && (
                      <div className="bg-gradient-to-br from-primary/5 to-accent/5 p-6 rounded-lg mt-6 relative">
                        <Quote className="absolute top-4 left-4 h-8 w-8 text-primary/20" />
                        <p className="text-xl font-medium italic pt-6">
                          "{ambassador.quote}"
                        </p>
                      </div>
                    )}
                  </CardContent>
                </div>
              </div>
            </Card>
          )}

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {studentStats?.map((stat, index) => (
              <Card key={stat.id} className="border-0 shadow-soft text-center p-6">
                <div className={`text-4xl font-bold mb-2 ${index % 2 === 0 ? 'text-primary' : 'text-accent'}`}>
                  {stat.value}{stat.suffix}
                </div>
                <p className="text-muted-foreground">{stat.label}</p>
              </Card>
            ))}
          </div>

          {/* Clubs Section */}
          <section className="mt-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Clubs & Societies</h2>
            <p className="text-lg text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Join our vibrant student communities
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clubs?.map((club) => (
                <Card key={club.id} className="shadow-soft hover:shadow-hover transition-all duration-300 border-0">
                  <CardContent className="p-6">
                    {club.image_url && (
                      <img 
                        src={club.image_url}
                        alt={club.name}
                        className="w-full h-40 object-cover rounded-lg mb-4"
                      />
                    )}
                    <h3 className="text-xl font-bold mb-2">{club.name}</h3>
                    <p className="text-muted-foreground mb-3">{club.description}</p>
                    {club.member_count && (
                      <p className="text-sm text-primary font-semibold">{club.member_count} members</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Previous Student Leaders Section */}
          <section className="mt-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Previous Student Leaders</h2>
            <p className="text-lg text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Honoring the legacy of our past student leaders who have shaped our school community
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {previousLeaders?.map((leader) => (
                <Card key={leader.id} className="border-0 shadow-soft hover:shadow-hover transition-all duration-300 overflow-hidden">
                  <CardContent className="p-0">
                    {leader.image_url && (
                      <div className="relative overflow-hidden">
                        <img 
                          src={leader.image_url}
                          alt={leader.name}
                          className="w-full h-56 object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-1">{leader.name}</h3>
                      <p className="text-primary font-semibold mb-1">{leader.role}</p>
                      <p className="text-sm text-muted-foreground mb-3">{leader.year}</p>
                      <p className="text-sm italic">{leader.achievement}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>
      <EnhancedFooter />
    </div>
  );
};

export default Student;
