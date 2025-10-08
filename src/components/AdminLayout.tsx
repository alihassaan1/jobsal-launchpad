import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Outlet, NavLink } from "react-router-dom";
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
  Briefcase
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const adminMenuItems = [
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-60"}>
      <SidebarContent>
        {adminMenuItems.map((section) => (
          <SidebarGroup key={section.group}>
            {!isCollapsed && <SidebarGroupLabel>{section.group}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          isActive
                            ? "bg-primary text-primary-foreground font-medium"
                            : "hover:bg-muted/50"
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <div className="mt-auto p-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Sign Out</span>}
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center px-4 bg-card">
            <SidebarTrigger />
            <div className="ml-4">
              <h1 className="text-lg font-semibold">Jobs.al Admin</h1>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
