import { Home, Users, Phone, BookOpen, Award, Video, FileText, Settings, LayoutDashboard, Calendar, Image as ImageIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", url: "#dashboard", icon: LayoutDashboard },
    ]
  },
  {
    title: "Website Content",
    items: [
      { title: "Home Page", url: "#home", icon: Home },
      { title: "About Page", url: "#about", icon: BookOpen },
      { title: "Programs", url: "#programs", icon: Award },
      { title: "Student Voice", url: "#student", icon: Video },
      { title: "Admissions", url: "#admissions", icon: FileText },
      { title: "Gallery", url: "#gallery", icon: ImageIcon },
      { title: "Contact", url: "#contact", icon: Phone },
    ]
  },
  {
    title: "Management",
    items: [
      { title: "Users", url: "#users", icon: Users },
      { title: "Events", url: "#events", icon: Calendar },
      { title: "System", url: "#system", icon: Settings },
    ]
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentHash = location.hash || "#dashboard";
  
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent>
        {menuItems.map((section) => (
          <SidebarGroup key={section.title}>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentHash === item.url;
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <a 
                          href={item.url}
                          className="flex items-center gap-3 transition-smooth"
                        >
                          <Icon className="h-4 w-4" />
                          {!isCollapsed && <span>{item.title}</span>}
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
