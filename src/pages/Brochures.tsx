import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Copy,
  Check,
  MessageCircle,
  GraduationCap,
  Users,
  Award,
  BookOpen,
  Heart,
  Star,
  Phone,
  MapPin,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import schoolLogo from "@/assets/school-logo.png";
import { Link } from "react-router-dom";

const Brochures = () => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingCard, setDownloadingCard] = useState<string | null>(null);

  const websiteUrl = window.location.origin;
  const admissionsUrl = `${websiteUrl}/admissions`;
  const contactPhone = "+254715748735";

  const brochureCards = [
    {
      id: "main-enrollment",
      title: "Now Enrolling 2026",
      subtitle: "Form 3, Form 4 & Grade 10",
      stats: [
        { icon: Users, value: "500+", label: "Students" },
        { icon: Award, value: "98%", label: "Success Rate" },
        { icon: Star, value: "10+", label: "Years Excellence" },
      ],
      features: ["Dual Curriculum (8-4-4 & CBC)", "Christ-Centered Education", "Quality Teachers"],
      gradient: "from-primary via-primary/90 to-primary/80",
    },
    {
      id: "why-choose-us",
      title: "Why Choose Elma School?",
      subtitle: "Building Tomorrow's Leaders",
      highlights: [
        { icon: Heart, text: "Christ-Centered Values" },
        { icon: BookOpen, text: "Dual Curriculum Excellence" },
        { icon: GraduationCap, text: "Qualified Teachers" },
        { icon: Users, text: "Holistic Development" },
      ],
      gradient: "from-secondary via-secondary/90 to-secondary/80",
    },
    {
      id: "admission-info",
      title: "Admission Made Easy",
      subtitle: "3 Simple Steps to Join",
      steps: ["1. Visit our website or school", "2. Fill the application form", "3. Submit required documents"],
      documents: ["Latest/Grade 9 Results", "Birth Certificate", "Passport Photos"],
      gradient: "from-amber-600 via-amber-500 to-amber-400",
    },
    {
      id: "success-stories",
      title: "Join Our Success Story",
      subtitle: "Where Excellence Meets Opportunity",
      testimonial: {
        quote: "Elma School transformed my child's future. The teachers truly care!",
        author: "Parent Testimonial",
      },
      successStats: [
        { value: "95%", label: "Proceed to Higher Learning" },
        { value: "C", label: "Average KCSE Performance" },
      ],
      gradient: "from-primary via-secondary/80 to-amber-500/70",
    },
  ];

  const downloadAsImage = async (cardId: string) => {
    const element = document.getElementById(`brochure-${cardId}`);
    if (!element) return;

    setDownloadingCard(cardId);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: null,
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `elma-school-${cardId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Brochure downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download brochure");
    } finally {
      setDownloadingCard(null);
    }
  };

  const shareToWhatsApp = (cardId: string) => {
    const message = encodeURIComponent(
      `📚 *Elma School, Kamonong - Now Enrolling 2026!*\n\n` +
        `✨ Form 3, Form 4 & Grade 10 Admissions Open\n` +
        `📍 Dual Curriculum (8-4-4 & CBC)\n` +
        `🎓 98% Success Rate | 500+ Students\n\n` +
        `🔗 Learn more & Apply: ${admissionsUrl}\n` +
        `📞 Contact: ${contactPhone}\n\n` +
        `_Knowledge and wisdom builds character_`,
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(admissionsUrl);
    setCopiedLink(true);
    toast.success("Admission link copied!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4 bg-secondary/20 text-secondary-foreground hover:bg-secondary/30">
              📢 Share & Spread the Word
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-6">
              Enrollment <span className="text-primary">Brochures</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Download or share our enrollment materials with parents and students. Help us build the next generation of
              leaders!
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" onClick={() => shareToWhatsApp("main")} className="bg-green-600 hover:bg-green-700">
                <MessageCircle className="mr-2 h-5 w-5" />
                Share on WhatsApp
              </Button>
              <Button size="lg" variant="outline" onClick={copyLink}>
                {copiedLink ? <Check className="mr-2 h-5 w-5" /> : <Copy className="mr-2 h-5 w-5" />}
                {copiedLink ? "Copied!" : "Copy Admission Link"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Brochure Cards Grid */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {brochureCards.map((card) => (
              <div key={card.id} className="space-y-4">
                {/* Brochure Card */}
                <div
                  id={`brochure-${card.id}`}
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-6 md:p-8 text-white shadow-xl`}
                  style={{ aspectRatio: "4/5" }}
                >
                  {/* School Logo & Name */}
                  <div className="flex items-center gap-3 mb-6">
                    <img src={schoolLogo} alt="Elma School" className="h-12 w-12 rounded-full bg-white p-1" />
                    <div>
                      <h3 className="font-heading font-bold text-lg">Elma School, Kamonong</h3>
                      <p className="text-sm opacity-90">Knowledge and wisdom builds character</p>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-heading font-bold mb-1">{card.title}</h2>
                      <p className="text-lg opacity-90">{card.subtitle}</p>
                    </div>

                    {/* Stats for main enrollment card */}
                    {card.stats && (
                      <div className="grid grid-cols-3 gap-2 my-4">
                        {card.stats.map((stat, idx) => (
                          <div key={idx} className="text-center bg-white/20 rounded-lg p-3">
                            <stat.icon className="h-5 w-5 mx-auto mb-1" />
                            <div className="font-bold text-xl">{stat.value}</div>
                            <div className="text-xs opacity-80">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Features */}
                    {card.features && (
                      <ul className="space-y-2">
                        {card.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Highlights for why choose us card */}
                    {card.highlights && (
                      <div className="grid grid-cols-2 gap-3">
                        {card.highlights.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-white/20 rounded-lg p-3">
                            <item.icon className="h-5 w-5" />
                            <span className="text-sm font-medium">{item.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Steps for admission info card */}
                    {card.steps && (
                      <div className="space-y-2">
                        {card.steps.map((step, idx) => (
                          <div key={idx} className="bg-white/20 rounded-lg px-4 py-2 text-sm">
                            {step}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Documents */}
                    {card.documents && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Required Documents:</p>
                        <div className="flex flex-wrap gap-2">
                          {card.documents.map((doc, idx) => (
                            <span key={idx} className="bg-white/30 px-3 py-1 rounded-full text-xs">
                              {doc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Testimonial for success stories card */}
                    {card.testimonial && (
                      <div className="bg-white/20 rounded-lg p-4 my-4">
                        <p className="italic text-sm mb-2">"{card.testimonial.quote}"</p>
                        <p className="text-xs opacity-80">— {card.testimonial.author}</p>
                      </div>
                    )}

                    {/* Success stats */}
                    {card.successStats && (
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        {card.successStats.map((stat, idx) => (
                          <div key={idx} className="text-center bg-white/20 rounded-lg p-3">
                            <div className="font-bold text-2xl">{stat.value}</div>
                            <div className="text-xs opacity-80">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* QR Code & Contact */}
                  <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                    <div className="text-sm">
                      <div className="flex items-center gap-1 mb-1">
                        <Phone className="h-3 w-3" />
                        <span>{contactPhone}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>Kamonong, Kenya</span>
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded-lg">
                      <QRCodeSVG value={admissionsUrl} size={64} level="M" />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => downloadAsImage(card.id)}
                    disabled={downloadingCard === card.id}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {downloadingCard === card.id ? "Downloading..." : "Download"}
                  </Button>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => shareToWhatsApp(card.id)}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    WhatsApp
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 md:py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-4">
            Help Us Reach More Students
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Share these brochures with parents, teachers, and community members. Together, we can build the next
            generation of leaders.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/admissions">
                <GraduationCap className="mr-2 h-5 w-5" />
                Apply Now
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/contact">
                <Phone className="mr-2 h-5 w-5" />
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Brochures;
