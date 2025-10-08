import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Briefcase, FileText, DollarSign, CreditCard, Star, TrendingUp, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEmployers: 0,
    verifiedEmployers: 0,
    activeJobs: 0,
    totalApplications: 0,
    publishedPosts: 0,
    sponsoredCompanies: 0,
    activeSubscriptions: 0
  });

  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [subscriptionBreakdown, setSubscriptionBreakdown] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch employers
      const { data: employersData } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'employer');

      // Fetch companies stats
      const { count: verifiedCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true);

      const { count: sponsoredCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('is_sponsored', true);

      // Fetch active jobs
      const { count: jobsCount } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch applications
      const { count: applicationsCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true });

      // Fetch published posts
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);

      // Fetch active subscriptions
      const { count: subsCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Fetch subscription breakdown
      const { data: subsData } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('status', 'active');

      const breakdown = subsData?.reduce((acc: any, sub) => {
        acc[sub.tier] = (acc[sub.tier] || 0) + 1;
        return acc;
      }, {});

      const pieData = Object.entries(breakdown || {}).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }));

      setStats({
        totalUsers: usersCount || 0,
        totalEmployers: employersData?.length || 0,
        verifiedEmployers: verifiedCount || 0,
        activeJobs: jobsCount || 0,
        totalApplications: applicationsCount || 0,
        publishedPosts: postsCount || 0,
        sponsoredCompanies: sponsoredCount || 0,
        activeSubscriptions: subsCount || 0
      });

      setSubscriptionBreakdown(pieData);

      // Generate mock revenue data for demonstration
      const mockRevenue = Array.from({ length: 6 }, (_, i) => ({
        month: new Date(2024, i + 5).toLocaleDateString('en-US', { month: 'short' }),
        revenue: Math.floor(Math.random() * 10000) + 5000
      }));
      setRevenueData(mockRevenue);

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of Jobs.al platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalEmployers} employers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeJobs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalApplications} applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifiedEmployers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.sponsoredCompanies} sponsored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedPosts} blog posts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue (€)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Breakdown</CardTitle>
            <CardDescription>Active subscriptions by tier</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subscriptionBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {subscriptionBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button onClick={() => navigate('/admin/users')} variant="outline">
            <Users className="mr-2 h-4 w-4" />
            Manage Users
          </Button>
          <Button onClick={() => navigate('/admin/companies')} variant="outline">
            <Building2 className="mr-2 h-4 w-4" />
            Manage Companies
          </Button>
          <Button onClick={() => navigate('/admin/blog')} variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Manage Blog
          </Button>
          <Button onClick={() => navigate('/admin/settings')} variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            System Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
