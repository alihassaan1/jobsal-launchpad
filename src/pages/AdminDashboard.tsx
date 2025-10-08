import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Briefcase, FileText, DollarSign, CreditCard, Star, TrendingUp, Settings, Activity } from "lucide-react";
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
    totalJobSeekers: 0,
    verifiedEmployers: 0,
    activeJobs: 0,
    totalJobs: 0,
    totalApplications: 0,
    publishedPosts: 0,
    sponsoredCompanies: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    monthRevenue: 0,
    resumesCreated: 0
  });

  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [subscriptionBreakdown, setSubscriptionBreakdown] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [jobsByCategory, setJobsByCategory] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);

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

      // Fetch job seekers
      const { data: jobSeekersData } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'job_seeker');

      // Fetch companies stats
      const { count: verifiedCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true);

      const { count: sponsoredCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('is_sponsored', true);

      // Fetch all jobs (active and inactive)
      const { count: totalJobsCount } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true });

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

      // Fetch resumes count
      const { count: resumesCount } = await supabase
        .from('resumes')
        .select('*', { count: 'exact', head: true });

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

      // Fetch jobs by category
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('category')
        .eq('is_active', true);

      const categoryBreakdown = jobsData?.reduce((acc: any, job) => {
        acc[job.category] = (acc[job.category] || 0) + 1;
        return acc;
      }, {});

      const categoryData = Object.entries(categoryBreakdown || {})
        .map(([name, value]) => ({ name, value }))
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 6);

      // Fetch recent activity (users & jobs)
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('full_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: recentJobs } = await supabase
        .from('jobs')
        .select('title, companies(name), created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      const activity = [
        ...(recentUsers || []).map(u => ({
          type: 'user',
          description: `${u.full_name || u.email} joined`,
          timestamp: u.created_at
        })),
        ...(recentJobs || []).map((j: any) => ({
          type: 'job',
          description: `New job: ${j.title} at ${j.companies?.name}`,
          timestamp: j.created_at
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

      // Generate user growth data (last 12 months)
      const growthData = await Promise.all(
        Array.from({ length: 12 }, async (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (11 - i));
          const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
          const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();

          const { count: usersInMonth } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfMonth)
            .lte('created_at', endOfMonth);

          const { count: employersInMonth } = await supabase
            .from('user_roles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'employer')
            .gte('created_at', startOfMonth)
            .lte('created_at', endOfMonth);

          return {
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            users: usersInMonth || 0,
            employers: employersInMonth || 0
          };
        })
      );

      setStats({
        totalUsers: usersCount || 0,
        totalEmployers: employersData?.length || 0,
        totalJobSeekers: jobSeekersData?.length || 0,
        verifiedEmployers: verifiedCount || 0,
        activeJobs: jobsCount || 0,
        totalJobs: totalJobsCount || 0,
        totalApplications: applicationsCount || 0,
        publishedPosts: postsCount || 0,
        sponsoredCompanies: sponsoredCount || 0,
        activeSubscriptions: subsCount || 0,
        totalRevenue: 0, // Will be calculated from actual subscription data
        monthRevenue: 0,
        resumesCreated: resumesCount || 0
      });

      setSubscriptionBreakdown(pieData);
      setJobsByCategory(categoryData);
      setRecentActivity(activity);
      setUserGrowth(growthData);

      // Generate revenue data for demonstration (replace with actual subscription revenue)
      const mockRevenue = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i));
        return {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          revenue: Math.floor(Math.random() * 10000) + 5000
        };
      });
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
              {stats.totalEmployers} employers · {stats.totalJobSeekers} job seekers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs Posted</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeJobs} active · {stats.totalApplications} applications
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
            <CardTitle className="text-sm font-medium">Resumes Created</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resumesCreated}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeSubscriptions} active subscriptions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New users and employers over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#8884d8" name="Users" strokeWidth={2} />
                <Line type="monotone" dataKey="employers" stroke="#82ca9d" name="Employers" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscriptions</CardTitle>
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
                  label={(entry) => `${entry.name} (${entry.value})`}
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

      {/* Second Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#ff6b6b" name="Revenue (€)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job Posts by Category</CardTitle>
            <CardDescription>Top job categories on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={jobsByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#4ecdc4" name="Job Posts" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest users and job postings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                  <div className={`p-2 rounded-full ${activity.type === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                    {activity.type === 'user' ? <Users className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => navigate('/admin/users')} variant="outline" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
            <Button onClick={() => navigate('/admin/companies')} variant="outline" className="w-full justify-start">
              <Building2 className="mr-2 h-4 w-4" />
              Manage Companies
            </Button>
            <Button onClick={() => navigate('/admin/jobs')} variant="outline" className="w-full justify-start">
              <Briefcase className="mr-2 h-4 w-4" />
              Manage Jobs
            </Button>
            <Button onClick={() => navigate('/admin/blog')} variant="outline" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Manage Blog
            </Button>
            <Button onClick={() => navigate('/admin/revenue')} variant="outline" className="w-full justify-start">
              <DollarSign className="mr-2 h-4 w-4" />
              View Revenue
            </Button>
            <Button onClick={() => navigate('/admin/settings')} variant="outline" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              System Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
