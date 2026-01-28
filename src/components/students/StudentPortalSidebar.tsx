import { LayoutDashboard, DollarSign, GraduationCap } from "lucide-react";
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

interface StudentPortalSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "fees", label: "Fee Details", icon: DollarSign },
  { id: "academics", label: "Academic Analytics", icon: GraduationCap },
];

export const StudentPortalSidebar = ({ activeSection, onSectionChange }: StudentPortalSidebarProps) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r !bg-card">
      <SidebarContent>
        <SidebarGroup>
          {!isCollapsed && (
            <div className="px-4 py-3">
              <SidebarGroupLabel className="text-lg font-semibold">
                Student Portal
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
