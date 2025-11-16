import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Facebook,
  Twitter,
  Instagram,
  GraduationCap,
  Users,
  BookOpen,
  FileText,
  Building2,
  HeartHandshake,
} from "lucide-react";
import EnhancedFooter from "@/components/EnhancedFooter";
import Hero from "@/components/Hero";
import heroImage from "@/assets/hero-school.jpg";

const Contact = () => {
  const helpReasons = [
    {
      icon: GraduationCap,
      title: "Admissions & Enrollment",
      description: "Information about joining our school, application process, and enrollment procedures.",
      department: "Admissions Office",
    },
    {
      icon: Users,
      title: "Parent-Teacher Consultation",
      description: "Schedule meetings with teachers, discuss academic progress, and student welfare.",
      department: "Academic Affairs",
    },
    {
      icon: BookOpen,
      title: "Curriculum & Programs",
      description: "Inquiries about CBC system, 8-4-4 programs, subjects, and learning methodologies.",
      department: "Curriculum Department",
    },
    {
      icon: FileText,
      title: "Documentation & Records",
      description: "Request transcripts, certificates, student records, and official documents.",
      department: "Records Office",
    },
    {
      icon: Building2,
      title: "Facilities & Infrastructure",
      description: "Questions about school facilities, boarding, dining, and campus amenities.",
      department: "Administration",
    },
    {
      icon: HeartHandshake,
      title: "Student Support Services",
      description: "Guidance, counseling, special needs support, and student welfare services.",
      department: "Student Affairs",
    },
  ];

  const contactInfo = [
    {
      icon: Phone,
      title: "Phone",
      details: ["+254 715 748 735"],
      action: "tel:+254715748735",
    },
    {
      icon: Mail,
      title: "Email",
      details: ["info@elmakamonong.ac.ke", "admissions@elmakamonong.ac.ke"],
      action: "mailto:info@elmakamonong.ac.ke",
    },
    {
      icon: MapPin,
      title: "Location",
      details: ["Rongai Sub-County", "Nakuru County, Kenya"],
      action: "https://maps.google.com",
    },
    {
      icon: Clock,
      title: "Office Hours",
      details: ["Monday - Friday: 8:00 AM - 5:00 PM", "Saturday: 9:00 AM - 1:00 PM"],
      action: null,
    },
  ];

  const socialMedia = [
    { icon: Facebook, label: "Facebook", url: "https://facebook.com" },
    { icon: Twitter, label: "Twitter", url: "https://twitter.com" },
    { icon: Instagram, label: "Instagram", url: "https://instagram.com" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <Hero image={heroImage} />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Intro Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              We're Here to Help
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Whether you're a prospective parent, current guardian, or community member, our dedicated team is ready to
              assist you with any inquiries about El Makamong Secondary School.
            </p>
          </div>

          {/* How We Can Help Section */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How Can We Assist You?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our various departments are ready to support you. Here's what we can help you with:
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {helpReasons.map((reason, index) => {
                const Icon = reason.icon;
                return (
                  <Card
                    key={index}
                    className="group border-0 shadow-soft hover:shadow-hover transition-all duration-300 bg-gradient-to-br from-background to-primary/5 hover:to-primary/10 overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-accent/0 group-hover:from-primary/5 group-hover:to-accent/5 transition-all duration-300"></div>
                    <CardHeader className="relative pb-4">
                      <div className="flex items-start gap-4 mb-2">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-soft group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{reason.title}</CardTitle>
                          <p className="text-xs text-primary font-medium">{reason.department}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="relative pt-0">
                      <p className="text-sm text-muted-foreground leading-relaxed">{reason.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Choose your preferred way to reach us</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <Card
                    key={index}
                    className="group shadow-soft border-0 hover:shadow-hover transition-all duration-300 bg-gradient-to-br from-background to-primary/5 hover:to-primary/10 overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-accent/0 group-hover:from-primary/5 group-hover:to-accent/5 transition-all duration-300"></div>
                    <CardHeader className="relative">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-soft group-hover:scale-110 transition-transform duration-300">
                          <Icon className="h-7 w-7" />
                        </div>
                        <CardTitle className="text-xl">{info.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="relative">
                      {info.details.map((detail, idx) => (
                        <p key={idx} className="text-muted-foreground mb-1 text-base">
                          {detail}
                        </p>
                      ))}
                      {info.action && (
                        <Button
                          variant="link"
                          className="pl-0 mt-3 text-primary font-semibold"
                          onClick={() => window.open(info.action, "_blank")}
                        >
                          {info.title === "Location" ? "View on Map" : `Contact via ${info.title}`} →
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* WhatsApp Section */}
          <Card className="shadow-hover border-0 bg-gradient-to-br from-primary/10 to-accent/10 mb-16 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <CardHeader className="relative">
              <CardTitle className="text-2xl md:text-3xl text-center">Quick Contact via WhatsApp</CardTitle>
              <CardDescription className="text-center text-base">
                Get instant responses to your questions
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center relative">
              <Button
                size="lg"
                className="gap-2 shadow-soft hover:shadow-hover px-8 py-6 text-base"
                onClick={() => window.open("https://wa.me/254715748735", "_blank")}
              >
                <Phone className="h-5 w-5" />
                Chat on WhatsApp
              </Button>
            </CardContent>
          </Card>

          {/* Social Media Section */}
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold mb-6">Connect With Us</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Stay updated with our latest news, events, and achievements on social media
            </p>
            <div className="flex justify-center gap-4">
              {socialMedia.map((social, index) => {
                const Icon = social.icon;
                return (
                  <button
                    key={index}
                    onClick={() => window.open(social.url, "_blank")}
                    className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white hover:scale-110 transition-smooth shadow-soft hover:shadow-hover"
                    aria-label={social.label}
                  >
                    <Icon className="h-6 w-6" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA Section */}
          <Card className="shadow-hover border-0 bg-gradient-to-br from-accent/10 to-primary/10 overflow-hidden relative">
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            <CardHeader className="relative">
              <CardTitle className="text-2xl md:text-3xl text-center">Ready to Join Elma kamonong?</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6 relative">
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Enrollment for 2026 is now open. Contact us today to schedule a school visit or learn more about our
                admission process.
              </p>
              <Button size="lg" className="gap-2 shadow-soft hover:shadow-hover px-8 py-6 text-base">
                <Mail className="h-5 w-5" />
                Request Enrollment Information
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <EnhancedFooter />
    </div>
  );
};

export default Contact;
