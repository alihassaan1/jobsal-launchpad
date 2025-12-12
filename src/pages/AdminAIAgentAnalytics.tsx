import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  LineChart,
  Line,
  Legend
} from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { 
  DollarSign, 
  Zap, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Activity,
  Coins
} from "lucide-react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const AdminAIAgentAnalytics = () => {
  // Fetch overall analytics
  const { data: analytics } = useQuery({
    queryKey: ["ai-agent-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_ai_agent_analytics");
      if (error) throw error;
      return data?.[0] || {
        total_calls: 0,
        successful_calls: 0,
        failed_calls: 0,
        total_tokens: 0,
        total_cost: 0,
        avg_duration_ms: 0,
        avg_cost_per_call: 0,
        cost_per_1k_tokens: 0
      };
    }
  });

  // Fetch logs for charts
  const { data: logs } = useQuery({
    queryKey: ["ai-agent-logs-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agent_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    }
  });

  // Calculate daily costs for the last 14 days
  const dailyCostData = (() => {
    if (!logs) return [];
    
    const days = eachDayOfInterval({
      start: subDays(new Date(), 13),
      end: new Date()
    });

    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayLogs = logs.filter(log => {
        const logDate = new Date(log.created_at);
        return logDate >= dayStart && logDate < dayEnd;
      });

      return {
        date: format(day, "MMM dd"),
        cost: dayLogs.reduce((sum, log) => sum + (log.cost || 0), 0),
        calls: dayLogs.length,
        tokens: dayLogs.reduce((sum, log) => sum + (log.total_tokens || 0), 0)
      };
    });
  })();

  // Calculate content type distribution
  const contentTypeData = (() => {
    if (!logs) return [];
    
    const typeCounts: Record<string, number> = {};
    logs.forEach(log => {
      typeCounts[log.content_type] = (typeCounts[log.content_type] || 0) + 1;
    });

    return Object.entries(typeCounts).map(([name, value]) => ({
      name,
      value
    }));
  })();

  // Calculate agent type distribution
  const agentTypeData = (() => {
    if (!logs) return [];
    
    const typeCounts: Record<string, { calls: number; cost: number; tokens: number }> = {};
    logs.forEach(log => {
      if (!typeCounts[log.agent_type]) {
        typeCounts[log.agent_type] = { calls: 0, cost: 0, tokens: 0 };
      }
      typeCounts[log.agent_type].calls += 1;
      typeCounts[log.agent_type].cost += log.cost || 0;
      typeCounts[log.agent_type].tokens += log.total_tokens || 0;
    });

    return Object.entries(typeCounts).map(([name, data]) => ({
      name,
      ...data
    }));
  })();

  const formatCost = (cost: number) => `$${Number(cost).toFixed(4)}`;
  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(2)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  const successRate = analytics?.total_calls 
    ? ((analytics.successful_calls / analytics.total_calls) * 100).toFixed(1)
    : "0";

  return (
    <AdminGuard>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track AI agent performance, costs, and usage metrics
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCost(analytics?.total_cost || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Avg {formatCost(analytics?.avg_cost_per_call || 0)} per call
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTokens(analytics?.total_tokens || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {formatCost(analytics?.cost_per_1k_tokens || 0)} per 1K tokens
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Calls</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.total_calls || 0}</div>
              <div className="flex gap-2 mt-1">
                <Badge className="bg-green-500/20 text-green-700 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {analytics?.successful_calls || 0}
                </Badge>
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {analytics?.failed_calls || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{successRate}%</div>
              <p className="text-xs text-muted-foreground">
                Avg response time: {((analytics?.avg_duration_ms || 0) / 1000).toFixed(2)}s
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Cost Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Daily Cost Trend
              </CardTitle>
              <CardDescription>Cost and API calls over the last 14 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyCostData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis yAxisId="left" className="text-xs" tickFormatter={(v) => `$${v.toFixed(2)}`} />
                    <YAxis yAxisId="right" orientation="right" className="text-xs" />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === "cost") return [`$${value.toFixed(4)}`, "Cost"];
                        if (name === "calls") return [value, "Calls"];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="cost" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="calls" 
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--chart-2))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Content Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Content Type Distribution</CardTitle>
              <CardDescription>Breakdown by content type generated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={contentTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {contentTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Performance Comparison</CardTitle>
            <CardDescription>Compare costs and usage across different AI agents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentTypeData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis yAxisId="left" className="text-xs" />
                  <YAxis yAxisId="right" orientation="right" className="text-xs" />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === "cost") return [`$${value.toFixed(4)}`, "Total Cost"];
                      if (name === "tokens") return [formatTokens(value), "Tokens"];
                      return [value, "Calls"];
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="calls" fill="hsl(var(--primary))" name="API Calls" />
                  <Bar yAxisId="right" dataKey="tokens" fill="hsl(var(--chart-2))" name="Tokens" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cost Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Cost Breakdown</CardTitle>
            <CardDescription>Detailed cost analysis by agent type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Agent</th>
                    <th className="text-right py-3 px-4">Calls</th>
                    <th className="text-right py-3 px-4">Tokens</th>
                    <th className="text-right py-3 px-4">Total Cost</th>
                    <th className="text-right py-3 px-4">Avg Cost/Call</th>
                    <th className="text-right py-3 px-4">Cost/1K Tokens</th>
                  </tr>
                </thead>
                <tbody>
                  {agentTypeData.map((agent) => (
                    <tr key={agent.name} className="border-b">
                      <td className="py-3 px-4">
                        <Badge variant="outline">{agent.name}</Badge>
                      </td>
                      <td className="text-right py-3 px-4 font-mono">{agent.calls}</td>
                      <td className="text-right py-3 px-4 font-mono">{formatTokens(agent.tokens)}</td>
                      <td className="text-right py-3 px-4 font-mono">{formatCost(agent.cost)}</td>
                      <td className="text-right py-3 px-4 font-mono">
                        {formatCost(agent.calls > 0 ? agent.cost / agent.calls : 0)}
                      </td>
                      <td className="text-right py-3 px-4 font-mono">
                        {formatCost(agent.tokens > 0 ? (agent.cost / agent.tokens) * 1000 : 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
};

export default AdminAIAgentAnalytics;
