import { Home, Users, Mic2, Image } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface StudentContentSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: "home", label: "Home Page", icon: Home },
  { id: "programs", label: "Programs", icon: Users },
  { id: "student", label: "Student Voice", icon: Mic2 },
  { id: "gallery", label: "Gallery", icon: Image },
];

export const StudentContentSidebar = ({ activeSection, onSectionChange }: StudentContentSidebarProps) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        <SidebarGroup>
          {!isCollapsed && (
            <div className="px-4 py-3">
              <SidebarGroupLabel className="text-lg font-semibold">
                Website Content
              </SidebarGroupLabel>
            </div>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.id)}
                    tooltip={item.label}
                    className={cn(
                      "w-full justify-start",
                      activeSection === item.id && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span className="ml-2">{item.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
