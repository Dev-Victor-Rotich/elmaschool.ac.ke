import { Link, useLocation } from "react-router-dom";
import { Home, Info, BookOpen, Users, Image, Phone, Award, GraduationCap, Menu, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import schoolLogo from "@/assets/school-logo.png";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const Navigation = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/about", label: "About Us", icon: Info },
    { path: "/cbc", label: "CBC", icon: BookOpen },
    { path: "/programs", label: "Programs", icon: Users },
    { path: "/student", label: "Student Voice", icon: Award },
    { path: "/gallery", label: "Gallery", icon: Image },
    { path: "/admissions", label: "Admissions", icon: GraduationCap },
    { path: "/contact", label: "Contact", icon: Phone },
  ];

  return (
    <nav className={cn(
      "sticky top-0 z-50 w-full border-b transition-smooth",
      isScrolled 
        ? "bg-primary/95 backdrop-blur shadow-soft" 
        : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src={schoolLogo} 
              alt="Elma School, Kamonong Logo" 
              className="h-12 w-12 object-contain"
            />
            <div>
              {!isScrolled ? (
                <div className="font-heading font-bold text-sm md:text-lg text-foreground transition-smooth">
                  Elma School, Kamonong
                </div>
              ) : (
                <div className="text-xs sm:text-sm text-primary-foreground/90 transition-smooth font-medium">
                  Knowledge and wisdom builds character
                </div>
              )}
            </div>
          </Link>
          
          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "hover:bg-muted",
                  isScrolled && "text-primary-foreground hover:bg-primary-foreground/20"
                )}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-smooth",
                        isActive 
                          ? "bg-secondary text-secondary-foreground shadow-soft" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                <Link to="/auth" onClick={() => setOpen(false)}>
                  <Button className="w-full mt-4" size="sm">
                    <LogIn className="h-4 w-4 mr-2" />
                    Portal Login
                  </Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-smooth",
                    isActive 
                      ? isScrolled
                        ? "bg-primary-foreground/20 text-primary-foreground shadow-soft"
                        : "bg-primary text-primary-foreground shadow-soft"
                      : isScrolled
                        ? "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
            <Link to="/auth">
              <Button 
                size="sm" 
                variant={isScrolled ? "secondary" : "default"}
                className="ml-2"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Portal Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
