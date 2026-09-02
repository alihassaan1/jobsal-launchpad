import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Briefcase, Eye, Users, TrendingUp, Clock } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type DateRange = "7d" | "30d" | "all";

export default function EmployerAnalytics() {
  const { user, userRole } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  // Fetch company info
  const { data: company } = useQuery({
    queryKey: ["employer-company", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch jobs with stats
  const { data: jobs = [] } = useQuery({
    queryKey: ["employer-jobs-analytics", company?.id, dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, views_count, applications_count, created_at, is_active")
        .eq("company_id", company?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!company?.id,
  });

  // Fetch applications with status
  const { data: applications = [] } = useQuery({
    queryKey: ["employer-applications-analytics", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(
          `
          id,
          status,
          created_at,
          viewed_at,
          job_id,
          jobs!inner(company_id)
        `
        )
        .eq("jobs.company_id", company?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!company?.id,
  });

  if (authLoading || (!!user && !userRole)) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!user) {
    return <Navigate to="/auth?type=employer" replace />;
  }

  if (userRole !== "employer" && userRole !== "admin") {
    return <Navigate to="/" replace />;
  }


  if (!company) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Loading analytics...</p>
      </div>
    );
  }

  // Calculate stats
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.is_active).length;
  const totalViews = jobs.reduce((sum, j) => sum + (j.views_count || 0), 0);
  const totalApplications = applications.length;
  const conversionRate =
    totalViews > 0 ? ((totalApplications / totalViews) * 100).toFixed(1) : "0";

  // Calculate average time-to-hire
  const hiredApplications = applications.filter((a) => a.status === "hired");
  const avgTimeToHire =
    hiredApplications.length > 0
      ? hiredApplications.reduce((sum, app) => {
          const created = new Date(app.created_at).getTime();
          const viewed = app.viewed_at ? new Date(app.viewed_at).getTime() : created;
          return sum + (viewed - created) / (1000 * 60 * 60 * 24);
        }, 0) / hiredApplications.length
      : 0;

  // Prepare chart data
  const jobsChartData = jobs.slice(0, 10).map((job) => ({
    name: job.title.substring(0, 20),
    applications: job.applications_count || 0,
    views: job.views_count || 0,
  }));

  // Application status distribution
  const statusCounts = applications.reduce(
    (acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const statusChartData = Object.entries(statusCounts).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
  }));

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Track your job postings and candidate engagement</p>
      </div>

      {/* Date Range Filter */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={dateRange === "7d" ? "default" : "outline"}
          onClick={() => setDateRange("7d")}
        >
          Last 7 Days
        </Button>
        <Button
          variant={dateRange === "30d" ? "default" : "outline"}
          onClick={() => setDateRange("30d")}
        >
          Last 30 Days
        </Button>
        <Button
          variant={dateRange === "all" ? "default" : "outline"}
          onClick={() => setDateRange("all")}
        >
          All Time
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJobs}</div>
            <p className="text-xs text-muted-foreground">{activeJobs} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
            <p className="text-xs text-muted-foreground">Across all jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApplications}</div>
            <p className="text-xs text-muted-foreground">Total received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Views to applications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time to Hire</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgTimeToHire.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Days</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Applications per Job</CardTitle>
            <CardDescription>Top 10 most recent jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={jobsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="applications" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
            <CardDescription>Current pipeline distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Views vs Applications Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Views vs Applications</CardTitle>
          <CardDescription>Performance comparison across jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={jobsChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="views"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="applications"
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
