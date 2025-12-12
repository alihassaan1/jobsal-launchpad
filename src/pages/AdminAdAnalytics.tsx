import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { Eye, MousePointer, Target, TrendingUp, DollarSign, Percent, Download, Calendar } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

type DateRange = "7d" | "30d" | "90d" | "all";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(142, 76%, 36%)", "hsl(38, 92%, 50%)"];

const AdminAdAnalytics = () => {
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case "7d": return subDays(now, 7);
      case "30d": return subDays(now, 30);
      case "90d": return subDays(now, 90);
      default: return null;
    }
  };

  // Fetch ad analytics data
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["ad-analytics", dateRange],
    queryFn: async () => {
      let query = supabase
        .from("ad_analytics")
        .select("*");
      
      const dateFilter = getDateFilter();
      if (dateFilter) {
        query = query.gte("created_at", dateFilter.toISOString());
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch ad purchases for revenue data
  const { data: purchasesData, isLoading: purchasesLoading } = useQuery({
    queryKey: ["ad-purchases-analytics", dateRange],
    queryFn: async () => {
      let query = supabase
        .from("ad_purchases")
        .select(`
          *,
          ad_products(name, product_type),
          companies(name)
        `)
        .eq("status", "active");
      
      const dateFilter = getDateFilter();
      if (dateFilter) {
        query = query.gte("created_at", dateFilter.toISOString());
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate metrics
  const impressions = analyticsData?.filter(a => a.event_type === "impression").length || 0;
  const clicks = analyticsData?.filter(a => a.event_type === "click").length || 0;
  const conversions = analyticsData?.filter(a => a.event_type === "application").length || 0;
  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : "0.00";
  const conversionRate = clicks > 0 ? ((conversions / clicks) * 100).toFixed(2) : "0.00";
  const totalRevenue = purchasesData?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0;

  // Prepare chart data - Events by type
  const eventTypeData = [
    { name: "Impressions", value: impressions, fill: COLORS[0] },
    { name: "Clicks", value: clicks, fill: COLORS[1] },
    { name: "Applications", value: conversions, fill: COLORS[3] },
  ];

  // Prepare daily trend data
  const getDailyTrends = () => {
    if (!analyticsData || analyticsData.length === 0) return [];
    
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    const trends: Record<string, { date: string; impressions: number; clicks: number; conversions: number }> = {};
    
    for (let i = 0; i < days; i++) {
      const date = format(subDays(new Date(), i), "MMM dd");
      trends[date] = { date, impressions: 0, clicks: 0, conversions: 0 };
    }
    
    analyticsData.forEach(event => {
      const date = format(new Date(event.created_at!), "MMM dd");
      if (trends[date]) {
        if (event.event_type === "impression") trends[date].impressions++;
        if (event.event_type === "click") trends[date].clicks++;
        if (event.event_type === "application") trends[date].conversions++;
      }
    });
    
    return Object.values(trends).reverse();
  };

  // Revenue by product type
  const getRevenueByProduct = () => {
    if (!purchasesData || purchasesData.length === 0) return [];
    
    const byProduct: Record<string, number> = {};
    purchasesData.forEach(p => {
      const productName = p.ad_products?.name || "Unknown";
      byProduct[productName] = (byProduct[productName] || 0) + (p.amount_paid || 0);
    });
    
    return Object.entries(byProduct).map(([name, value], i) => ({
      name,
      value: value / 100,
      fill: COLORS[i % COLORS.length],
    }));
  };

  // Top performing ads
  const getTopAds = () => {
    if (!analyticsData || analyticsData.length === 0) return [];
    
    const adStats: Record<string, { id: string; impressions: number; clicks: number; conversions: number }> = {};
    
    analyticsData.forEach(event => {
      const adId = event.ad_purchase_id;
      if (!adStats[adId]) {
        adStats[adId] = { id: adId, impressions: 0, clicks: 0, conversions: 0 };
      }
      if (event.event_type === "impression") adStats[adId].impressions++;
      if (event.event_type === "click") adStats[adId].clicks++;
      if (event.event_type === "application") adStats[adId].conversions++;
    });
    
    return Object.values(adStats)
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);
  };

  const dailyTrends = getDailyTrends();
  const revenueByProduct = getRevenueByProduct();
  const topAds = getTopAds();

  const isLoading = analyticsLoading || purchasesLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Ad Analytics</h1>
          <p className="text-muted-foreground">Track ad performance, engagement, and ROI</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Impressions</span>
            </div>
            <p className="text-2xl font-bold mt-2">{impressions.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Clicks</span>
            </div>
            <p className="text-2xl font-bold mt-2">{clicks.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Conversions</span>
            </div>
            <p className="text-2xl font-bold mt-2">{conversions.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">CTR</span>
            </div>
            <p className="text-2xl font-bold mt-2">{ctr}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Conv. Rate</span>
            </div>
            <p className="text-2xl font-bold mt-2">{conversionRate}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Revenue</span>
            </div>
            <p className="text-2xl font-bold mt-2">€{(totalRevenue / 100).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Performance Trends</CardTitle>
            <CardDescription>Impressions, clicks, and conversions over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">Loading...</div>
            ) : dailyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="impressions" stroke={COLORS[0]} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="clicks" stroke={COLORS[1]} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="conversions" stroke={COLORS[3]} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No analytics data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Event Distribution</CardTitle>
            <CardDescription>Breakdown of ad interactions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">Loading...</div>
            ) : eventTypeData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={eventTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {eventTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No analytics data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue by Product */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Ad Product</CardTitle>
            <CardDescription>Revenue distribution across ad types</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">Loading...</div>
            ) : revenueByProduct.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueByProduct} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                  <Tooltip 
                    formatter={(value) => [`€${value}`, "Revenue"]}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {revenueByProduct.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No purchase data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Ads */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Ads</CardTitle>
            <CardDescription>Ads with highest engagement</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">Loading...</div>
            ) : topAds.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {topAds.map((ad, i) => (
                  <div key={ad.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">#{i + 1}</span>
                      <div>
                        <p className="font-medium text-sm truncate max-w-[150px]">{ad.id.slice(0, 8)}...</p>
                        <p className="text-xs text-muted-foreground">
                          CTR: {ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{ad.impressions} imp</Badge>
                      <Badge variant="outline">{ad.clicks} clicks</Badge>
                      <Badge className="bg-green-500/10 text-green-600">{ad.conversions} conv</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No analytics data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAdAnalytics;
