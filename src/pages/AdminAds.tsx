import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, ShoppingCart, TrendingUp, DollarSign } from "lucide-react";
import { format } from "date-fns";

type AdProductType = "featured_job" | "priority_placement" | "daily_spotlight" | "newsletter_spot" | "social_promotion";
type AdPurchaseStatus = "pending" | "active" | "expired" | "cancelled";

type AdProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  product_type: AdProductType;
  duration_days: number;
  price: number;
  currency: string;
  features: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
};

type AdPurchase = {
  id: string;
  company_id: string;
  job_id: string | null;
  ad_product_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: string;
  amount_paid: number;
  currency: string;
  created_at: string;
  ad_products: { name: string } | null;
  companies: { name: string } | null;
  jobs: { title: string } | null;
};

const PRODUCT_TYPES = [
  { value: "featured_job", label: "Featured Job" },
  { value: "priority_placement", label: "Priority Placement" },
  { value: "daily_spotlight", label: "Daily Spotlight" },
  { value: "newsletter_spot", label: "Newsletter Spot" },
  { value: "social_promotion", label: "Social Media Promotion" },
];

export default function AdminAds() {
  const queryClient = useQueryClient();
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdProduct | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    slug: "",
    description: "",
    product_type: "featured_job" as AdProductType,
    duration_days: 7,
    price: 0,
    currency: "EUR",
    features: "",
    is_active: true,
    display_order: 0,
  });

  // Fetch ad products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["admin-ad-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_products")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as AdProduct[];
    },
  });

  // Fetch ad purchases
  const { data: purchases, isLoading: purchasesLoading } = useQuery({
    queryKey: ["admin-ad-purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_purchases")
        .select(`
          *,
          ad_products(name),
          companies(name),
          jobs(title)
        `)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as AdPurchase[];
    },
  });

  // Stats
  const { data: stats } = useQuery({
    queryKey: ["admin-ad-stats"],
    queryFn: async () => {
      const [productsRes, purchasesRes, activeRes, revenueRes] = await Promise.all([
        supabase.from("ad_products").select("id", { count: "exact" }),
        supabase.from("ad_purchases").select("id", { count: "exact" }),
        supabase.from("ad_purchases").select("id", { count: "exact" }).eq("status", "active"),
        supabase.from("ad_purchases").select("amount_paid").eq("status", "active"),
      ]);
      
      const totalRevenue = revenueRes.data?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0;
      
      return {
        totalProducts: productsRes.count || 0,
        totalPurchases: purchasesRes.count || 0,
        activeCampaigns: activeRes.count || 0,
        totalRevenue: totalRevenue / 100,
      };
    },
  });

  // Create/Update product mutation
  const productMutation = useMutation({
    mutationFn: async (data: typeof productForm & { id?: string }) => {
      const features = data.features.split("\n").filter(f => f.trim());
      const payload = {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        product_type: data.product_type as AdProductType,
        duration_days: data.duration_days,
        price: data.price,
        currency: data.currency,
        features,
        is_active: data.is_active,
        display_order: data.display_order,
      };

      if (data.id) {
        const { error } = await supabase
          .from("ad_products")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ad_products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ad-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-ad-stats"] });
      setIsProductDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      toast.success(editingProduct ? "Product updated" : "Product created");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ad_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ad-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-ad-stats"] });
      toast.success("Product deleted");
    },
  });

  // Update purchase status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AdPurchaseStatus }) => {
      const { error } = await supabase
        .from("ad_purchases")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ad-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["admin-ad-stats"] });
      toast.success("Status updated");
    },
  });

  const resetForm = () => {
    setProductForm({
      name: "",
      slug: "",
      description: "",
      product_type: "featured_job" as AdProductType,
      duration_days: 7,
      price: 0,
      currency: "EUR",
      features: "",
      is_active: true,
      display_order: 0,
    });
  };

  const handleEditProduct = (product: AdProduct) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      product_type: product.product_type,
      duration_days: product.duration_days,
      price: product.price,
      currency: product.currency,
      features: (product.features || []).join("\n"),
      is_active: product.is_active,
      display_order: product.display_order,
    });
    setIsProductDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      pending: "secondary",
      expired: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Ads Management</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPurchases || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeCampaigns || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats?.totalRevenue?.toFixed(2) || "0.00"}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Ad Products</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetForm(); setEditingProduct(null); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingProduct ? "Edit Product" : "New Ad Product"}</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      productMutation.mutate({ ...productForm, id: editingProduct?.id });
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={productForm.name}
                          onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Slug</Label>
                        <Input
                          value={productForm.slug}
                          onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Product Type</Label>
                        <Select
                          value={productForm.product_type}
                          onValueChange={(v) => setProductForm({ ...productForm, product_type: v as AdProductType })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRODUCT_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Duration (days)</Label>
                        <Input
                          type="number"
                          value={productForm.duration_days}
                          onChange={(e) => setProductForm({ ...productForm, duration_days: parseInt(e.target.value) })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Price (cents)</Label>
                        <Input
                          type="number"
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: parseInt(e.target.value) })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select
                          value={productForm.currency}
                          onValueChange={(v) => setProductForm({ ...productForm, currency: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="ALL">ALL</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Display Order</Label>
                        <Input
                          type="number"
                          value={productForm.display_order}
                          onChange={(e) => setProductForm({ ...productForm, display_order: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Features (one per line)</Label>
                      <Textarea
                        value={productForm.features}
                        onChange={(e) => setProductForm({ ...productForm, features: e.target.value })}
                        rows={3}
                        placeholder="Top placement in search&#10;Featured badge&#10;Priority visibility"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={productForm.is_active}
                        onCheckedChange={(v) => setProductForm({ ...productForm, is_active: v })}
                      />
                      <Label>Active</Label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsProductDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={productMutation.isPending}>
                        {editingProduct ? "Update" : "Create"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : products?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">No products found</TableCell>
                    </TableRow>
                  ) : (
                    products?.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {PRODUCT_TYPES.find(t => t.value === product.product_type)?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{product.duration_days} days</TableCell>
                        <TableCell>€{(product.price / 100).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={product.is_active ? "default" : "secondary"}>
                            {product.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchasesLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : purchases?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">No campaigns found</TableCell>
                    </TableRow>
                  ) : (
                    purchases?.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium">{purchase.companies?.name || "N/A"}</TableCell>
                        <TableCell>{purchase.ad_products?.name || "N/A"}</TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {purchase.jobs?.title || "Company-wide"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(purchase.start_date), "MMM d")} - {format(new Date(purchase.end_date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>€{(purchase.amount_paid / 100).toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                        <TableCell className="text-right">
                          <Select
                            value={purchase.status}
                            onValueChange={(v) => updateStatusMutation.mutate({ id: purchase.id, status: v as AdPurchaseStatus })}
                          >
                            <SelectTrigger className="w-[110px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="expired">Expired</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
