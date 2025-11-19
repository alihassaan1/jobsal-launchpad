import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Briefcase, TrendingUp, Download } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "#82ca9d"];

export default function AdminAnalytics() {
  const { userRole } = useAuth();

  // Fetch overall stats
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [jobsData, applicationsData, companiesData, usersData] = await Promise.all([
        supabase.from("jobs").select("id, created_at, category"),
        supabase.from("applications").select("id, created_at"),
        supabase.from("companies").select("id"),
        supabase.from("profiles").select("id"),
      ]);

      return {
        totalJobs: jobsData.data?.length || 0,
        totalApplications: applicationsData.data?.length || 0,
        totalCompanies: companiesData.data?.length || 0,
        totalUsers: usersData.data?.length || 0,
        jobs: jobsData.data || [],
        applications: applicationsData.data || [],
      };
    },
  });

  // Fetch subscriptions data
  const { data: subscriptions = [] } = useQuery({
    queryKey: ["admin-subscriptions-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(
          `
          *,
          subscription_plans(name, price_monthly, price_yearly)
        `
        )
        .eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  // Fetch job categories distribution
  const { data: categoryStats } = useQuery({
    queryKey: ["category-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("category");
      if (error) throw error;

      const counts = data.reduce(
        (acc, job) => {
          acc[job.category] = (acc[job.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    },
  });

  if (userRole !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Calculate revenue (estimated from subscriptions)
  const monthlyRevenue = subscriptions.reduce((sum, sub: any) => {
    return sum + (sub.subscription_plans?.price_monthly || 0);
  }, 0);

  const yearlyRevenue = subscriptions.reduce((sum, sub: any) => {
    return sum + (sub.subscription_plans?.price_yearly || 0);
  }, 0);

  // Subscription tier distribution
  const tierDistribution = subscriptions.reduce(
    (acc, sub: any) => {
      const tier = sub.tier || "free";
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const tierChartData = Object.entries(tierDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Export data as CSV
  const exportData = () => {
    const csvContent = [
      ["Metric", "Value"],
      ["Total Jobs", stats?.totalJobs || 0],
      ["Total Applications", stats?.totalApplications || 0],
      ["Total Companies", stats?.totalCompanies || 0],
      ["Total Users", stats?.totalUsers || 0],
      ["Active Subscriptions", subscriptions.length],
      ["Monthly Revenue (ALL)", (monthlyRevenue / 100).toFixed(2)],
      ["Yearly Revenue (ALL)", (yearlyRevenue / 100).toFixed(2)],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Platform Analytics</h1>
          <p className="text-muted-foreground">Overview of platform performance and revenue</p>
        </div>
        <Button onClick={exportData}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs Posted</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalJobs || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalApplications || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">ALL {(monthlyRevenue / 100).toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              ~ALL {(yearlyRevenue / 100).toFixed(0)}/year
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Top Job Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Tier Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tierChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tierChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Users</span>
                <span className="font-semibold">{stats?.totalUsers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Companies</span>
                <span className="font-semibold">{stats?.totalCompanies || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jobs Posted</span>
                <span className="font-semibold">{stats?.totalJobs || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Applications Received</span>
                <span className="font-semibold">{stats?.totalApplications || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(tierDistribution).map(([tier, count]) => {
                const plan = subscriptions.find((s: any) => s.tier === tier)?.subscription_plans;
                const revenue = (plan?.price_monthly || 0) * count;
                return (
                  <div key={tier} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {tier.charAt(0).toUpperCase() + tier.slice(1)} ({count})
                    </span>
                    <span className="font-semibold">ALL {(revenue / 100).toFixed(0)}/mo</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
