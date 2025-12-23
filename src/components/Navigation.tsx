import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Info, BookOpen, Users, Image, Phone, Award, GraduationCap, Menu, LogIn, LogOut, User, LayoutDashboard, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import schoolLogo from "@/assets/school-logo.png";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>("");
  const [userAvatar, setUserAvatar] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .single();
        if (profile) {
          setUserName(profile.full_name);
          setUserAvatar(profile.avatar_url || "");
        }
        
        // Get user role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();
        if (roleData) {
          setUserRole(roleData.role);
        }
      }
    };
    getUser();

    // Listen for profile updates
    const profileChannel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          if (payload.new.id === user?.id) {
            setUserName(payload.new.full_name);
            setUserAvatar(payload.new.avatar_url || "");
          }
        }
      )
      .subscribe();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Refresh profile data on auth change
        getUser();
      } else {
        setUser(null);
        setUserName("");
        setUserAvatar("");
        setUserRole("");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
      profileChannel.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleDashboardClick = () => {
    const roleRoutes: Record<string, string> = {
      'super_admin': '/admin/dashboard',
      'teacher': '/staff/teacher',
      'hod': '/staff/hod',
      'bursar': '/staff/bursar',
      'chaplain': '/staff/chaplain',
      'librarian': '/staff/librarian',
      'classteacher': '/staff/classteacher',
      'student': '/students/portal',
      'class_rep': '/students/class-rep',
      'student_leader': '/students/portal',
    };
    
    const route = roleRoutes[userRole] || '/';
    navigate(route);
  };
  
  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/about", label: "About Us", icon: Info },
    { path: "/cbc", label: "CBC", icon: BookOpen },
    { path: "/programs", label: "Programs", icon: Users },
    { path: "/student", label: "Student Voice", icon: Award },
    { path: "/gallery", label: "Gallery", icon: Image },
    { path: "/admissions", label: "Admissions", icon: GraduationCap },
    { path: "/brochures", label: "Brochures", icon: FileText },
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
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="ml-2 h-10 w-10 rounded-full p-0"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={userAvatar} alt={userName || user.email} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDashboardClick}>
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
