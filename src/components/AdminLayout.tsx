import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Outlet, NavLink, useLocation } from "react-router-dom";
import { useEffect } from "react";
import {
  LayoutDashboard,
  DollarSign,
  Building2,
  Users,
  Settings,
  FileText,
  BarChart3,
  CreditCard,
  LogOut,
  Menu,
  Briefcase,
  Sparkles,
  ChevronDown,
  Mail,
  Bot
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { 
  FileText as FileTextIcon,
  Activity
} from "lucide-react";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: { title: string; url: string; icon: React.ComponentType<{ className?: string }> }[];
}

interface MenuGroup {
  group: string;
  items: MenuItem[];
}

const adminMenuItems: MenuGroup[] = [
  { 
    group: "Overview",
    items: [
      { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
      { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
    ]
  },
  {
    group: "Management",
    items: [
      { title: "Users", url: "/admin/users", icon: Users },
      { title: "Companies", url: "/admin/companies", icon: Building2 },
      { title: "Jobs", url: "/admin/jobs", icon: Briefcase },
    ]
  },
  {
    group: "Finance",
    items: [
      { title: "Revenue", url: "/admin/revenue", icon: DollarSign },
      { title: "Subscriptions", url: "/admin/subscriptions", icon: CreditCard },
    ]
  },
  {
    group: "Content",
    items: [
      { title: "Blog", url: "/admin/blog", icon: FileText },
      { title: "Content Generator", url: "/admin/content-generator", icon: Sparkles },
      { 
        title: "AI Agent", 
        url: "/admin/ai-agent", 
        icon: Bot,
        subItems: [
          { title: "Dashboard", url: "/admin/ai-agent", icon: LayoutDashboard },
          { title: "API Logs", url: "/admin/ai-agent/logs", icon: FileTextIcon },
          { title: "Analytics", url: "/admin/ai-agent/analytics", icon: Activity },
        ]
      },
      { title: "Templates", url: "/admin/templates", icon: FileText },
      { title: "Marketing Agent", url: "/admin/marketing-agent", icon: Sparkles },
      { title: "Email Marketing", url: "/admin/emails", icon: Mail },
    ]
  },
  {
    group: "System",
    items: [
      { title: "Settings", url: "/admin/settings", icon: Settings },
    ]
  }
];

function AdminSidebar() {
  const { state } = useSidebar();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const collapsed = state === 'collapsed';
  const [openSections, setOpenSections] = useState<string[]>(['Overview', 'Management', 'Finance', 'Content', 'System']);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };


  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        {adminMenuItems.map((section) => (
          <Collapsible
            key={section.group}
            open={openSections.includes(section.group)}
            onOpenChange={() => toggleSection(section.group)}
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md px-2 py-1.5">
                  <span className="text-xs font-semibold">{section.group}</span>
                  {!collapsed && (
                    <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  )}
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        {item.subItems ? (
                          <Collapsible 
                            defaultOpen={item.subItems.some(sub => location.pathname === sub.url)}
                            className="w-full"
                          >
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton 
                                className="w-full justify-between"
                                isActive={location.pathname.startsWith(item.url)}
                              >
                                <span className="flex items-center gap-2">
                                  <item.icon className="h-4 w-4" />
                                  <span>{item.title}</span>
                                </span>
                                <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {item.subItems.map((subItem) => (
                                  <SidebarMenuSubItem key={subItem.title}>
                                    <SidebarMenuSubButton 
                                      asChild 
                                      isActive={location.pathname === subItem.url}
                                    >
                                      <NavLink to={subItem.url}>
                                        <subItem.icon className="h-3 w-3" />
                                        <span>{subItem.title}</span>
                                      </NavLink>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>
                        ) : (
                          <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                            <NavLink to={item.url}>
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        )}
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}

        <div className="mt-auto p-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {!collapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export default function AdminLayout() {
  const { userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && userRole !== 'admin') {
      navigate('/');
      toast.error("Access denied");
    }
  }, [loading, userRole, navigate]);

  if (loading) return null;
  if (userRole !== 'admin') {
    return null;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <SidebarInset>
          <header className="h-14 border-b flex items-center px-4 bg-card gap-4">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Jobs.al Admin</h1>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
