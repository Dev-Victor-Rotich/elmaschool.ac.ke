import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Heart, Trophy, Users, Star, School, MapPin, GraduationCap, BookOpen, Award, TrendingUp, Phone, Building2, Utensils, Home, FlaskConical, BookMarked, Church } from "lucide-react";
import heroImage from "@/assets/hero-school.jpg";
import EnhancedFooter from "@/components/EnhancedFooter";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const About = () => {
  const { data: principalMessage } = useQuery({
    queryKey: ["principal-message"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("principal_message")
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: facilities = [] } = useQuery({
    queryKey: ["facilities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facilities")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: academicExcellence = [] } = useQuery({
    queryKey: ["academic-excellence"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_excellence")
        .select("*")
        .order("year", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: alumni = [] } = useQuery({
    queryKey: ["notable-alumni"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notable_alumni")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: parentTestimonials = [] } = useQuery({
    queryKey: ["parent-testimonials"],
    queryFn: async () => {
      const { data, error} = await supabase
        .from("parent_testimonials")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const values = [
    { icon: Target, title: "Excellence", description: "We encourage every student to do their best" },
    { icon: Heart, title: "Respect", description: "We treat everyone with kindness and dignity" },
    { icon: Trophy, title: "Growth", description: "We celebrate progress and resilience" },
    { icon: Users, title: "Community", description: "We build strong relationships and teamwork" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] ease-out hover:scale-105"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-accent/80" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
        </div>
        
        <div className="container relative z-10 px-4 py-20 text-center text-white">
          {/* Enrollment Badge */}
          <div className="relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/25 backdrop-blur-md border-2 border-white/50 mb-6 shadow-glow hover:scale-105 transition-all duration-300 animate-pulse-glow">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/30 via-white/10 to-white/30 animate-gradient" />
            <div className="absolute inset-0 rounded-full bg-white/20 blur-xl animate-pulse" />
            
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full animate-ping opacity-75" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white rounded-full animate-ping opacity-50" style={{ animationDelay: '0.5s' }} />
            
            <div className="relative flex items-center gap-3 z-10">
              <div className="h-4 w-4 rounded-full bg-white animate-pulse shadow-premium relative">
                <div className="absolute inset-0 rounded-full bg-white animate-ping" />
              </div>
              <span className="text-lg font-black tracking-wider text-white drop-shadow-lg">
                🎓 NOW ENROLLING 2026 🎓
              </span>
              <div className="h-4 w-4 rounded-full bg-white animate-pulse shadow-premium relative">
                <div className="absolute inset-0 rounded-full bg-white animate-ping" />
              </div>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up leading-tight">
            Elma School, Kamonong
          </h1>
          
          <p className="text-lg md:text-2xl mb-4 opacity-95 animate-fade-in-up leading-relaxed font-semibold">
            Knowledge and wisdom builds character
          </p>
          
          <div className="flex flex-col items-center gap-3 text-lg opacity-90 mb-8">
            <p className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Rongai sub-county, Nakuru county
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              +254715748735
            </p>
          </div>
        </div>
      </section>

      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
          
            <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="shadow-soft border-0 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary to-accent"></div>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                    <School className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">Christian-Based Education</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      A Christ-centered quality education that nurtures both academic excellence and spiritual growth in a warm, welcoming environment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft border-0 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-accent to-primary"></div>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">Serene Location</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Located in Rongai sub-county, Nakuru county, along Nakuru-Eldama Ravine highway at the foot of the sprawling Kiplombe Hills, offering a peaceful learning environment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft border-0 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary to-accent"></div>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">EBCCK Integration</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Serves Children's Centre students after 8th grade, creating a seamless educational pathway within the EBCCK campus.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft border-0 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-accent to-primary"></div>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">Boarding Program</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Accepts tuition-paying boarding students from across Kenya who value quality, Christ-centered education.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Our Journey
            </h2>
            
            <div className="space-y-6">
              <Card className="shadow-soft border-0 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary to-accent"></div>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-3 text-primary">The Beginning (2014)</h3>
                      <p className="text-base leading-relaxed text-muted-foreground">
                        Elma Kamonong High School opened its doors in January 2014, with administrative offices and a single classroom for twenty form I (freshmen) students. The vision behind the project was two-fold: to accommodate the EBCC students who were graduating from 8th grade and to take the first steps towards a self-sufficient model of operation that would benefit the entire EBCCK campus.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-soft border-0 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-accent to-primary"></div>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Award className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-3 text-accent">Growth & First Graduates (2014-2017)</h3>
                      <p className="text-base leading-relaxed text-muted-foreground">
                        Each year, construction continued on campus resulting in a graduating form IV class in November 2017. The first principal was Mr. Richard Keter, who stepped out of retirement to offer his experience to the new school. He guided the institution through the early years, equipping the school, hiring teachers and staff, and recruiting students.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-soft border-0 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary to-accent"></div>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-3 text-primary">New Leadership (2019)</h3>
                      <p className="text-base leading-relaxed text-muted-foreground">
                        Having met this objective, Mr. Keter returned to enjoy his doubly-deserved retirement. In 2019, the EBCCK Board of Directors hired Mr. Opiyo Ouma Henry, a former EBCCK student, as the new principal. Almost his first task was to deal with the impact of COVID-19 on the school! We are delighted to have Principal Ouma back home at EBCCK/EKHS.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-soft border-0 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-accent to-primary"></div>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <TrendingUp className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-3 text-accent">Building Excellence (Present)</h3>
                      <p className="text-base leading-relaxed text-muted-foreground mb-3">
                        The long-term goal is to create a high school providing the best education possible—one that attracts boarding students from all over Kenya, paying fees that will help make EKHS and EBCCK self-sufficient. Our donors have enabled us to create a high school campus that meets and exceeds all requirements of Kenyan law.
                      </p>
                      <p className="text-base leading-relaxed text-muted-foreground">
                        The gated compound is kept separate from the EBCC portion of the campus and includes dormitories for students, a dining hall and kitchen, general classroom buildings, and a science center. EKHS provides housing for teaching staff to attract and retain the best teachers. In 2021, we opened a new Library & Computer Centre to enhance the ability to teach computer and internet skills.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Our Core Values</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <Card key={index} className="shadow-soft hover:shadow-hover transition-smooth border-0">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
                          <Icon className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl">{value.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">{value.description}</CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-0 shadow-soft overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl text-center">Message from Our Principal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                <div className="flex-shrink-0">
                  <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-hover ring-4 ring-primary/10">
                    <img 
                      src={principalMessage?.image_url} 
                      alt={principalMessage?.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mt-4 text-center">
                    <p className="font-bold text-lg">{principalMessage?.name}</p>
                    <p className="text-muted-foreground">School Principal</p>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-lg leading-relaxed italic mb-4">
                    {principalMessage?.message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-12 text-center">
            <h2 className="text-3xl font-bold mb-6">Why Families Trust Us</h2>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <Card className="border-0 shadow-soft">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">✓ Experienced Teachers</h3>
                  <p className="text-muted-foreground">Caring professionals who understand each student's needs</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-soft">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">✓ Safe Environment</h3>
                  <p className="text-muted-foreground">A welcoming campus where students feel secure and respected</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-soft">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">✓ Parent Partnership</h3>
                  <p className="text-muted-foreground">Open communication and regular updates on student progress</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-6 text-center">What Parents Are Saying</h2>
            <div className="space-y-6">
              {parentTestimonials.map((testimonial) => (
                <Card key={testimonial.id} className="border-0 shadow-soft">
                  <CardContent className="pt-6">
                    {testimonial.stars && (
                      <div className="flex gap-1 mb-3">
                        {[...Array(testimonial.stars)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                        ))}
                      </div>
                    )}
                    <p className="text-lg leading-relaxed mb-4 italic">
                      "{testimonial.message}"
                    </p>
                    <p className="font-semibold">— {testimonial.parent_name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.class_representative}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Vision & Mission</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-0 shadow-soft">
                <CardHeader>
                  <CardTitle className="text-2xl">Our Vision</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg leading-relaxed">
                    To be a christ-centered institution that inspires learners to achieve academic excellence grow in faith & impact the world as servant leaders guided by biblical values
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-accent/5 to-primary/5 border-0 shadow-soft">
                <CardHeader>
                  <CardTitle className="text-2xl">Our Mission</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg leading-relaxed">
                    To nurture & equip learners academically, spiritually & socially through christ-centered education empowering them to grow in knowledge, faith & character so they can serve God & humanity with excellence
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Facilities and Amenities Section */}
          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Our Facilities & Amenities
            </h2>
            <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
              State-of-the-art facilities designed to provide the best learning environment for our students
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {facilities.map((facility) => (
                <Card key={facility.id} className="group shadow-soft border-0 overflow-hidden hover:shadow-premium transition-all duration-300 hover:scale-105">
                  {/* Facility Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={facility.image_url} 
                      alt={facility.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                        <div className="h-10 w-10 rounded-full bg-primary/20 backdrop-blur flex items-center justify-center">
                          <School className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                    </div>
                    
                    <CardContent className="pt-4">
                      <h3 className="font-bold text-lg mb-2">{facility.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {facility.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Academic Excellence Section */}
          <div className="mt-12 relative">
            {/* Decorative Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 rounded-3xl -z-10" />
            
            <div className="relative z-10 py-12 px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                  Academic Excellence
                </h2>
                <div className="h-1 w-32 bg-gradient-to-r from-primary to-accent mx-auto rounded-full mb-6" />
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Celebrating outstanding academic performance and dedication to excellence
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {academicExcellence.map((result, index) => (
                  <Card key={index} className="group shadow-soft border-0 hover:shadow-premium transition-all duration-300 bg-card overflow-hidden hover:scale-105">
                    {/* Student Image with Overlay */}
                    <div className="relative h-48 overflow-hidden">
                      {result.image_url && (
                        <img 
                          src={result.image_url} 
                          alt={result.student_name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-primary bg-background/80 backdrop-blur px-3 py-1 rounded-full">
                            {result.year}
                          </span>
                          <Award className="h-8 w-8 text-primary animate-pulse" />
                        </div>
                      </div>
                    </div>
                    
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        {/* Mean Grade Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
                          <Trophy className="h-4 w-4 text-primary" />
                          <span className="text-sm font-bold text-primary">Mean Grade: {result.mean_grade}</span>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Top Student</p>
                          <p className="font-bold text-lg text-foreground">{result.student_name}</p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Course Pursued</p>
                          <p className="text-sm leading-relaxed text-muted-foreground">{result.course_pursued}</p>
                        </div>
                        {result.university && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">University</p>
                            <p className="text-sm text-muted-foreground">{result.university}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Notable Alumni Section */}
          <div className="mt-16 relative">
            {/* Decorative Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-primary/5 to-accent/5 rounded-3xl -z-10" />
            
            <div className="relative z-10 py-12 px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent animate-gradient">
                  Notable Alumni
                </h2>
                <div className="h-1 w-32 bg-gradient-to-r from-accent to-primary mx-auto rounded-full mb-6" />
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Our graduates are making a difference in their communities and beyond
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {alumni.map((alum) => (
                  <Card key={alum.id} className="group shadow-soft border-0 hover:shadow-premium transition-all duration-300 bg-card overflow-hidden hover:scale-105">
                    {/* Alumni Image with Gradient Overlay */}
                    <div className="relative h-64 overflow-hidden">
                      {alum.image_url ? (
                        <img 
                          src={alum.image_url} 
                          alt={alum.full_name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <GraduationCap className="h-24 w-24 text-primary/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
                      
                      {/* Floating Badge */}
                      <div className="absolute top-4 right-4">
                        <div className="bg-background/90 backdrop-blur px-3 py-1 rounded-full border border-accent/30">
                          <span className="text-xs font-semibold text-accent">Class of {alum.class_year}</span>
                        </div>
                      </div>
                      
                      {/* Name Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="font-bold text-xl mb-1 text-foreground">{alum.full_name}</h3>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/30 backdrop-blur">
                          <Award className="h-3 w-3 text-accent" />
                          <span className="text-xs font-semibold text-accent">{alum.current_position}</span>
                        </div>
                      </div>
                    </div>
                    
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">{alum.achievement}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <EnhancedFooter />
    </div>
  );
};

export default About;
