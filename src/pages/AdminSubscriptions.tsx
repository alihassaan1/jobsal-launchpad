import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ClientPackageOffers from "@/components/ClientPackageOffers";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MONTHLY_PACKAGES, LISTING_OPTIONS, URGENT_ADDON, eur, ENTERPRISE_FROM_CENTS } from "@/lib/pricingConfig";

function describe(p: { kind: string; featured_days: number; listing_credits: number }): string {
  if (p.kind === "subscription") {
    return `${p.listing_credits} job posts per month, each live 30 days. Auto-renews monthly via PayPal; unused posts reset on renewal. Employer can cancel anytime from Billing.`;
  }
  if (p.featured_days === 0) {
    return "Live 30 days on Jobs search, category and city pages. Standard ranking, no Featured badge, not shown in homepage Featured Jobs.";
  }
  if (p.featured_days >= 30) {
    return "Live 30 days and Featured for the full 30 days: Featured badge on Jobs search plus placement in homepage Featured Jobs.";
  }
  return `Live 30 days and Featured for the first ${p.featured_days} days: Featured badge on Jobs search plus placement in homepage Featured Jobs.`;
}

export default function AdminSubscriptions() {
  const { userRole, loading } = useAuth();
  const { data: config, error } = useQuery({
    queryKey: ["admin-paypal-config"], enabled: userRole === "admin",
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("paypal-checkout", { body: { action: "config" } });
      if (error || data?.error) throw new Error("PayPal configuration unavailable");
      return data;
    },
  });
  if (loading) return <div className="p-6" />;
  if (userRole !== "admin") return <Navigate to="/" replace />;
  const rows = [...LISTING_OPTIONS, ...MONTHLY_PACKAGES];
  return <main className="p-4 md:p-6 space-y-8">
    <header className="space-y-2"><h1 className="text-3xl font-bold">Packages</h1>
      <p className="text-muted-foreground max-w-3xl">Everything employers can buy on Jobs.al. Prices below are what PayPal charges; the public Pricing page and employer checkout use the same values.</p>
      {config && <Badge variant={config.env === "live" ? "default" : "secondary"}>PayPal · {config.env === "live" ? "Live payments" : "Test payments"}</Badge>}
      {error && <p role="alert" className="text-destructive">PayPal configuration could not be loaded</p>}
    </header>

    <ClientPackageOffers admin />

    <section className="space-y-4">
      <div><h2 className="text-xl font-semibold">Public packages</h2>
        <p className="text-sm text-muted-foreground">Available to every employer on the Pricing page and at job checkout.</p></div>
      <div className="overflow-x-auto"><Table><TableHeader><TableRow>
        <TableHead>Package</TableHead><TableHead>Type</TableHead><TableHead>Price</TableHead><TableHead>Job posts</TableHead><TableHead>Billing</TableHead><TableHead className="min-w-[280px]">What's included</TableHead>
      </TableRow></TableHeader>
        <TableBody>{rows.map(p => <TableRow key={p.key}>
          <TableCell className="font-medium">{p.name}{p.recommended && <Badge variant="secondary" className="ml-2">Recommended</Badge>}</TableCell>
          <TableCell><Badge variant="outline">{p.kind === "subscription" ? "Subscription" : "Single job"}</Badge></TableCell>
          <TableCell>{eur(p.amount_cents)}</TableCell>
          <TableCell>{p.listing_credits}</TableCell>
          <TableCell>{p.kind === "subscription" ? "Monthly" : "One-time"}</TableCell>
          <TableCell className="text-sm text-muted-foreground">{describe(p)}</TableCell>
        </TableRow>)}
          <TableRow>
            <TableCell className="font-medium">Enterprise</TableCell>
            <TableCell><Badge variant="outline">Custom</Badge></TableCell>
            <TableCell>From {eur(ENTERPRISE_FROM_CENTS)}</TableCell>
            <TableCell>40+</TableCell>
            <TableCell>By quotation</TableCell>
            <TableCell className="text-sm text-muted-foreground">Custom volume and terms. Employer clicks "Request a quote" (email to info@jobs.al); once agreed, create it above as a private package.</TableCell>
          </TableRow>
        </TableBody>
      </Table></div>
    </section>

    <section className="grid gap-4 md:grid-cols-2">
      <Card><CardHeader><CardTitle className="text-lg">Urgent hiring add-on · {eur(URGENT_ADDON.amount_cents)}</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Optional checkbox at job checkout, added to any single-job package and paid in the same PayPal order. Keeps the job Featured for the full 30 days.</CardContent></Card>
      <Card><CardHeader><CardTitle className="text-lg">Free monthly job · €0</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Every employer gets 1 free Standard job per calendar month. It is pre-selected at checkout and publishes without payment.</CardContent></Card>
    </section>
  </main>;
}
