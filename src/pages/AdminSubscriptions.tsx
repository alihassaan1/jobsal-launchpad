import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import ClientPackageOffers from "@/components/ClientPackageOffers";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MONTHLY_PACKAGES, LISTING_OPTIONS, eur, ENTERPRISE_FROM_CENTS } from "@/lib/pricingConfig";

export default function AdminSubscriptions() {
  const { userRole, loading } = useAuth();
  const { language } = useLanguage();
  const sq = language === "sq";
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
  return <main className="p-4 md:p-6 space-y-8">
    <header className="space-y-2"><h1 className="text-3xl font-bold">{sq ? "Paketat" : "Packages"}</h1>
      {config && <Badge variant={config.env === "live" ? "default" : "secondary"}>PayPal · {config.env === "live" ? (sq ? "Pagesa reale" : "Live payments") : (sq ? "Pagesa testimi" : "Test payments")}</Badge>}
      {error && <p role="alert" className="text-destructive">{sq ? "Konfigurimi PayPal nuk u ngarkua" : "PayPal configuration could not be loaded"}</p>}
    </header>
    <ClientPackageOffers admin />
    <section className="space-y-4"><h2 className="text-xl font-semibold">{sq ? "Paketat publike" : "Public packages"}</h2>
      <Table><TableHeader><TableRow><TableHead>{sq ? "Paketa" : "Package"}</TableHead><TableHead>{sq ? "Çmimi" : "Price"}</TableHead><TableHead>{sq ? "Publikime pune" : "Job postings"}</TableHead><TableHead>{sq ? "Faturimi" : "Billing"}</TableHead></TableRow></TableHeader>
        <TableBody>{[...LISTING_OPTIONS, ...MONTHLY_PACKAGES].map(p => <TableRow key={p.key}><TableCell className="font-medium">{p.name}</TableCell><TableCell>{eur(p.amount_cents)}</TableCell><TableCell>{p.listing_credits}</TableCell><TableCell>{p.kind === "subscription" ? (sq ? "Çdo muaj" : "Monthly") : (sq ? "Një herë" : "One-time")}</TableCell></TableRow>)}
          <TableRow><TableCell>Enterprise</TableCell><TableCell>{sq ? "Nga" : "From"} {eur(ENTERPRISE_FROM_CENTS)}</TableCell><TableCell>40+</TableCell><TableCell>{sq ? "Sipas ofertës" : "By quotation"}</TableCell></TableRow>
        </TableBody>
      </Table>
    </section>
  </main>;
}
