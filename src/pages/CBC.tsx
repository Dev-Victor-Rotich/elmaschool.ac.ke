import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Users, Target, Palette, MessageSquare, Calculator, BookOpen, Award, Sparkles, GraduationCap, Rocket, Globe, Briefcase, FlaskConical, Music, TrendingUp, CheckCircle2, ArrowRight, HelpCircle } from "lucide-react";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import heroImage from "@/assets/hero-school.jpg";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";

const CBC = () => {
  const pathways = [
    {
      icon: FlaskConical,
      title: "STEM Pathway",
      subtitle: "For Innovators & Problem Solvers",
      description: "This pathway focuses on Science, Technology, Engineering, and Mathematics. Learners engage in project-based exploration of robotics, environmental science, ICT, and applied mathematics. The goal: to nurture analytical thinkers and innovators who design solutions for real-world challenges.",
      color: "primary"
    },
    {
      icon: Music,
      title: "Arts & Sports Pathway",
      subtitle: "For Creative Minds & Performers",
      description: "Built for students who express themselves through imagination and performance. It integrates fine arts, music, design, drama, and sports, encouraging self-expression, teamwork, and creativity as tools for impact.",
      color: "accent"
    },
    {
      icon: Globe,
      title: "Social Sciences Pathway",
      subtitle: "For Future Leaders & Change-Makers",
      description: "Designed to shape socially aware thinkers and responsible citizens. Learners explore humanities, business, psychology, and civic engagement — building communication, empathy, and leadership skills for the modern world.",
      color: "secondary"
    }
  ];

  const distinctApproach = [
    "Specialized faculty trained in CBC implementation at senior level",
    "Modern learning facilities — digital labs, innovation spaces, and creative studios",
    "Assessment portfolios that reflect individual growth and skills mastery",
    "Community & industry linkages for experiential learning",
    "Guidance & mentorship for career readiness and personal growth"
  ];

  const projects = [
    "Grade 10 students developing eco-innovation prototypes",
    "Grade 11 business simulations and entrepreneurship projects",
    "Grade 12 mentorship presentations and career exhibitions"
  ];

  const faqs = [
    {
      question: "What opportunities follow Elma's CBC pathways?",
      answer: "Our CBC pathways open doors to university programs, technical institutes, and direct career opportunities. STEM pathway graduates pursue engineering, medicine, and technology fields. Arts & Sports pathway students excel in creative industries, performing arts, and professional sports. Social Sciences pathway learners thrive in business, law, psychology, and public service. Each pathway includes mentorship and industry connections to ensure smooth transitions."
    },
    {
      question: "How do we assess progress at senior level?",
      answer: "We use continuous assessment through portfolios, practical projects, presentations, and collaborative work. Rather than relying solely on final exams, we track skill mastery, critical thinking development, and competency growth throughout the year. Parents receive regular updates showing their child's progress across different learning areas, with detailed feedback on strengths and areas for improvement."
    },
    {
      question: "How does CBC prepare learners for university or technical careers?",
      answer: "CBC emphasizes real-world skills alongside academic knowledge. Students engage in internships, industry projects, research presentations, and collaborative problem-solving. They develop portfolio evidence of their competencies, learn to communicate effectively, think critically, and work in teams. This practical approach means our graduates enter higher education or careers already equipped with essential 21st-century skills."
    },
    {
      question: "Can students switch between pathways?",
      answer: "Students choose their pathway in Grade 10 based on aptitude assessments and career counseling. While pathways are designed for focused development, we offer flexibility in Grade 10 for students who need to adjust. Our guidance team works closely with learners and parents to ensure each student is on the right path for their strengths and aspirations."
    },
    {
      question: "What makes Elma's CBC implementation different?",
      answer: "We combine specialized faculty training, modern learning facilities, and strong industry partnerships. Our teachers are CBC-trained experts who understand competency-based learning. Students have access to digital labs, innovation spaces, and creative studios. Plus, our community linkages provide real experiential learning opportunities that prepare students for life beyond school."
    }
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
              <Rocket className="h-5 w-5" />
              <span className="font-semibold">Confident & Future-Focused</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Shaping Future-Ready Learners Through CBC Pathways
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
              At Elma Senior School, CBC isn't just about classroom learning — it's about preparing learners to think critically, innovate boldly, and lead responsibly. We equip Grade 10–12 students with real-world competencies that bridge school, university, and career pathways.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg shadow-elegant hover:shadow-glow transition-all duration-500 hover:scale-105 group">
                <Link to="/programs">
                  Explore Our Pathways
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg shadow-soft hover:shadow-hover transition-all duration-500 hover:scale-105 border-2">
                <Link to="/admissions">Apply to Elma</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="py-16 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-20">
            
            {/* What CBC Means at Senior Level */}
            <section className="animate-fade-in">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  CBC at the Advanced Stage (Grades 10–12)
                </h2>
                <div className="max-w-3xl mx-auto">
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    At this level, learners focus on specialized pathways designed to build expertise, independence, and practical life skills. CBC in Senior School goes beyond content — it emphasizes:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 text-left">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 backdrop-blur-sm">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <p className="text-foreground">Mastery of skills in chosen career pathways</p>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/5 backdrop-blur-sm">
                      <CheckCircle2 className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                      <p className="text-foreground">Integration of innovation, communication, and critical thinking</p>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 backdrop-blur-sm">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <p className="text-foreground">Real-life projects, internships, and mentorship</p>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/5 backdrop-blur-sm">
                      <CheckCircle2 className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                      <p className="text-foreground">Continuous assessment through portfolios, presentations, and teamwork</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Three Pathways */}
            <section>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">Our Three CBC Pathways at Elma</h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  Every learner is unique — that's why Elma offers three competency pathways that guide each student toward their strengths, passions, and career ambitions.
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {pathways.map((pathway, index) => {
                  const Icon = pathway.icon;
                  return (
                    <Card 
                      key={index}
                      className="group shadow-hover hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-primary/5 hover:to-primary/10 overflow-hidden relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-accent/0 group-hover:from-primary/5 group-hover:to-accent/5 transition-all duration-300"></div>
                      <CardHeader className="relative">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300 shadow-soft">
                          <Icon className="h-8 w-8" />
                        </div>
                        <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                          {pathway.title}
                        </CardTitle>
                        <CardDescription className="text-base font-semibold">
                          {pathway.subtitle}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="relative">
                        <p className="text-muted-foreground leading-relaxed">
                          {pathway.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Why Elma's CBC Works */}
            <section>
              <Card className="shadow-hover border-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <CardHeader className="relative">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="h-8 w-8 text-primary" />
                    <CardTitle className="text-3xl md:text-4xl">Our Distinct Approach to Competency-Based Learning</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="grid md:grid-cols-2 gap-6">
                    {distinctApproach.map((item, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-background/50 backdrop-blur-sm">
                        <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                        <p className="text-foreground text-lg">{item}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* CBC in Action */}
            <section>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">Learning by Doing at Elma Senior School</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Real projects, real impact, real learning
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                {projects.map((project, index) => (
                  <Card 
                    key={index}
                    className="group shadow-soft hover:shadow-hover transition-all duration-300 border-0 bg-gradient-to-br from-background to-accent/5 hover:to-accent/10 overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-primary/0 group-hover:from-accent/5 group-hover:to-primary/5 transition-all duration-300"></div>
                    <CardContent className="p-6 relative">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform">
                          <Lightbulb className="h-5 w-5" />
                        </div>
                        <p className="text-foreground leading-relaxed pt-2">{project}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Parent & Guardian Insight */}
            <section>
              <Card className="shadow-hover border-0 bg-gradient-to-br from-accent/10 via-background to-primary/10 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                <CardHeader className="relative">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="h-8 w-8 text-primary" />
                    <CardTitle className="text-3xl md:text-4xl">Partnering with Parents in the CBC Journey</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8 relative">
                  <div className="grid md:grid-cols-3 gap-4">
                    <img src={gallery1} alt="Students in classroom collaboration" className="rounded-xl shadow-soft w-full h-48 object-cover hover:scale-105 transition-transform duration-300" />
                    <img src={gallery2} alt="Science laboratory activities" className="rounded-xl shadow-soft w-full h-48 object-cover hover:scale-105 transition-transform duration-300" />
                    <img src={gallery3} alt="Creative arts performance" className="rounded-xl shadow-soft w-full h-48 object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                  
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    We believe in collaboration between school and home. Parents receive progress updates based on continuous assessment, projects, and learner growth — not just final exams. Our open days and exhibitions showcase each learner's competencies in action.
                  </p>
                  
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h3 className="text-2xl font-bold">Frequently Asked Questions</h3>
                      <p className="text-muted-foreground mt-2">Click on any question to see the answer</p>
                    </div>
                    
                    <Accordion type="single" collapsible className="w-full space-y-4">
                      {faqs.map((faq, index) => (
                        <AccordionItem 
                          key={index} 
                          value={`item-${index}`} 
                          className="border-2 rounded-xl px-6 bg-card/50 backdrop-blur-sm shadow-soft hover:shadow-hover transition-all duration-300 hover:border-primary/30"
                        >
                          <AccordionTrigger className="text-left hover:no-underline py-5 group">
                            <span className="font-semibold text-lg group-hover:text-primary transition-colors">{faq.question}</span>
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground pb-5 text-base leading-relaxed">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Final CTA */}
            <section className="text-center py-12">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl opacity-30"></div>
                <Card className="relative shadow-hover border-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-12">
                    <GraduationCap className="h-16 w-16 text-primary mx-auto mb-6" />
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                      Discover your pathway. Define your future.
                    </h2>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                      Join Elma Senior School — where CBC becomes a launchpad for innovation, leadership, and lifelong learning.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button asChild size="lg" className="text-lg shadow-elegant hover:shadow-glow transition-all duration-500 hover:scale-105 group">
                        <Link to="/admissions">
                          Enroll Now
                          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                        </Link>
                      </Button>
                      <Button asChild size="lg" variant="outline" className="text-lg shadow-soft hover:shadow-hover transition-all duration-500 hover:scale-105 border-2">
                        <Link to="/contact">Visit Elma Campus</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

          </div>
        </div>
      </div>
      <EnhancedFooter />
    </div>
  );
};

export default CBC;
