import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Trophy,
  Dumbbell,
  Music,
  Microscope,
  Leaf,
  Building,
  Quote,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Share2,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import schoolLogo from "@/assets/school-logo.png";
import { Link } from "react-router-dom";

const Brochures = () => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingCard, setDownloadingCard] = useState<string | null>(null);

  const websiteUrl = window.location.origin;
  const admissionsUrl = `${websiteUrl}/admissions`;

  // Fetch real data from database
  const { data: siteStats } = useQuery({
    queryKey: ["brochure-stats"],
    queryFn: async () => {
      const { data } = await supabase.from("site_stats").select("*").order("display_order");
      return data || [];
    },
  });

  const { data: galleryImages } = useQuery({
    queryKey: ["brochure-gallery"],
    queryFn: async () => {
      const { data } = await supabase
        .from("gallery_media")
        .select("*")
        .eq("media_type", "image")
        .order("display_order")
        .limit(12);
      return data || [];
    },
  });

  const { data: galleryVideos } = useQuery({
    queryKey: ["brochure-videos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("gallery_media")
        .select("*")
        .eq("media_type", "video")
        .order("display_order")
        .limit(5);
      return data || [];
    },
  });

  // Slideshow state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const slideIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-slideshow
  useEffect(() => {
    if (isPlaying && galleryImages?.length) {
      slideIntervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % galleryImages.length);
      }, 3000);
    }
    return () => {
      if (slideIntervalRef.current) clearInterval(slideIntervalRef.current);
    };
  }, [isPlaying, galleryImages?.length]);

  const { data: clubs } = useQuery({
    queryKey: ["brochure-clubs"],
    queryFn: async () => {
      const { data } = await supabase.from("clubs_societies").select("*").order("member_count", { ascending: false });
      return data || [];
    },
  });

  const { data: academicExcellence } = useQuery({
    queryKey: ["brochure-academic"],
    queryFn: async () => {
      const { data } = await supabase.from("academic_excellence").select("*").order("year", { ascending: false }).limit(4);
      return data || [];
    },
  });

  const { data: facilities } = useQuery({
    queryKey: ["brochure-facilities"],
    queryFn: async () => {
      const { data } = await supabase.from("facilities").select("*").order("display_order").limit(6);
      return data || [];
    },
  });

  const { data: testimonials } = useQuery({
    queryKey: ["brochure-testimonials"],
    queryFn: async () => {
      const { data } = await supabase.from("parent_testimonials").select("*").gte("stars", 4).limit(3);
      return data || [];
    },
  });

  const { data: contactInfo } = useQuery({
    queryKey: ["brochure-contact"],
    queryFn: async () => {
      const { data } = await supabase.from("contact_info").select("*").maybeSingle();
      return data;
    },
  });

  const contactPhone = contactInfo?.phone || "+254715748735";

  // Get stats from database or use defaults
  const getStatValue = (label: string, defaultVal: string) => {
    const stat = siteStats?.find((s) => s.label.toLowerCase().includes(label.toLowerCase()));
    return stat ? `${stat.value}${stat.suffix}` : defaultVal;
  };

  // Get random images for backgrounds
  const getRandomImage = (index: number) => {
    if (!galleryImages?.length) return null;
    return galleryImages[index % galleryImages.length]?.file_url;
  };

  // Sports-related clubs
  const sportsClubs = clubs?.filter(
    (c) =>
      c.name.toLowerCase().includes("football") ||
      c.name.toLowerCase().includes("volleyball") ||
      c.name.toLowerCase().includes("basketball") ||
      c.name.toLowerCase().includes("athletics") ||
      c.name.toLowerCase().includes("sports"),
  );

  // Academic/Creative clubs
  const academicClubs = clubs?.filter(
    (c) =>
      c.name.toLowerCase().includes("science") ||
      c.name.toLowerCase().includes("debate") ||
      c.name.toLowerCase().includes("drama") ||
      c.name.toLowerCase().includes("music") ||
      c.name.toLowerCase().includes("environmental"),
  );

  const downloadAsImage = async (cardId: string) => {
    const element = document.getElementById(`brochure-${cardId}`);
    if (!element) return;

    setDownloadingCard(cardId);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: null,
        logging: false,
        useCORS: true,
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
        `🎓 ${getStatValue("success", "98%")} Success Rate | ${getStatValue("students", "500+")} Students\n\n` +
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
        {galleryImages?.[0]?.file_url && (
          <div
            className="absolute inset-0 opacity-10 bg-cover bg-center"
            style={{ backgroundImage: `url(${galleryImages[0].file_url})` }}
          />
        )}
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

      {/* Video Reel & Slideshow Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-primary/20 text-primary hover:bg-primary/30">
              📽️ Shareable Media
            </Badge>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Video <span className="text-primary">Reel</span> & Gallery
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Share our school videos and images on social media
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Video Player */}
            {galleryVideos?.length ? (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-2xl shadow-xl bg-black aspect-video">
                  <video
                    src={galleryVideos[0]?.file_url}
                    poster={galleryVideos[0]?.thumbnail_url || galleryImages?.[0]?.file_url}
                    controls
                    className="w-full h-full object-contain"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="bg-card rounded-lg p-4 border">
                  <h3 className="font-heading font-bold text-foreground mb-2">
                    {galleryVideos[0]?.title || "School Promotional Video"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {galleryVideos[0]?.description || "Experience life at Elma School, Kamonong"}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = galleryVideos[0]?.file_url || "";
                        link.download = "elma-school-video.mp4";
                        link.target = "_blank";
                        link.click();
                        toast.success("Video download started!");
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        const message = encodeURIComponent(
                          `🎬 *Watch: Elma School, Kamonong*\n\n` +
                          `📽️ ${galleryVideos[0]?.title || "School Video"}\n\n` +
                          `🔗 ${galleryVideos[0]?.file_url || websiteUrl}\n\n` +
                          `📞 Contact: ${contactPhone}\n` +
                          `_Knowledge and wisdom builds character_`
                        );
                        window.open(`https://wa.me/?text=${message}`, "_blank");
                      }}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      WhatsApp
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-muted rounded-2xl flex items-center justify-center">
                <p className="text-muted-foreground">No videos available</p>
              </div>
            )}

            {/* Image Slideshow */}
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-2xl shadow-xl aspect-video">
                {galleryImages?.length ? (
                  <>
                    <img
                      src={galleryImages[currentSlide]?.file_url}
                      alt={galleryImages[currentSlide]?.title || "School gallery"}
                      className="w-full h-full object-cover transition-opacity duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Slideshow Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 bg-white/20 hover:bg-white/30 text-white"
                            onClick={() => setCurrentSlide((prev) => (prev - 1 + (galleryImages?.length || 1)) % (galleryImages?.length || 1))}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 bg-white/20 hover:bg-white/30 text-white"
                            onClick={() => setIsPlaying(!isPlaying)}
                          >
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 bg-white/20 hover:bg-white/30 text-white"
                            onClick={() => setCurrentSlide((prev) => (prev + 1) % (galleryImages?.length || 1))}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-white text-sm">
                          {currentSlide + 1} / {galleryImages?.length}
                        </div>
                      </div>
                    </div>

                    {/* School Branding Overlay */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 rounded-lg px-3 py-2">
                      <img src={schoolLogo} alt="Elma School" className="h-6 w-6 rounded-full bg-white p-0.5" />
                      <span className="text-white text-sm font-medium">Elma School</span>
                    </div>
                  </>
                ) : (
                  <Skeleton className="w-full h-full" />
                )}
              </div>
              <div className="bg-card rounded-lg p-4 border">
                <h3 className="font-heading font-bold text-foreground mb-2">Gallery Slideshow</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Auto-playing gallery of our school - perfect for social media stories
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (galleryImages?.[currentSlide]?.file_url) {
                        const link = document.createElement("a");
                        link.href = galleryImages[currentSlide].file_url;
                        link.download = `elma-school-gallery-${currentSlide + 1}.jpg`;
                        link.target = "_blank";
                        link.click();
                        toast.success("Image download started!");
                      }
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Save Image
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      const message = encodeURIComponent(
                        `📸 *Elma School, Kamonong - Photo Gallery*\n\n` +
                        `🏫 See our beautiful campus!\n\n` +
                        `🔗 Visit: ${websiteUrl}/gallery\n\n` +
                        `📞 Contact: ${contactPhone}\n` +
                        `_Knowledge and wisdom builds character_`
                      );
                      window.open(`https://wa.me/?text=${message}`, "_blank");
                    }}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Thumbnail Strip */}
          {galleryImages && galleryImages.length > 0 && (
            <div className="mt-6 max-w-5xl mx-auto">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {galleryImages.slice(0, 8).map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentSlide(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      currentSlide === idx ? "border-primary scale-105" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img.file_url} alt={img.title || ""} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Program-Specific Brochures */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Program <span className="text-primary">Brochures</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Click on any brochure to download it as an image
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* CBC & Academic Excellence Brochure */}
            <div className="space-y-4">
              <div
                id="brochure-cbc-academic"
                className="relative overflow-hidden rounded-2xl shadow-xl cursor-pointer hover:scale-[1.02] hover:shadow-2xl transition-all duration-300"
                style={{ aspectRatio: "4/5" }}
                onClick={() => downloadAsImage("cbc-academic")}
                title="Click to download"
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${getRandomImage(0) || "/images/gallery-1.jpg"})`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-secondary/80" />

                <div className="relative z-10 p-6 md:p-8 text-white h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <img src={schoolLogo} alt="Elma School" className="h-10 w-10 rounded-full bg-white p-1" />
                    <div>
                      <h3 className="font-heading font-bold text-sm">Elma School, Kamonong</h3>
                      <p className="text-xs opacity-90">Knowledge and wisdom builds character</p>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="mb-4">
                    <Badge className="bg-white/20 text-white mb-2">🎓 Academic Excellence</Badge>
                    <h2 className="text-2xl font-heading font-bold">CBC & 8-4-4 Curriculum</h2>
                    <p className="text-sm opacity-90">Dual curriculum for maximum opportunities</p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-white/20 rounded-lg p-3 text-center">
                      <GraduationCap className="h-5 w-5 mx-auto mb-1" />
                      <div className="font-bold text-lg">{getStatValue("success", "98%")}</div>
                      <div className="text-xs opacity-80">Success Rate</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3 text-center">
                      <Award className="h-5 w-5 mx-auto mb-1" />
                      <div className="font-bold text-lg">{getStatValue("years", "10+")}</div>
                      <div className="text-xs opacity-80">Years Excellence</div>
                    </div>
                  </div>

                  {/* Top Students */}
                  <div className="flex-1">
                    <p className="text-xs font-medium mb-2 opacity-90">⭐ Recent Top Performers:</p>
                    <div className="space-y-2">
                      {academicExcellence?.slice(0, 3).map((student, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2">
                          {student.image_url && (
                            <img
                              src={student.image_url}
                              alt={student.student_name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{student.student_name}</p>
                            <p className="text-xs opacity-80 truncate">
                              {student.mean_grade} → {student.course_pursued}
                            </p>
                          </div>
                        </div>
                      )) ||
                        [1, 2, 3].map((i) => <Skeleton key={i} className="h-12 bg-white/10" />)}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-end justify-between mt-4 pt-4 border-t border-white/20">
                    <div className="text-xs">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{contactPhone}</span>
                      </div>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg">
                      <QRCodeCanvas value={admissionsUrl} size={48} level="M" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => downloadAsImage("cbc-academic")}
                  disabled={downloadingCard === "cbc-academic"}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {downloadingCard === "cbc-academic" ? "..." : "Download"}
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => shareToWhatsApp("cbc-academic")}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>

            {/* Sports & Athletics Brochure */}
            <div className="space-y-4">
              <div
                id="brochure-sports"
                className="relative overflow-hidden rounded-2xl shadow-xl cursor-pointer hover:scale-[1.02] hover:shadow-2xl transition-all duration-300"
                style={{ aspectRatio: "4/5" }}
                onClick={() => downloadAsImage("sports")}
                title="Click to download"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${getRandomImage(2) || "/images/gallery-3.jpg"})`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-orange-600/95 via-red-600/85 to-amber-600/80" />

                <div className="relative z-10 p-6 md:p-8 text-white h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <img src={schoolLogo} alt="Elma School" className="h-10 w-10 rounded-full bg-white p-1" />
                    <div>
                      <h3 className="font-heading font-bold text-sm">Elma School, Kamonong</h3>
                      <p className="text-xs opacity-90">Building champions on & off the field</p>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="mb-4">
                    <Badge className="bg-white/20 text-white mb-2">🏆 Sports & Athletics</Badge>
                    <h2 className="text-2xl font-heading font-bold">Champions in the Making</h2>
                    <p className="text-sm opacity-90">Competitive sports for holistic development</p>
                  </div>

                  {/* Sports Icons */}
                  <div className="flex gap-2 mb-4">
                    <div className="bg-white/20 rounded-full p-2">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div className="bg-white/20 rounded-full p-2">
                      <Dumbbell className="h-5 w-5" />
                    </div>
                    <div className="bg-white/20 rounded-full p-2">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Sports Teams */}
                  <div className="flex-1">
                    <p className="text-xs font-medium mb-2 opacity-90">🏅 Our Sports Programs:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(sportsClubs?.length ? sportsClubs : clubs)?.slice(0, 4).map((club, idx) => (
                        <div key={idx} className="bg-white/15 rounded-lg p-3 text-center">
                          <div className="text-sm font-medium">{club.name}</div>
                          {club.member_count && (
                            <div className="text-xs opacity-80">{club.member_count}+ athletes</div>
                          )}
                        </div>
                      )) ||
                        [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 bg-white/10" />)}
                    </div>

                    <div className="mt-4 bg-white/20 rounded-lg p-3">
                      <p className="text-sm font-medium">🎯 Inter-School Competitions</p>
                      <p className="text-xs opacity-80">County & Regional championships participation</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-end justify-between mt-4 pt-4 border-t border-white/20">
                    <div className="text-xs">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>Kamonong, Kenya</span>
                      </div>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg">
                      <QRCodeCanvas value={admissionsUrl} size={48} level="M" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => downloadAsImage("sports")}
                  disabled={downloadingCard === "sports"}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {downloadingCard === "sports" ? "..." : "Download"}
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => shareToWhatsApp("sports")}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>

            {/* Clubs & Extracurriculars Brochure */}
            <div className="space-y-4">
              <div
                id="brochure-clubs"
                className="relative overflow-hidden rounded-2xl shadow-xl cursor-pointer hover:scale-[1.02] hover:shadow-2xl transition-all duration-300"
                style={{ aspectRatio: "4/5" }}
                onClick={() => downloadAsImage("clubs")}
                title="Click to download"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${getRandomImage(4) || "/images/gallery-5.jpg"})`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/95 via-indigo-600/85 to-blue-600/80" />

                <div className="relative z-10 p-6 md:p-8 text-white h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <img src={schoolLogo} alt="Elma School" className="h-10 w-10 rounded-full bg-white p-1" />
                    <div>
                      <h3 className="font-heading font-bold text-sm">Elma School, Kamonong</h3>
                      <p className="text-xs opacity-90">Discover your passion</p>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="mb-4">
                    <Badge className="bg-white/20 text-white mb-2">🎭 Clubs & Societies</Badge>
                    <h2 className="text-2xl font-heading font-bold">Beyond the Classroom</h2>
                    <p className="text-sm opacity-90">Explore interests & develop talents</p>
                  </div>

                  {/* Club Icons */}
                  <div className="flex gap-2 mb-4">
                    <div className="bg-white/20 rounded-full p-2">
                      <Microscope className="h-5 w-5" />
                    </div>
                    <div className="bg-white/20 rounded-full p-2">
                      <Music className="h-5 w-5" />
                    </div>
                    <div className="bg-white/20 rounded-full p-2">
                      <Leaf className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Clubs List */}
                  <div className="flex-1">
                    <p className="text-xs font-medium mb-2 opacity-90">🌟 Active Clubs:</p>
                    <div className="space-y-2">
                      {(academicClubs?.length ? academicClubs : clubs)?.slice(0, 4).map((club, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2">
                          {club.image_url ? (
                            <img src={club.image_url} alt={club.name} className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                              <Star className="h-4 w-4" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{club.name}</p>
                            {club.member_count && <p className="text-xs opacity-80">{club.member_count} members</p>}
                          </div>
                        </div>
                      )) ||
                        [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 bg-white/10" />)}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-end justify-between mt-4 pt-4 border-t border-white/20">
                    <div className="text-xs">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{contactPhone}</span>
                      </div>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg">
                      <QRCodeCanvas value={admissionsUrl} size={48} level="M" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => downloadAsImage("clubs")}
                  disabled={downloadingCard === "clubs"}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {downloadingCard === "clubs" ? "..." : "Download"}
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => shareToWhatsApp("clubs")}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>

            {/* Modern Facilities Brochure */}
            <div className="space-y-4">
              <div
                id="brochure-facilities"
                className="relative overflow-hidden rounded-2xl shadow-xl cursor-pointer hover:scale-[1.02] hover:shadow-2xl transition-all duration-300"
                style={{ aspectRatio: "4/5" }}
                onClick={() => downloadAsImage("facilities")}
                title="Click to download"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${facilities?.[0]?.image_url || getRandomImage(1) || "/images/gallery-2.jpg"})`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-teal-600/95 via-cyan-600/85 to-emerald-600/80" />

                <div className="relative z-10 p-6 md:p-8 text-white h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <img src={schoolLogo} alt="Elma School" className="h-10 w-10 rounded-full bg-white p-1" />
                    <div>
                      <h3 className="font-heading font-bold text-sm">Elma School, Kamonong</h3>
                      <p className="text-xs opacity-90">World-class learning environment</p>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="mb-4">
                    <Badge className="bg-white/20 text-white mb-2">🏫 Modern Facilities</Badge>
                    <h2 className="text-2xl font-heading font-bold">Learn in Excellence</h2>
                    <p className="text-sm opacity-90">State-of-the-art infrastructure</p>
                  </div>

                  {/* Facilities Grid */}
                  <div className="flex-1">
                    <div className="grid grid-cols-2 gap-2">
                      {facilities?.slice(0, 4).map((facility, idx) => (
                        <div key={idx} className="relative overflow-hidden rounded-lg aspect-square">
                          <img
                            src={facility.image_url}
                            alt={facility.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                            <p className="text-xs font-medium">{facility.title}</p>
                          </div>
                        </div>
                      )) ||
                        [1, 2, 3, 4].map((i) => <Skeleton key={i} className="aspect-square bg-white/10" />)}
                    </div>

                    <div className="mt-3 bg-white/20 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span className="text-sm font-medium">Boarding & Day School</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-end justify-between mt-4 pt-4 border-t border-white/20">
                    <div className="text-xs">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>Kamonong, Kenya</span>
                      </div>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg">
                      <QRCodeCanvas value={admissionsUrl} size={48} level="M" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => downloadAsImage("facilities")}
                  disabled={downloadingCard === "facilities"}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {downloadingCard === "facilities" ? "..." : "Download"}
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => shareToWhatsApp("facilities")}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>

            {/* Parent Testimonials Brochure */}
            <div className="space-y-4">
              <div
                id="brochure-testimonials"
                className="relative overflow-hidden rounded-2xl shadow-xl cursor-pointer hover:scale-[1.02] hover:shadow-2xl transition-all duration-300"
                style={{ aspectRatio: "4/5" }}
                onClick={() => downloadAsImage("testimonials")}
                title="Click to download"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${getRandomImage(5) || "/images/gallery-6.jpg"})`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-rose-600/95 via-pink-600/85 to-fuchsia-600/80" />

                <div className="relative z-10 p-6 md:p-8 text-white h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <img src={schoolLogo} alt="Elma School" className="h-10 w-10 rounded-full bg-white p-1" />
                    <div>
                      <h3 className="font-heading font-bold text-sm">Elma School, Kamonong</h3>
                      <p className="text-xs opacity-90">Trusted by families</p>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="mb-4">
                    <Badge className="bg-white/20 text-white mb-2">💬 Parent Reviews</Badge>
                    <h2 className="text-2xl font-heading font-bold">What Parents Say</h2>
                    <p className="text-sm opacity-90">Real experiences from our community</p>
                  </div>

                  {/* Testimonials */}
                  <div className="flex-1 space-y-3">
                    {testimonials?.slice(0, 2).map((testimonial, idx) => (
                      <div key={idx} className="bg-white/15 rounded-lg p-3">
                        <div className="flex gap-1 mb-1">
                          {Array.from({ length: testimonial.stars || 5 }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-xs italic mb-2 line-clamp-3">
                          <Quote className="h-3 w-3 inline mr-1 opacity-70" />
                          {testimonial.message}
                        </p>
                        <p className="text-xs font-medium opacity-80">— {testimonial.parent_name}</p>
                      </div>
                    )) || (
                      <>
                        <Skeleton className="h-24 bg-white/10" />
                        <Skeleton className="h-24 bg-white/10" />
                      </>
                    )}

                    <div className="bg-white/20 rounded-lg p-3 text-center">
                      <Heart className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-sm font-medium">Join Our Family</p>
                      <p className="text-xs opacity-80">500+ happy families</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-end justify-between mt-4 pt-4 border-t border-white/20">
                    <div className="text-xs">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{contactPhone}</span>
                      </div>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg">
                      <QRCodeCanvas value={admissionsUrl} size={48} level="M" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => downloadAsImage("testimonials")}
                  disabled={downloadingCard === "testimonials"}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {downloadingCard === "testimonials" ? "..." : "Download"}
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => shareToWhatsApp("testimonials")}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>

            {/* Main Enrollment Brochure */}
            <div className="space-y-4">
              <div
                id="brochure-main-enrollment"
                className="relative overflow-hidden rounded-2xl shadow-xl cursor-pointer hover:scale-[1.02] hover:shadow-2xl transition-all duration-300"
                style={{ aspectRatio: "4/5" }}
                onClick={() => downloadAsImage("main-enrollment")}
                title="Click to download"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${getRandomImage(3) || "/images/hero-school.jpg"})`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-secondary/80" />

                <div className="relative z-10 p-6 md:p-8 text-white h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <img src={schoolLogo} alt="Elma School" className="h-10 w-10 rounded-full bg-white p-1" />
                    <div>
                      <h3 className="font-heading font-bold text-sm">Elma School, Kamonong</h3>
                      <p className="text-xs opacity-90">Knowledge and wisdom builds character</p>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="mb-4">
                    <Badge className="bg-white/20 text-white mb-2 animate-pulse">🎓 NOW ENROLLING 2026</Badge>
                    <h2 className="text-2xl font-heading font-bold">Form 3, Form 4 & Grade 10</h2>
                    <p className="text-sm opacity-90">Secure your child's future today</p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-white/20 rounded-lg p-2 text-center">
                      <Users className="h-4 w-4 mx-auto mb-1" />
                      <div className="font-bold text-sm">{getStatValue("students", "500+")}</div>
                      <div className="text-xs opacity-80">Students</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-2 text-center">
                      <Award className="h-4 w-4 mx-auto mb-1" />
                      <div className="font-bold text-sm">{getStatValue("success", "98%")}</div>
                      <div className="text-xs opacity-80">Success</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-2 text-center">
                      <Star className="h-4 w-4 mx-auto mb-1" />
                      <div className="font-bold text-sm">{getStatValue("years", "10+")}</div>
                      <div className="text-xs opacity-80">Years</div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2">
                      <Check className="h-4 w-4" />
                      <span className="text-sm">Dual Curriculum (8-4-4 & CBC)</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2">
                      <Check className="h-4 w-4" />
                      <span className="text-sm">Christ-Centered Education</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2">
                      <Check className="h-4 w-4" />
                      <span className="text-sm">Qualified & Caring Teachers</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2">
                      <Check className="h-4 w-4" />
                      <span className="text-sm">Modern Facilities & Boarding</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-end justify-between mt-4 pt-4 border-t border-white/20">
                    <div className="text-xs">
                      <div className="flex items-center gap-1 mb-1">
                        <Phone className="h-3 w-3" />
                        <span>{contactPhone}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>Kamonong, Kenya</span>
                      </div>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg">
                      <QRCodeCanvas value={admissionsUrl} size={48} level="M" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => downloadAsImage("main-enrollment")}
                  disabled={downloadingCard === "main-enrollment"}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {downloadingCard === "main-enrollment" ? "..." : "Download"}
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => shareToWhatsApp("main-enrollment")}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
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
