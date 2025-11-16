import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Globe, Beaker, Calculator, Palette, Music, Trophy, Users2, GraduationCap, Target, Award, Heart, ArrowRight, Users, Lightbulb } from "lucide-react";
import EnhancedFooter from "@/components/EnhancedFooter";
import heroImage from "@/assets/hero-school.jpg";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as Icons from "lucide-react";

const Programs = () => {
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: beyondClassroom } = useQuery({
    queryKey: ["beyond-classroom"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beyond_classroom")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: departmentStaff } = useQuery({
    queryKey: ["department-staff"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("department_staff")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: leadershipPrograms } = useQuery({
    queryKey: ["leadership-programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leadership_programs")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: programMembers } = useQuery({
    queryKey: ["program-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_members")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName];
    return Icon || BookOpen;
  };

  const activities = [
    { icon: Trophy, title: "Sports & Athletics", items: ["Football", "Volleyball", "Track & Field", "Basketball"] },
    { icon: Users2, title: "Clubs & Societies", items: ["Science Club", "Debate Club", "Environmental Club", "Drama Society"] },
    { icon: BookOpen, title: "Academic Programs", items: ["Mentorship", "Study Groups", "Library Access", "Computer Lab"] },
    { icon: Users2, title: "Leadership", items: ["Student Council", "Prefects", "Class Representatives", "Peer Support"] }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/90 to-background/80"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 backdrop-blur-sm">
              <GraduationCap className="h-5 w-5" />
              <span className="font-semibold">Excellence in Education</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Empowering Minds Through Quality Programs
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
              At Elma School, Kamonong, we offer comprehensive programs across both 8-4-4 and CBC curricula, nurturing well-rounded students ready for the future.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg shadow-elegant hover:shadow-glow transition-all duration-500 hover:scale-105 group">
                <Link to="/admissions">
                  Apply Now (Forms 3 & 4 Open)
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg shadow-soft hover:shadow-hover transition-all duration-500 hover:scale-105 border-2">
                <Link to="/cbc">Explore CBC Pathways</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          
          {/* Curriculum Systems */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Dual Curriculum Excellence
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                We support both the traditional 8-4-4 system and the modern CBC framework, ensuring quality education for all learners.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="shadow-soft hover:shadow-hover transition-smooth border-0 bg-gradient-to-br from-primary/5 to-background group">
                <CardHeader>
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-smooth">
                    <BookOpen className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-2xl">8-4-4 System</CardTitle>
                  <CardDescription className="text-base">Traditional Kenyan Curriculum</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Currently admitting Form 3 and Form 4 students. Our experienced teachers provide comprehensive exam preparation with a proven track record of excellent KCSE results.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span className="text-sm">Accepting Form 3 & 4 admissions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span className="text-sm">Comprehensive KCSE preparation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span className="text-sm">Subject specialization support</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-soft hover:shadow-hover transition-smooth border-0 bg-gradient-to-br from-accent/5 to-background group">
                <CardHeader>
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-smooth">
                    <Target className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-2xl">CBC System</CardTitle>
                  <CardDescription className="text-base">Competency-Based Curriculum</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Offering Grades 10-12 with three specialized pathways: STEM, Arts & Sports, and Social Sciences. Hands-on learning that builds real-world competencies.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                      <span className="text-sm">Three career pathways available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                      <span className="text-sm">Project-based learning approach</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                      <span className="text-sm">Continuous assessment & portfolios</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Button asChild size="lg" variant="outline" className="shadow-soft hover:shadow-hover">
                <Link to="/cbc">Learn More About CBC Pathways →</Link>
              </Button>
            </div>
          </section>

          {/* Student Leadership & Mentorship */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Student Leadership & Mentorship
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Building confident leaders and responsible citizens through structured mentorship and leadership opportunities.
              </p>
            </div>

            {/* School President & Student Council */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-center mb-8">Our Student Leaders</h3>
              
              {leadershipPrograms?.map((program) => {
                const members = programMembers?.filter((m: any) => m.program_id === program.id);
                const president = members?.find((m: any) => m.display_order === 0);
                const otherMembers = members?.filter((m: any) => m.id !== president?.id);

                return (
                  <div key={program.id} className="mb-12">
                    <h4 className="text-xl font-bold text-center mb-6">{program.title}</h4>
                    
                    {president && (
                      <Card className="shadow-elegant border-0 bg-gradient-to-br from-primary/10 via-background to-accent/5 mb-8 overflow-hidden">
                        <CardContent className="pt-6">
                          <div className="flex flex-col md:flex-row items-center gap-6">
                            {president.image_url && (
                              <div className="relative w-40 h-40 rounded-full overflow-hidden flex-shrink-0 ring-4 ring-primary/30">
                                <img 
                                  src={president.image_url} 
                                  alt={president.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 text-center md:text-left">
                              <div className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold mb-2">
                                {program.title.toUpperCase()}
                              </div>
                              <h4 className="text-2xl font-bold mb-2">{president.name}</h4>
                              {president.message && (
                                <p className="text-foreground leading-relaxed">"{president.message}"</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {otherMembers && otherMembers.length > 0 && (
                      <>
                        <h4 className="text-xl font-bold mb-6 text-center">Council Members</h4>
                        <div className="grid md:grid-cols-4 gap-6 mb-8">
                          {otherMembers.map((member: any) => (
                            <Card key={member.id} className="shadow-soft hover:shadow-hover transition-smooth border-0 text-center group">
                              <CardContent className="pt-6">
                                {member.image_url && (
                                  <div className="relative w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden ring-2 ring-primary/20 group-hover:ring-4 group-hover:ring-primary/40 transition-all">
                                    <img 
                                      src={member.image_url} 
                                      alt={member.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <h5 className="font-bold text-lg mb-1">{member.name}</h5>
                                {member.message && <p className="text-sm text-muted-foreground">{member.message}</p>}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="shadow-soft hover:shadow-hover transition-smooth border-0 bg-gradient-to-br from-background to-primary/5">
                <CardHeader>
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white mb-3">
                    <Users className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl">Peer Mentorship</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Older students guide younger ones in academics, character development, and school life, creating a supportive community.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-soft hover:shadow-hover transition-smooth border-0 bg-gradient-to-br from-background to-accent/5">
                <CardHeader>
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white mb-3">
                    <Award className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl">Student Government</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Student council, class representatives, and prefects develop leadership skills while serving their peers.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-soft hover:shadow-hover transition-smooth border-0 bg-gradient-to-br from-background to-primary/5">
                <CardHeader>
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white mb-3">
                    <Lightbulb className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl">Career Guidance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Regular mentorship sessions help students explore career paths and make informed decisions about their future.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-soft border-0 bg-gradient-to-br from-primary/10 via-background to-accent/10">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Heart className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold mb-2">Character-Centered Mentorship</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Our mentorship program emphasizes integrity, respect, responsibility, and service. Students participate in community service projects, develop emotional intelligence, and learn the importance of giving back to society.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Career and College Preparation */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Career & College Preparation
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Preparing students for success beyond secondary school through comprehensive guidance and skill development.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <Card className="shadow-soft hover:shadow-hover transition-smooth border-0 bg-gradient-to-br from-background to-primary/10">
                <CardHeader>
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white mb-3">
                    <GraduationCap className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-2xl">University Preparation</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>Application guidance for Kenyan universities (KUCCPS) and international institutions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>Personal statement and essay writing workshops</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>Scholarship and bursary application support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>Alumni network connections and mentorship</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="shadow-soft hover:shadow-hover transition-smooth border-0 bg-gradient-to-br from-background to-accent/10">
                <CardHeader>
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white mb-3">
                    <Target className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-2xl">Career Exploration</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                      <span>Career assessment tests and aptitude evaluations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                      <span>Industry visits and professional guest speakers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                      <span>Internship and attachment opportunities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                      <span>Technical and vocational training pathways</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-elegant border-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-bold mb-4">Life Skills & Professional Development</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                        <p className="text-foreground">Communication skills and public speaking training</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                        <p className="text-foreground">Financial literacy and entrepreneurship basics</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                        <p className="text-foreground">Digital literacy and computer skills certification</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                        <p className="text-foreground">Interview preparation and professional etiquette</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative h-64 rounded-xl overflow-hidden shadow-soft">
                    <img 
                      src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop" 
                      alt="Students in career preparation session"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Our Subjects */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Our Subjects</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects?.map((subject) => {
                const Icon = getIcon(subject.icon_name);
                return (
                  <Card key={subject.id} className="shadow-soft hover:shadow-hover transition-all duration-300 border-0">
                    <CardHeader>
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white mb-3">
                        <Icon className="h-7 w-7" />
                      </div>
                      <CardTitle className="text-xl">{subject.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">{subject.description}</CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Beyond the Classroom */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Beyond the Classroom</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {beyondClassroom?.map((item) => (
                <Card key={item.id} className="shadow-soft hover:shadow-hover transition-all duration-300 border-0">
                  <CardContent className="p-6">
                    {item.image_url && (
                      <img 
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-40 object-cover rounded-lg mb-4"
                      />
                    )}
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Departments Section */}
          <section className="mt-16">
            <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Our Departments
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {departments?.map((dept) => {
                const deptStaff = departmentStaff?.filter((s: any) => s.department_id === dept.id);
                const hod = deptStaff?.find((s: any) => s.position.toLowerCase().includes("head") || s.display_order === 0);
                const otherStaff = deptStaff?.filter((s: any) => s.id !== hod?.id);

                return (
                  <Card key={dept.id} className="shadow-soft hover:shadow-hover transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/30">
                    <CardHeader>
                      <CardTitle className="text-2xl">{dept.name}</CardTitle>
                      <CardDescription className="text-base">{dept.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {hod && (
                        <div className="mb-6 p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg">
                          <div className="flex items-start gap-4">
                            {hod.image_url && (
                              <img 
                                src={hod.image_url} 
                                alt={hod.name}
                                className="w-20 h-20 rounded-full object-cover ring-2 ring-primary/20"
                              />
                            )}
                            <div className="flex-1">
                              <div className="text-xs font-semibold text-primary uppercase mb-1">{hod.position}</div>
                              <div className="font-bold text-lg mb-1">{hod.name}</div>
                              {hod.bio && <p className="text-sm text-muted-foreground">{hod.bio}</p>}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {otherStaff && otherStaff.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Department Staff</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {otherStaff.map((staff: any) => (
                              <div key={staff.id} className="flex items-center gap-2">
                                {staff.image_url && (
                                  <img 
                                    src={staff.image_url} 
                                    alt={staff.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate">{staff.name}</div>
                                  <div className="text-xs text-muted-foreground truncate">{staff.position}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>
      </div>
      <EnhancedFooter />
    </div>
  );
};

export default Programs;
