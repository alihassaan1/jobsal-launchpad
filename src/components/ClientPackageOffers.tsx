import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import CreatePackageDialog from "@/components/admin/CreatePackageDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { canPurchaseOffer, canUseOffer } from "../../supabase/functions/paypal-checkout/clientOffers";
import { PAYPAL_PRODUCTS } from "../../supabase/functions/paypal-checkout/products";
import { eur, approxLek, PAYPAL_NOTE } from "@/lib/pricingConfig";

export default function ClientPackageOffers({ admin = false }: { admin?: boolean }) {
  const { user, userRole } = useAuth();
  const { language } = useLanguage();
  const sq = !admin && language === "sq";
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data: offers = [], isLoading, error } = useQuery({
    queryKey: ["client-package-offers", user?.id, admin],
    enabled: !!user && (!admin || userRole === "admin"),
    queryFn: async () => {
      let query = supabase.from("client_package_offers").select("*").order("created_at", { ascending: false });
      // Non-admins only receive their own or their company team's offers (enforced by access rules)
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: companies = [] } = useQuery({
    queryKey: ["client-offer-companies"],
    enabled: admin && userRole === "admin",
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("id, name, owner_id").not("owner_id", "is", null).order("name").limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    const orderId = params.get("token");
    if (admin || !user || params.get("paypal") !== "return" || !orderId) return;
    let cancelled = false;
    setBusy(true);
    (async () => {
      const { data, error } = await supabase.functions.invoke("paypal-checkout", { body: { action: "capture", order_id: orderId } });
      if (cancelled) return;
      setBusy(false);
      if (error || data?.error) {
        toast.error(data?.error ?? (sq ? "Pagesa nuk u konfirmua. Kontaktoni info@jobs.al." : "Payment could not be confirmed. Contact info@jobs.al."));
      } else {
        toast.success(sq ? "Pagesa u konfirmua" : "Payment confirmed");
        queryClient.invalidateQueries({ queryKey: ["client-package-offers"] });
        queryClient.invalidateQueries({ queryKey: ["billing-receipts"] });
      }
      setParams({}, { replace: true });
    })();
    return () => { cancelled = true; };
  }, [admin, user?.id, params, queryClient, setParams, sq]);

  async function pay(offer: typeof offers[number]) {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("paypal-checkout", {
      body: { action: "create", product_key: offer.product_key, offer_id: offer.id, return_url: `${window.location.origin}/employer/billing` },
    });
    if (error || data?.error || !data?.approve_url) {
      setBusy(false);
      toast.error(data?.error ?? (sq ? "PayPal nuk u hap" : "PayPal could not start"));
    } else window.location.assign(data.approve_url);
  }

  if (!user || (admin && userRole !== "admin")) return null;
  if (!admin && !isLoading && !error && !offers.length) return null;
  return <section className="space-y-4" aria-label={sq ? "Oferta për klientin" : "Client offers"}>
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">{sq ? "Oferta korporative private" : "Private employer packages"}</h2>{admin && <CreatePackageDialog companies={companies} />}</div>
    {isLoading && <p className="text-muted-foreground">{sq ? "Duke ngarkuar…" : "Loading…"}</p>}
    {error && <p role="alert" className="text-destructive">{sq ? "Ofertat nuk u ngarkuan" : "Could not load offers"}</p>}
    {admin && <p className="text-sm text-muted-foreground max-w-3xl">Custom quoted packages for one specific employer (e.g. a signed quotation). You set the price, number of job posts, duration and dates. The employer sees it only on their own Billing page with a "Pay with PayPal" button; once paid, the job posts unlock and are used one per vacancy (each live 30 days) until they run out or the package expires. No auto-renewal. Public prices are not affected.</p>}
    {admin && !isLoading && !error && !offers.length && <p className="text-muted-foreground">No private packages yet. Click "Create package" to add one.</p>}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{offers.map(offer => {
      const product = PAYPAL_PRODUCTS[offer.product_key];
      const active = canUseOffer(offer);
      return <Card key={offer.id}><CardHeader><CardTitle>{offer.package_name || product?.name || offer.product_key}</CardTitle></CardHeader><CardContent className="space-y-3">
        {admin && <p className="font-medium">{companies.find(c => c.id === offer.company_id)?.name ?? offer.company_id}</p>}
        <p className="text-2xl font-semibold">{eur(offer.amount_cents)} <span className="text-sm font-normal text-muted-foreground">{sq ? "një herë" : "one-time"}</span></p>
        <p className="text-sm text-muted-foreground">{approxLek(offer.amount_cents)} · {offer.duration_months} {sq ? "muaj" : "months"}</p>
        <p>{offer.credits_used} / {offer.credit_limit} {sq ? "kredite të përdorura gjithsej" : "job posts used"}</p>
        <p className="text-sm">{sq ? "Aktivizimi" : "Activation"}: {new Date(offer.starts_at).toLocaleDateString(sq ? "sq-AL" : "en-GB")}<br />{sq ? "Skadimi" : "Expiry"}: {new Date(offer.expires_at).toLocaleDateString(sq ? "sq-AL" : "en-GB")}</p>
        <p className="text-sm text-muted-foreground">{sq ? "Një kredit për një vend vakant, aktiv deri në 30 ditë. Kreditë e papërdorura skadojnë. Pa rinovim automatik." : "One credit per vacancy, live up to 30 days. Unused credits expire. No auto-renewal."}</p>
        <p className="text-sm font-medium">{offer.status === "paid" ? (active ? (sq ? "Aktive" : "Active") : new Date(offer.starts_at) > new Date() ? (sq ? "Paguar, në pritje të aktivizimit" : "Paid, awaiting activation") : (sq ? "Kreditet mbaruan ose paketa skadoi" : "Credits exhausted or package expired")) : (sq ? "Në pritje të pagesës" : "Awaiting payment")}</p>
        {!admin && canPurchaseOffer(offer) && <Button disabled={busy} onClick={() => pay(offer)} className="w-full">{sq ? "Paguaj me PayPal" : "Pay with PayPal"}</Button>}
        {offer.status === "offered" && <p className="text-xs text-muted-foreground">{sq ? "Oferta e vlefshme deri më" : "Offer valid through"} {new Date(offer.offer_expires_at).toLocaleDateString(sq ? "sq-AL" : "en-GB")}</p>}
      </CardContent></Card>;
    })}</div>
    {!admin && offers.some(o => canPurchaseOffer(o)) && <p className="text-sm text-muted-foreground">{sq ? PAYPAL_NOTE.sq : PAYPAL_NOTE.en}</p>}
  </section>;
}