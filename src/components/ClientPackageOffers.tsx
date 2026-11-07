import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CLIENT_PACKAGES, canPurchaseOffer, canUseOffer } from "../../supabase/functions/paypal-checkout/clientOffers";
import { PAYPAL_PRODUCTS } from "../../supabase/functions/paypal-checkout/products";
import { eur, approxLek, PAYPAL_NOTE } from "@/lib/pricingConfig";

export default function ClientPackageOffers({ admin = false }: { admin?: boolean }) {
  const { user, userRole } = useAuth();
  const { language } = useLanguage();
  const sq = language === "sq";
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [productKey, setProductKey] = useState("tia_pilot");
  const [start, setStart] = useState("");
  const [packageName, setPackageName] = useState("");
  const [price, setPrice] = useState("");
  const [credits, setCredits] = useState("");
  const [months, setMonths] = useState("");
  const [deadline, setDeadline] = useState("");
  const custom = productKey === "custom_package";
  const { data: offers = [], isLoading, error } = useQuery({
    queryKey: ["client-package-offers", user?.id, admin],
    enabled: !!user && (!admin || userRole === "admin"),
    queryFn: async () => {
      let query = supabase.from("client_package_offers").select("*").order("created_at", { ascending: false });
      if (!admin && user) query = query.eq("employer_user_id", user.id);
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

  async function assign(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("paypal-checkout", {
      body: { action: "assign_offer", company_id: companyId, product_key: productKey, starts_at: new Date(`${start}T00:00:00Z`).toISOString(), ...(custom ? { package_name: packageName, amount_cents: Math.round(Number(price) * 100), credit_limit: Number(credits), duration_months: Number(months), offer_expires_at: new Date(`${deadline}T23:59:59Z`).toISOString() } : {}) },
    });
    setBusy(false);
    if (error || data?.error) toast.error(data?.error ?? (sq ? "Oferta nuk u caktua" : "Could not assign offer"));
    else {
      toast.success(sq ? "Oferta u shtua te Faturimi i klientit" : "Offer added to the client's Billing page");
      queryClient.invalidateQueries({ queryKey: ["client-package-offers"] });
    }
  }

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
    <h2 className="text-xl font-semibold">{sq ? "Oferta korporative private" : "Private employer packages"}</h2>
    {admin && <form onSubmit={assign} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
      <div className="space-y-2"><Label>{sq ? "Kompania e klientit" : "Client company"}</Label><Select value={companyId} onValueChange={setCompanyId}><SelectTrigger aria-label="Client company"><SelectValue placeholder={sq ? "Zgjidh kompaninë" : "Select company"} /></SelectTrigger><SelectContent>{companies.map(company => <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>{sq ? "Paketa e dakordësuar" : "Agreed package"}</Label><Select value={productKey} onValueChange={setProductKey}><SelectTrigger aria-label="Agreed package"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="custom_package">{sq ? "Paketë e personalizuar" : "Custom quoted package"}</SelectItem>{CLIENT_PACKAGES.map(p => <SelectItem key={p.key} value={p.key}>{p.name} · {eur(p.amount_cents)} · {p.duration_months} {sq ? "muaj" : "months"} · {p.listing_credits} {sq ? "kredite" : "credits"}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label htmlFor="client-start">{sq ? "Data e aktivizimit e dakordësuar" : "Agreed activation date"}</Label><Input id="client-start" type="date" required min={new Date().toISOString().slice(0, 10)} value={start} onChange={e => setStart(e.target.value)} /></div>
      {custom && <>
        <div className="space-y-2"><Label htmlFor="offer-name">{sq ? "Emri i paketës" : "Package name"}</Label><Input id="offer-name" required maxLength={120} value={packageName} onChange={e => setPackageName(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="offer-price">{sq ? "Çmimi total (€)" : "Total price (€)"}</Label><Input id="offer-price" type="number" min="0.01" step="0.01" required value={price} onChange={e => setPrice(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="offer-credits">{sq ? "Publikime pune gjithsej" : "Total job postings"}</Label><Input id="offer-credits" type="number" min="1" step="1" required value={credits} onChange={e => setCredits(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="offer-months">{sq ? "Kohëzgjatja (muaj)" : "Duration (months)"}</Label><Input id="offer-months" type="number" min="1" max="120" step="1" required value={months} onChange={e => setMonths(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="offer-deadline">{sq ? "Afati i pranimit" : "Acceptance deadline"}</Label><Input id="offer-deadline" type="date" required min={new Date().toISOString().slice(0, 10)} value={deadline} onChange={e => setDeadline(e.target.value)} /></div>
      </>}
      <Button type="submit" disabled={busy || !companyId || !start}>{sq ? "Cakto ofertën" : "Assign offer"}</Button>
    </form>}
    {isLoading && <p className="text-muted-foreground">{sq ? "Duke ngarkuar…" : "Loading…"}</p>}
    {error && <p role="alert" className="text-destructive">{sq ? "Ofertat nuk u ngarkuan" : "Could not load offers"}</p>}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{offers.map(offer => {
      const product = PAYPAL_PRODUCTS[offer.product_key];
      const active = canUseOffer(offer);
      return <Card key={offer.id}><CardHeader><CardTitle>{offer.package_name || product?.name || offer.product_key}</CardTitle></CardHeader><CardContent className="space-y-3">
        {admin && <p className="font-medium">{companies.find(c => c.id === offer.company_id)?.name ?? offer.company_id}</p>}
        <p className="text-2xl font-semibold">{eur(offer.amount_cents)} <span className="text-sm font-normal text-muted-foreground">{sq ? "një herë" : "one-time"}</span></p>
        <p className="text-sm text-muted-foreground">{approxLek(offer.amount_cents)} · {offer.duration_months} {sq ? "muaj" : "months"}</p>
        <p>{offer.credits_used} / {offer.credit_limit} {sq ? "kredite të përdorura gjithsej" : "total credits used"}</p>
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