import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, FileText, Calendar, Users, Phone, Mail, MapPin, Download, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-school.jpg";
import EnhancedFooter from "@/components/EnhancedFooter";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Admissions = () => {
  const { data: requiredDocuments } = useQuery({
    queryKey: ["required-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("required_documents")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: admissionLetters } = useQuery({
    queryKey: ["admission-letters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admission_letters")
        .select("*")
        .order("form_grade", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const admissionSteps = [
    {
      icon: FileText,
      title: "Application Form",
      description: "Complete and submit the admission application form with required documents",
    },
    {
      icon: Calendar,
      title: "Schedule Visit",
      description: "Arrange a campus tour and meet with our admissions team",
    },
    {
      icon: Users,
      title: "Interview",
      description: "Student interview and assessment to understand their needs and goals",
    },
    {
      icon: CheckCircle,
      title: "Admission Decision",
      description: "Receive admission decision and enrollment information",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }}>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/70 to-black/60"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 mb-6 animate-fade-in">
              <GraduationCap className="h-5 w-5" />
              <span className="font-semibold">Now Enrolling 2026 - Form 3, Form 4 & Grade 10</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">Join Our Learning Community</h1>

            <p className="text-xl md:text-2xl mb-8 text-white/90 animate-fade-in max-w-3xl mx-auto">
              Begin your journey towards academic excellence and spiritual growth at Elma Kamonong High School
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
              <Button
                size="lg"
                className="relative overflow-hidden bg-gradient-to-r from-white to-white/95 text-primary hover:from-white hover:to-white text-lg px-8 shadow-glow font-bold group transition-all duration-300 hover:scale-105 hover:shadow-xl"
                asChild
              >
                <Link to="/contact">
                  <span className="relative z-10">Apply Now</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 animate-[shimmer_2s_ease-in-out_infinite] bg-[length:200%_100%]"></div>
                </Link>
              </Button>
              <Button
                size="lg"
                className="relative overflow-hidden bg-white/10 backdrop-blur-sm border-2 border-white/80 text-white hover:bg-white/20 text-lg px-8 font-bold group transition-all duration-300 hover:scale-105 shadow-soft hover:shadow-glow"
                asChild
              >
                <Link to="/contact">
                  <span className="relative z-10">Schedule a Visit</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 animate-[shimmer_2s_ease-in-out_infinite] bg-[length:200%_100%]"></div>
                </Link>
              </Button>
            </div>

            <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div>
                <div className="text-4xl font-bold mb-2">8-4-4 & CBC</div>
                <div className="text-white/80">Dual Curriculum</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">98%</div>
                <div className="text-white/80">Success Rate</div>
              </div>
              <div className="col-span-2 md:col-span-1">
                <div className="text-4xl font-bold mb-2">450+</div>
                <div className="text-white/80">Active Students</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Admission Letters Download Section */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Download Admission Letters</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Download your official admission letter based on your class and curriculum. All letters are official
                documents for Form 3, Form 4 (8-4-4) and Grade 10 (CBC) enrollment.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {admissionLetters &&
                admissionLetters.map((letter) => (
                  <Card key={letter.id} className="border-0 shadow-soft hover:shadow-hover transition-smooth group">
                    <CardHeader className="bg-gradient-to-br from-primary/5 to-accent/5 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl mb-2">
                            {letter.form_grade} - {letter.gender}
                          </CardTitle>
                          <CardDescription className="text-sm font-semibold text-primary">
                            {letter.curriculum}
                          </CardDescription>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-2 mb-6">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Student:</span> {letter.student_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Admission #:</span> {letter.admission_number}
                        </p>
                      </div>
                      <Button
                        className="w-full bg-gradient-to-r from-primary to-accent text-white shadow-sm hover:shadow-md transition-smooth group-hover:scale-105"
                        asChild
                      >
                        <a href={letter.letter_url} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4 mr-2" />
                          Download Letter
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>

            <div className="mt-8 bg-gradient-to-br from-accent/10 to-primary/10 border border-primary/20 rounded-xl p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-primary mb-3">
                <CheckCircle className="h-5 w-5" />
                <p className="font-semibold text-lg">Official Document</p>
              </div>
              <p className="text-muted-foreground">
                All admission letters are official documents issued by Elma Kamonong High School. Please ensure you
                download the correct letter for your class and curriculum.
              </p>
            </div>
          </section>

          <Card className="mb-12 bg-gradient-to-br from-primary/5 to-accent/5 border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome to EKHS Admissions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed mb-4">
                We are delighted that you are considering Elma Kamonong High School for your child's secondary
                education. Our admissions process is designed to ensure that each student who joins our community will
                thrive in our Christ-centered learning environment.
              </p>
              <p className="text-lg leading-relaxed">
                We welcome applications from students who are committed to academic excellence, personal growth, and
                living out Christian values in their daily lives.
              </p>
            </CardContent>
          </Card>

          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Admission Process</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {admissionSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Card key={index} className="border-0 shadow-soft overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-primary to-accent"></div>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl mb-2">
                            Step {index + 1}: {step.title}
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Required Documents</h2>
            <Card className="border-0 shadow-soft">
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {requiredDocuments?.map((doc) => (
                    <li key={doc.id} className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-lg font-medium">{doc.document_name}</span>
                        {doc.description && <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Tuition & Fees</h2>
            <Card className="border-0 shadow-soft bg-gradient-to-br from-accent/5 to-primary/5">
              <CardContent className="pt-6">
                <p className="text-lg leading-relaxed mb-4">
                  We believe in providing quality education that is accessible to families. Our tuition structure is
                  competitive and transparent, covering accommodation, meals, academic instruction, and co-curricular
                  activities.
                </p>
                <p className="text-lg leading-relaxed font-semibold">
                  For detailed fee structure and payment plans, please contact our admissions office.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Contact Admissions Office</h2>
            <Card className="border-0 shadow-hover">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Phone</p>
                      <p className="text-muted-foreground">+254715748735</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Email</p>
                      <p className="text-muted-foreground">ekhs024@gmail.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Location</p>
                      <p className="text-muted-foreground">Rongai sub-county, Nakuru county</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <Button
                    className="bg-gradient-to-r from-primary to-accent text-white shadow-soft hover:shadow-hover transition-smooth"
                    asChild
                  >
                    <Link to="/contact">Schedule a Campus Visit</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-0 shadow-soft">
            <CardContent className="pt-6 text-center">
              <p className="text-lg leading-relaxed">
                We look forward to welcoming your child to the Elma Kamonong High School family. For any questions about
                the admissions process, please don't hesitate to contact us.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <EnhancedFooter />
    </div>
  );
};

export default Admissions;
