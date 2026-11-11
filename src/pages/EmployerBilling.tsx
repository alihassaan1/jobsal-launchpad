import { downloadInvoicePdf } from "@/lib/invoiceDownload";
import { useState } from "react";
import ClientPackageOffers from "@/components/ClientPackageOffers";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  FileText, Download, CreditCard, Building, 
  Receipt, Calendar, DollarSign, Edit, Save, X
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { RefreshCw, ArrowUpRight } from "lucide-react";
import { MONTHLY_PACKAGES, eur, approxLek } from "@/lib/pricingConfig";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navigate } from "react-router-dom";
import { PAYPAL_PRODUCTS, formatEur } from "../../supabase/functions/paypal-checkout/products";

type Invoice = {
  id: string;
  invoice_number: string;
  status: string;
  issue_date: string;
  due_date: string | null;
  total: number;
  amount_due: number;
  currency: string;
  pdf_url: string | null;
};

type BillingProfile = {
  id: string;
  billing_name: string | null;
  billing_email: string | null;
  billing_address: string | null;
  billing_city: string | null;
  billing_country: string | null;
  billing_postal_code: string | null;
  tax_id: string | null;
  vat_number: string | null;
};

type Transaction = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  created_at: string;
  receipt_url: string | null;
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-yellow-500/20 text-yellow-600",
  sent: "bg-blue-500/20 text-blue-600",
  paid: "bg-green-500/20 text-green-600",
  partially_paid: "bg-orange-500/20 text-orange-600",
  overdue: "bg-red-500/20 text-red-600",
  cancelled: "bg-muted text-muted-foreground",
};

