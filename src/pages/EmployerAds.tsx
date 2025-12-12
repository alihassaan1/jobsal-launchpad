import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Check, Zap, TrendingUp, Eye, MousePointer, FileText, Clock, ShoppingCart } from "lucide-react";
import { format, differenceInDays } from "date-fns";

type AdProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  product_type: string;
  duration_days: number;
  price: number;
  currency: string;
  features: string[];
  is_active: boolean;
};

type AdPurchase = {
  id: string;
  job_id: string | null;
  ad_product_id: string;
  start_date: string;
  end_date: string;
  status: string;
  amount_paid: number;
  currency: string;
  created_at: string;
  ad_products: { name: string; product_type: string } | null;
  jobs: { title: string; slug: string } | null;
};

type Job = {
  id: string;
  title: string;
  slug: string;
  is_active: boolean;
};

export default function EmployerAds() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<string>("all");
  const [cart, setCart] = useState<{ productId: string; jobId: string | null }[]>([]);

  // Fetch company
  const { data: company } = useQuery({
    queryKey: ["employer-company", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .eq("owner_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch ad products
  const { data: products } = useQuery({
    queryKey: ["ad-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_products")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as AdProduct[];
    },
  });

  // Fetch company jobs
  const { data: jobs } = useQuery({
    queryKey: ["employer-jobs-for-ads", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, slug, is_active")
        .eq("company_id", company?.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Job[];
    },
    enabled: !!company?.id,
  });

  // Fetch active ad purchases
  const { data: purchases, isLoading: purchasesLoading } = useQuery({
    queryKey: ["employer-ad-purchases", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_purchases")
        .select(`
          *,
          ad_products(name, product_type),
          jobs(title, slug)
        `)
        .eq("company_id", company?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AdPurchase[];
    },
    enabled: !!company?.id,
  });

  // Calculate ad analytics (simplified)
  const { data: analytics } = useQuery({
    queryKey: ["employer-ad-analytics", company?.id],
    queryFn: async () => {
      if (!purchases?.length) return { impressions: 0, clicks: 0, applications: 0 };
      
      const purchaseIds = purchases.filter(p => p.status === "active").map(p => p.id);
      if (!purchaseIds.length) return { impressions: 0, clicks: 0, applications: 0 };

      const { data, error } = await supabase
        .from("ad_analytics")
        .select("event_type")
        .in("ad_purchase_id", purchaseIds);
      
      if (error) throw error;

      const impressions = data?.filter(e => e.event_type === "impression").length || 0;
      const clicks = data?.filter(e => e.event_type === "click").length || 0;
      const applications = data?.filter(e => e.event_type === "application").length || 0;

      return { impressions, clicks, applications };
    },
    enabled: !!purchases?.length,
  });

  const addToCart = (productId: string, jobId: string | null) => {
    const exists = cart.find(c => c.productId === productId && c.jobId === jobId);
    if (exists) {
      toast.info("Already in cart");
      return;
    }
    setCart([...cart, { productId, jobId }]);
    toast.success("Added to cart");
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => {
      const product = products?.find(p => p.id === item.productId);
      return sum + (product?.price || 0);
    }, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    // Store cart in session storage and navigate to checkout
    sessionStorage.setItem("ad_cart", JSON.stringify(cart));
    navigate("/employer/ads/checkout");
  };

  const getStatusBadge = (purchase: AdPurchase) => {
    const now = new Date();
    const end = new Date(purchase.end_date);
    const daysLeft = differenceInDays(end, now);

    if (purchase.status === "cancelled") {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    if (purchase.status === "expired" || daysLeft < 0) {
      return <Badge variant="outline">Expired</Badge>;
    }
    if (purchase.status === "pending") {
      return <Badge variant="secondary">Pending</Badge>;
    }
    if (daysLeft <= 3) {
      return <Badge variant="destructive">{daysLeft}d left</Badge>;
    }
    return <Badge variant="default">{daysLeft}d left</Badge>;
  };

  const getProductIcon = (type: string) => {
    switch (type) {
      case "featured_job": return <Zap className="h-5 w-5 text-yellow-500" />;
      case "priority_placement": return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case "daily_spotlight": return <Eye className="h-5 w-5 text-purple-500" />;
      case "newsletter_spot": return <FileText className="h-5 w-5 text-green-500" />;
      case "social_promotion": return <MousePointer className="h-5 w-5 text-pink-500" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  if (!company) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">You need to set up a company profile first.</p>
              <Button onClick={() => navigate("/employer/setup-company")}>Create Company Profile</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Promote Your Jobs</h1>
            <p className="text-muted-foreground">Boost visibility and get more qualified applicants</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/employer/dashboard")}>
            Back to Dashboard
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Ads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {purchases?.filter(p => p.status === "active").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.impressions || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.clicks || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.applications || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="products" className="space-y-4">
              <TabsList>
                <TabsTrigger value="products">Ad Products</TabsTrigger>
                <TabsTrigger value="active">My Ads</TabsTrigger>
              </TabsList>

              <TabsContent value="products" className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <Label className="text-sm font-medium">Promote job:</Label>
                  <Select value={selectedJob} onValueChange={setSelectedJob}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select a job" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Company-wide promotion</SelectItem>
                      {jobs?.map((job) => (
                        <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {products?.map((product) => (
                    <Card key={product.id} className="relative overflow-hidden">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          {getProductIcon(product.product_type)}
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                        </div>
                        <CardDescription>{product.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-baseline gap-1 mb-4">
                          <span className="text-3xl font-bold">€{(product.price / 100).toFixed(0)}</span>
                          <span className="text-muted-foreground">/ {product.duration_days} days</span>
                        </div>
                        <ul className="space-y-2">
                          {product.features?.map((feature, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              <Check className="h-4 w-4 text-primary" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full" 
                          onClick={() => addToCart(product.id, selectedJob === "all" ? null : selectedJob)}
                        >
                          Add to Cart
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="active" className="space-y-4">
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ad Type</TableHead>
                        <TableHead>Job</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchasesLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                        </TableRow>
                      ) : purchases?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No ads purchased yet. Start promoting your jobs above!
                          </TableCell>
                        </TableRow>
                      ) : (
                        purchases?.map((purchase) => (
                          <TableRow key={purchase.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {getProductIcon(purchase.ad_products?.product_type || "")}
                                {purchase.ad_products?.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              {purchase.jobs?.title || "Company-wide"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(purchase.start_date), "MMM d")} - {format(new Date(purchase.end_date), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>{getStatusBadge(purchase)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Cart Sidebar */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Cart ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cart.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Your cart is empty
                  </p>
                ) : (
                  cart.map((item, index) => {
                    const product = products?.find(p => p.id === item.productId);
                    const job = jobs?.find(j => j.id === item.jobId);
                    return (
                      <div key={index} className="flex items-start justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{product?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {job?.title || "Company-wide"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">€{((product?.price || 0) / 100).toFixed(0)}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={() => removeFromCart(index)}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
              <CardFooter className="flex-col gap-3">
                <div className="flex items-center justify-between w-full text-lg font-bold">
                  <span>Total</span>
                  <span>€{(getCartTotal() / 100).toFixed(2)}</span>
                </div>
                <Button 
                  className="w-full" 
                  size="lg"
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={className}>{children}</span>;
}
