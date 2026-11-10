import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Outlet, NavLink, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/admin/ErrorBoundary";
import { useEffect, useState } from "react";
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
  Briefcase,
  ChevronDown,
  Mail,
  Bot,
  Megaphone,
  Activity,
  PenTool,
  FileCode,
  Palette,
  Package,
  Ticket,
  PanelLeft
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
  SidebarInset,
  useSidebar,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
  SidebarTrigger,

} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AdminLanguageProvider } from "@/contexts/LanguageContext";

interface SubMenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: SubMenuItem[];
}

interface MenuGroup {
  group: string;
  items: MenuItem[];
  color: string;
}

const adminMenuItems: MenuGroup[] = [
  { 
    group: "Overview",
    color: "text-blue-500",
    items: [
      { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
      { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
    ]
  },
  {
    group: "Management",
    color: "text-emerald-500",
    items: [
      { title: "Users", url: "/admin/users", icon: Users },
      { title: "Companies", url: "/admin/companies", icon: Building2 },
      { title: "Jobs", url: "/admin/jobs", icon: Briefcase },
    ]
  },
  {
    group: "Revenue",
    color: "text-amber-500",
    items: [
      { title: "Transactions", url: "/admin/revenue", icon: DollarSign },
      { title: "Packages", url: "/admin/subscriptions", icon: Package },
      { 
        title: "Ads", 
        url: "/admin/ads", 
        icon: Megaphone,
        subItems: [
          { title: "Ad Products", url: "/admin/ads", icon: Package },
          { title: "Ad Analytics", url: "/admin/ad-analytics", icon: Activity },
          { title: "Promo Codes", url: "/admin/promo-codes", icon: Ticket },
        ]
      },
      { 
        title: "Invoices", 
        url: "/admin/invoices", 
        icon: FileText,
        subItems: [
          { title: "All Invoices", url: "/admin/invoices", icon: FileText },
          { title: "Billing Settings", url: "/admin/billing-settings", icon: Settings },
        ]
      },
    ]
  },
  {
    group: "Content & AI",
    color: "text-purple-500",
    items: [
      { 
        title: "Blog", 
        url: "/admin/blog", 
        icon: FileText,
        subItems: [
          { title: "All Posts", url: "/admin/blog", icon: FileText },
          { title: "Content Generator", url: "/admin/content-generator", icon: PenTool },
        ]
      },
      { 
        title: "AI Agent", 
        url: "/admin/ai-agent", 
        icon: Bot,
        subItems: [
          { title: "Dashboard", url: "/admin/ai-agent", icon: LayoutDashboard },
          { title: "API Logs", url: "/admin/ai-agent/logs", icon: FileCode },
          { title: "Analytics", url: "/admin/ai-agent/analytics", icon: Activity },
        ]
      },
      { 
        title: "Marketing", 
        url: "/admin/marketing-agent", 
        icon: Megaphone,
        subItems: [
          { title: "Outreach Agent", url: "/admin/marketing-agent", icon: Bot },
          { title: "Email Campaigns", url: "/admin/emails", icon: Mail },
        ]
      },
    ]
  },
  {
    group: "Settings",
    color: "text-slate-500",
    items: [
      { title: "AI Resume Builder", url: "/admin/resume-builder", icon: FileText },
      { title: "Documents", url: "/admin/documents", icon: FileText },
      { title: "Templates", url: "/admin/templates", icon: Palette },
      { title: "System Settings", url: "/admin/settings", icon: Settings },
    ]
  }
];

function AdminSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const collapsed = state === 'collapsed';
  const [openSections, setOpenSections] = useState<string[]>(['Overview', 'Management', 'Revenue', 'Content & AI', 'Settings']);
  const [openSubMenus, setOpenSubMenus] = useState<string[]>([]);

  // Auto-open submenu if current route matches
  useEffect(() => {
    adminMenuItems.forEach(section => {
      section.items.forEach(item => {
        if (item.subItems?.some(sub => location.pathname === sub.url || location.pathname.startsWith(sub.url + '/'))) {
          setOpenSubMenus(prev => prev.includes(item.title) ? prev : [...prev, item.title]);
        }
      });
    });
  }, [location.pathname]);

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

  const toggleSubMenu = (title: string) => {
    setOpenSubMenus(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const isActiveRoute = (url: string, subItems?: SubMenuItem[]) => {
    if (subItems) {
      return subItems.some(sub => location.pathname === sub.url || location.pathname.startsWith(sub.url + '/'));
    }
    return location.pathname === url;
  };

  return (
    <Sidebar collapsible="icon" className="border-r bg-sidebar">
      <SidebarContent className="px-2 pt-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleSidebar}
              tooltip="Toggle sidebar"
              className="rounded-lg hover:bg-sidebar-accent hover:translate-x-0.5 transition-all duration-200"
            >
              <PanelLeft className="h-4 w-4" />
              <span>Toggle Sidebar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {adminMenuItems.map((section) => (
          <Collapsible
            key={section.group}
            open={openSections.includes(section.group)}
            onOpenChange={() => toggleSection(section.group)}
            className="group/collapsible"
          >
            <SidebarGroup className="py-2">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between hover:bg-sidebar-accent rounded-lg px-3 py-2 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${section.color.replace('text-', 'bg-')}`} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {section.group}
                    </span>
                  </div>
                  {!collapsed && (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                  )}
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent className="mt-1">
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        {item.subItems ? (
                          <Collapsible 
                            open={openSubMenus.includes(item.title)}
                            onOpenChange={() => toggleSubMenu(item.title)}
                            className="w-full"
                          >
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton 
                                className={`w-full justify-between rounded-lg transition-all duration-200 ${
                                  isActiveRoute(item.url, item.subItems)
                                    ? 'bg-primary/10 text-primary border-l-2 border-primary font-medium'
                                    : 'hover:bg-sidebar-accent hover:translate-x-0.5'
                                }`}
                                isActive={isActiveRoute(item.url, item.subItems)}
                              >
                                <span className="flex items-center gap-2.5">
                                  <item.icon className={`h-4 w-4 ${isActiveRoute(item.url, item.subItems) ? section.color : ''}`} />
                                  <span>{item.title}</span>
                                </span>
                                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${openSubMenus.includes(item.title) ? 'rotate-180' : ''}`} />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="ml-4 mt-1 border-l border-sidebar-border pl-3">
                                {item.subItems.map((subItem) => (
                                  <SidebarMenuSubItem key={subItem.title}>
                                    <SidebarMenuSubButton 
                                      asChild 
                                      isActive={location.pathname === subItem.url}
                                      className={`rounded-md transition-all duration-200 ${
                                        location.pathname === subItem.url
                                          ? 'bg-primary/10 text-primary font-medium'
                                          : 'hover:bg-sidebar-accent'
                                      }`}
                                    >
                                      <NavLink to={subItem.url} className="flex items-center gap-2">
                                        <subItem.icon className="h-3.5 w-3.5" />
                                        <span>{subItem.title}</span>
                                      </NavLink>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>
                        ) : (
                          <SidebarMenuButton 
                            asChild 
                            isActive={location.pathname === item.url}
                            className={`rounded-lg transition-all duration-200 ${
                              location.pathname === item.url
                                ? 'bg-primary/10 text-primary border-l-2 border-primary font-medium'
                                : 'hover:bg-sidebar-accent hover:translate-x-0.5'
                            }`}
                          >
                            <NavLink to={item.url} className="flex items-center gap-2.5">
                              <item.icon className={`h-4 w-4 ${location.pathname === item.url ? section.color : ''}`} />
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
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-lg bg-sidebar-accent/50">
            <Avatar className="h-9 w-9 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email?.split('@')[0] || 'Admin'}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AdminLayout() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  // Wait for both auth session AND role lookup before deciding.
  const roleResolving = !!user && userRole === null;

  useEffect(() => {
    if (loading || roleResolving) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    if (userRole !== 'admin') {
      navigate('/');
      toast.error("Access denied");
    }
  }, [loading, roleResolving, user, userRole, navigate]);

  if (loading || roleResolving) return null;
  if (!user || userRole !== 'admin') return null;

  return (
    <AdminLanguageProvider>
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <SidebarInset className="flex-1">
          <header className="h-12 border-b flex md:hidden items-center px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger />
          </header>

          <main className="flex-1 overflow-auto bg-muted/30">
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
    </AdminLanguageProvider>
  );
}