export default function EmployerBilling() {
  const { user, userRole, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const sq = language === "sq";
  const queryClient = useQueryClient();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Get employer's company
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

  // Companies on a private (quoted) package don't see the public monthly packages
  const { data: hasPrivatePackage = false } = useQuery({
    queryKey: ["has-private-package", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const [{ data: owned }, { data: memberships }] = await Promise.all([
        supabase.from("companies").select("id").eq("owner_id", user!.id),
        supabase.from("company_members").select("company_id").eq("user_id", user!.id),
      ]);
      const ids = [...(owned ?? []).map((c) => c.id), ...(memberships ?? []).map((m) => m.company_id)];
      if (!ids.length) return false;
      const { count } = await supabase.from("client_package_offers").select("id", { count: "exact", head: true })
        .in("company_id", ids).in("status", ["offered", "paid"]).gt("expires_at", new Date().toISOString());
      return (count ?? 0) > 0;
    },
  });

  // Get billing profile
  const { data: billingProfile } = useQuery({
    queryKey: ["billing-profile", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_billing_profiles")
        .select("*")
        .eq("company_id", company?.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as BillingProfile | null;
    },
    enabled: !!company?.id,
  });

  // Get invoices
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["employer-invoices", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("company_id", company?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!company?.id,
  });

  // Get transactions
  const { data: transactions } = useQuery({
    queryKey: ["employer-transactions", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("company_id", company?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!company?.id,
  });

  // Current PayPal package
  const { data: subscription, refetch: refetchSub } = useQuery({
    queryKey: ["billing-subscription", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await (supabase as any).from("subscriptions").select("*")
        .not("paypal_subscription_id", "is", null)
        .eq("user_id", user?.id)
        .in("status", ["active", "trial"])
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data as any | null;
    },
  });

  // Usage: listings consumed in the current package period
  const { data: packageUsage } = useQuery({
    queryKey: ["billing-usage", user?.id, subscription?.id],
    enabled: !!user?.id && !!subscription,
    queryFn: async () => {
      const periodStart = subscription.current_period_start ?? subscription.created_at;
      const { count } = await (supabase as any).from("job_listings")
        .select("id", { count: "exact", head: true })
        .eq("employer_user_id", user?.id)
        .eq("product_key", `package:${subscription.plan_slug}`)
        .gte("created_at", periodStart);
      return count ?? 0;
    },
  });

  // PayPal receipts
  const { data: receipts } = useQuery({
    queryKey: ["billing-receipts", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await (supabase as any).from("paypal_orders").select("*").eq("user_id", user?.id)
        .order("created_at", { ascending: false }).limit(20);
      return (data ?? []) as any[];
    },
  });

  const cancelSubscription = async () => {
    if (!subscription?.paypal_subscription_id) return;
    const { data, error } = await supabase.functions.invoke("paypal-checkout", {
      body: { action: "cancel", subscription_id: subscription.paypal_subscription_id },
    });
    if (error || data?.error) toast.error("Could not cancel the package");
    else { toast.success("Package cancelled — it stays active until the period ends"); refetchSub(); }
  };

  // Billing profile form state
  const [profileForm, setProfileForm] = useState<Partial<BillingProfile>>({});

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (billingProfile) {
        const { error } = await supabase
          .from("company_billing_profiles")
          .update(profileForm)
          .eq("id", billingProfile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("company_billing_profiles")
          .insert({ ...profileForm, company_id: company?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-profile"] });
      toast.success("Billing profile updated");
      setIsEditingProfile(false);
    },
    onError: (error) => toast.error("Failed to update: " + error.message),
  });

  const startEditing = () => {
    setProfileForm(billingProfile || {});
    setIsEditingProfile(true);
  };

  const stats = {
    totalInvoices: invoices?.length || 0,
    paidInvoices: invoices?.filter(i => i.status === "paid").length || 0,
    totalSpent: invoices?.filter(i => i.status === "paid").reduce((sum, i) => sum + i.total, 0) || 0,
    outstanding: invoices?.filter(i => ["pending", "sent", "overdue"].includes(i.status))
      .reduce((sum, i) => sum + i.amount_due, 0) || 0,
  };

  const exportInvoicesCSV = () => {
    if (!invoices?.length) return;

    const headers = ["Invoice #", "Status", "Issue Date", "Due Date", "Total", "Outstanding"];
    const rows = invoices.map(inv => [
      inv.invoice_number,
      inv.status,
      format(new Date(inv.issue_date), "yyyy-MM-dd"),
      inv.due_date ? format(new Date(inv.due_date), "yyyy-MM-dd") : "",
      (inv.total / 100).toFixed(2),
      (inv.amount_due / 100).toFixed(2),
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-${company?.name || "company"}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  if (authLoading || (user && !userRole)) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/auth?type=employer" replace />;
  if (userRole !== "employer" && userRole !== "admin") return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Billing & Invoices</h1>
              <p className="text-muted-foreground">Manage your billing information and view invoices</p>
            </div>
            <Button variant="outline" onClick={exportInvoicesCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export Invoices
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Invoices</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalInvoices}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Paid</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{stats.paidInvoices}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Total Spent</span>
                </div>
                <p className="text-2xl font-bold">€{(stats.totalSpent / 100).toFixed(0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Outstanding</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">€{(stats.outstanding / 100).toFixed(0)}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="package" className="space-y-4">
            <TabsList>
              <TabsTrigger value="package">
                <RefreshCw className="h-4 w-4 mr-2" />
                Package
              </TabsTrigger>
              <TabsTrigger value="invoices">
                <FileText className="h-4 w-4 mr-2" />
                Invoices
              </TabsTrigger>
              <TabsTrigger value="transactions">
                <CreditCard className="h-4 w-4 mr-2" />
                Payment History
              </TabsTrigger>
              <TabsTrigger value="receipts">
                <Receipt className="h-4 w-4 mr-2" />
                Receipts
              </TabsTrigger>
              <TabsTrigger value="profile">
                <Building className="h-4 w-4 mr-2" />
                Billing Profile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="package">
              <div className="mb-6"><ClientPackageOffers /></div>
              {!hasPrivatePackage && (<>
              <Card>
                <CardHeader>
                  <CardTitle>Your package</CardTitle>
                  <CardDescription>Your monthly package, usage and upgrade options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {subscription ? (
                    <>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-lg font-semibold capitalize">{subscription.plan_slug}</span>
                        <Badge variant={subscription.status === "active" ? "default" : "secondary"}>{subscription.status}</Badge>
                        <span className="text-muted-foreground">€{subscription.amount_eur}/month</span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          Usage this period: <strong>{packageUsage ?? 0}</strong> of <strong>{subscription.job_posts_limit}</strong> job postings
                        </p>
                        {subscription.current_period_end && (
                          <p>Next renewal: {format(new Date(subscription.current_period_end), "MMM d, yyyy")}</p>
                        )}
                        {subscription.last_payment_at && (
                          <p>Last payment: {format(new Date(subscription.last_payment_at), "MMM d, yyyy")} (€{subscription.last_payment_amount})</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                          <Link to="/pricing?view=monthly"><ArrowUpRight className="h-4 w-4 mr-2" />Upgrade package</Link>
                        </Button>
                        <Button variant="ghost" onClick={cancelSubscription}>Cancel auto-renewal</Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 space-y-3">
                      <p className="text-muted-foreground">
                        No monthly package. Your first standard job posting each month is free. Choose a package for more job postings.
                      </p>
                      <Button asChild><Link to="/pricing?view=monthly">View packages</Link></Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              <section className="mt-8 space-y-4">
                <h2 className="text-xl font-semibold">{sq ? "Paketa mujore" : "Monthly packages"}</h2>
                <div className="grid gap-4 md:grid-cols-3">{MONTHLY_PACKAGES.map(p => <Card key={p.key} className={p.recommended ? "border-primary" : ""}>
                  <CardHeader><CardTitle>{p.name}</CardTitle><CardDescription>{eur(p.amount_cents)}{sq ? "/muaj" : "/month"} · {approxLek(p.amount_cents)}</CardDescription></CardHeader>
                  <CardContent className="space-y-4"><p>{p.listing_credits} {sq ? "publikime pune çdo muaj" : "job postings each month"}</p><Button asChild className="w-full"><Link to={`/subscribe/${p.key}`}>{sq ? "Abonohu me PayPal" : "Subscribe with PayPal"}</Link></Button></CardContent>
                </Card>)}</div>
              </section>
              </>)}
            </TabsContent>

            <TabsContent value="receipts">
              <Card>
                <CardHeader>
                  <CardTitle>Receipts</CardTitle>
                  <CardDescription>Your PayPal payments</CardDescription>
                </CardHeader>
                <CardContent>
                  {!receipts || receipts.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No receipts yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {receipts.map((o) => (
                          <TableRow key={o.id}>
                            <TableCell>{format(new Date(o.created_at), "MMM d, yyyy")}</TableCell>
                            <TableCell>{(PAYPAL_PRODUCTS as any)[o.product_key]?.name ?? o.product_key}</TableCell>
                            <TableCell className="text-right font-medium">€{formatEur(o.amount_cents)}</TableCell>
                            <TableCell>
                              <Badge className={o.status === "completed" ? "bg-green-500/20 text-green-600" : "bg-yellow-500/20 text-yellow-600"}>
                                {o.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invoices">
              <Card>
                <CardHeader>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>View and download your invoices</CardDescription>
                </CardHeader>
                <CardContent>
                  {invoicesLoading ? (
                    <p className="text-center py-8 text-muted-foreground">Loading invoices...</p>
                  ) : invoices?.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No invoices yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Issue Date</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Outstanding</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices?.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                            <TableCell>
                              <Badge className={statusColors[invoice.status]}>
                                {invoice.status.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>{format(new Date(invoice.issue_date), "MMM d, yyyy")}</TableCell>
                            <TableCell>
                              {invoice.due_date ? format(new Date(invoice.due_date), "MMM d, yyyy") : "-"}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              €{(invoice.total / 100).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              {invoice.amount_due > 0 ? (
                                <span className="text-orange-600">€{(invoice.amount_due / 100).toFixed(2)}</span>
                              ) : (
                                <span className="text-green-600">€0.00</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedInvoice(invoice)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>All your payment transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  {transactions?.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No transactions yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions?.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>{format(new Date(tx.created_at), "MMM d, yyyy")}</TableCell>
                            <TableCell className="font-medium">
                              €{(tx.amount / 100).toFixed(2)}
                            </TableCell>
                            <TableCell className="capitalize">{tx.payment_method.replace("_", " ")}</TableCell>
                            <TableCell>
                              <Badge className={tx.status === "completed" ? "bg-green-500/20 text-green-600" : "bg-yellow-500/20 text-yellow-600"}>
                                {tx.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {tx.receipt_url && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={tx.receipt_url} target="_blank" rel="noopener noreferrer">
                                    <Receipt className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Billing Profile</CardTitle>
                    <CardDescription>Your billing information for invoices</CardDescription>
                  </div>
                  {!isEditingProfile && (
                    <Button variant="outline" onClick={startEditing}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {isEditingProfile ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Billing Name</Label>
                          <Input
                            value={profileForm.billing_name || ""}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, billing_name: e.target.value }))}
                            placeholder="Company name for invoices"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Billing Email</Label>
                          <Input
                            type="email"
                            value={profileForm.billing_email || ""}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, billing_email: e.target.value }))}
                            placeholder="billing@company.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tax ID (NIPT)</Label>
                          <Input
                            value={profileForm.tax_id || ""}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, tax_id: e.target.value }))}
                            placeholder="L12345678A"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>VAT Number</Label>
                          <Input
                            value={profileForm.vat_number || ""}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, vat_number: e.target.value }))}
                            placeholder="AL123456789"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>City</Label>
                          <Input
                            value={profileForm.billing_city || ""}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, billing_city: e.target.value }))}
                            placeholder="Tirana"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Postal Code</Label>
                          <Input
                            value={profileForm.billing_postal_code || ""}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, billing_postal_code: e.target.value }))}
                            placeholder="1001"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Textarea
                          value={profileForm.billing_address || ""}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, billing_address: e.target.value }))}
                          placeholder="Full billing address"
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => updateProfileMutation.mutate()} disabled={updateProfileMutation.isPending}>
                          <Save className="h-4 w-4 mr-2" />
                          {updateProfileMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : billingProfile ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Billing Name</p>
                        <p className="font-medium">{billingProfile.billing_name || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{billingProfile.billing_email || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tax ID</p>
                        <p className="font-medium">{billingProfile.tax_id || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">VAT Number</p>
                        <p className="font-medium">{billingProfile.vat_number || "-"}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium">
                          {billingProfile.billing_address || "-"}
                          {billingProfile.billing_city && `, ${billingProfile.billing_city}`}
                          {billingProfile.billing_postal_code && ` ${billingProfile.billing_postal_code}`}
                          {billingProfile.billing_country && `, ${billingProfile.billing_country}`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No billing profile set up yet</p>
                      <Button onClick={startEditing}>
                        <Edit className="h-4 w-4 mr-2" />
                        Set Up Billing Profile
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invoice {selectedInvoice?.invoice_number}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <Badge className={statusColors[selectedInvoice.status]}>
                    {selectedInvoice.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    Issued: {format(new Date(selectedInvoice.issue_date), "PPP")}
                  </p>
                  {selectedInvoice.due_date && (
                    <p className="text-sm text-muted-foreground">
                      Due: {format(new Date(selectedInvoice.due_date), "PPP")}
                    </p>
                  )}
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-2xl font-bold">€{(selectedInvoice.total / 100).toFixed(2)}</p>
                {selectedInvoice.amount_due > 0 && (
                  <p className="text-orange-600">
                    Outstanding: €{(selectedInvoice.amount_due / 100).toFixed(2)}
                  </p>
                )}
              </div>
              <Button className="w-full" variant="outline" onClick={() => downloadInvoicePdf(selectedInvoice.id, selectedInvoice.invoice_number)}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}