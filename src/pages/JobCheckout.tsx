import { useEffect, useRef, useState } from "react";
import { loadPayPalSdk } from "@/lib/paypalSdk";
import { useParams, useNavigate, Link, Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, Loader2, Star, Facebook, ExternalLink, ShieldCheck } from "lucide-react";
import { LISTING_OPTIONS, URGENT_ADDON, eur, approxLek, VAT_NOTE, PAYPAL_NOTE } from "@/lib/pricingConfig";
import { canUseOffer } from "../../supabase/functions/paypal-checkout/clientOffers";

declare global {
  interface Window { paypal?: any; }
}

type Step = "visibility" | "review" | "success";

export default function JobCheckout() {
  const { jobId } = useParams<{ jobId: string }>();
  const { user, userRole, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sq = language === "sq";

  const [step, setStep] = useState<Step>("visibility");
  const [selected, setSelected] = useState<string>("standard_listing");
  const [urgent, setUrgent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const paypalRef = useRef<HTMLDivElement>(null);

  const { data: job, isLoading } = useQuery({
    queryKey: ["checkout-job", jobId],
    enabled: !!user && !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*").eq("id", jobId ?? "").single();
      if (error) throw error;
      return data as any;
    },
  });

  // Free standard listing this month?
  const { data: freeAvailable } = useQuery({
    queryKey: ["free-listing-available", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
      const { count } = await (supabase as any).from("job_listings")
        .select("id", { count: "exact", head: true })
        .eq("employer_user_id", user?.id).eq("product_key", "free_monthly")
        .gte("created_at", monthStart.toISOString());
      return (count ?? 0) === 0;
    },
  });

  // Active package with remaining slots?
  const { data: packageSlot } = useQuery({
    queryKey: ["package-slot", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: sub } = await (supabase as any).from("subscriptions").select("*")
        .eq("user_id", user?.id).eq("status", "active")
        .not("paypal_subscription_id", "is", null)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!sub || !sub.current_period_end || new Date(sub.current_period_end) <= new Date()) return null;
      const periodStart = sub.current_period_start ?? sub.created_at;
      const { count } = await (supabase as any).from("job_listings")
        .select("id", { count: "exact", head: true })
        .eq("employer_user_id", user?.id).eq("product_key", `package:${sub.plan_slug}`)
        .gte("created_at", periodStart);
      return (count ?? 0) < (sub.job_posts_limit ?? 0) ? sub : null;
    },
  });

  const { data: clientPackage } = useQuery({
    queryKey: ["client-package-credit", user?.id, job?.company_id],
    enabled: !!user && !!job,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("client_package_offers").select("*").eq("employer_user_id", user.id).eq("status", "paid").order("expires_at");
      if (error) throw error;
      return data?.find(offer => offer.company_id === job?.company_id && canUseOffer(offer)) ?? null;
    },
  });

  const hasFreeOption = !!freeAvailable || !!packageSlot || !!clientPackage;

  // Pre-select the free option when available.
  useEffect(() => {
    if (hasFreeOption) setSelected("free");
  }, [hasFreeOption]);

  const selectedProduct = LISTING_OPTIONS.find((o) => o.key === selected);
  const totalCents = selected === "free"
    ? 0
    : (selectedProduct?.amount_cents ?? 0) + (urgent ? URGENT_ADDON.amount_cents : 0);

  // Load the PayPal JS SDK when entering the review step with a paid option.
  useEffect(() => {
    if (step !== "review" || totalCents === 0) return;
    let cancelled = false;
    setSdkReady(false);
    loadPayPalSdk("capture")
      .then(() => !cancelled && setSdkReady(true))
      .catch(() => !cancelled && toast.error(sq ? "PayPal nuk u ngarkua" : "PayPal failed to load"));
    return () => { cancelled = true; };
  }, [step, totalCents]);

  // Render PayPal buttons once the SDK is ready. Depends on step/busy so the
  // buttons re-render after going Back or after a failed payment remounts the div.
  useEffect(() => {
    if (step !== "review" || busy || !sdkReady || !paypalRef.current || !window.paypal || totalCents === 0) return;
    paypalRef.current.innerHTML = "";
    // The urgent add-on is charged in the same order as the listing (one approval, full total).
    window.paypal.Buttons({
      createOrder: async () => {
        const { data, error } = await supabase.functions.invoke("paypal-checkout", {
          body: { action: "create", product_key: selected, job_id: jobId, urgent, return_url: window.location.origin + `/post-job/${jobId}/checkout` },
        });
        if (error || !data?.order_id) throw new Error(data?.error ?? "Could not create order");
        return data.order_id;
      },
      onApprove: async (data: any) => {
        setBusy(true);
        const { data: cap, error } = await supabase.functions.invoke("paypal-checkout", {
          body: { action: "capture", order_id: data.orderID },
        });
        if (error || cap?.error) {
          setBusy(false);
          toast.error(sq ? "Pagesa nuk u krye" : "Payment was not completed");
          return;
        }
        setBusy(false);
        setStep("success");
        queryClient.invalidateQueries({ queryKey: ["employerJobs"] });
      },
      onError: () => toast.error(sq ? "PayPal nuk u hap" : "PayPal could not start"),
    }).render(paypalRef.current);
  }, [sdkReady, step, busy, selected, urgent, totalCents, jobId]);

  const publishFree = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("paypal-checkout", {
      body: { action: "publish_free", job_id: jobId, ...(clientPackage ? { offer_id: clientPackage.id } : {}) },
    });
    setBusy(false);
    if (error || data?.error) {
      toast.error(data?.error ?? (sq ? "Nuk ka vend falas këtë muaj" : "No free slot available this month"));
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["employerJobs"] });
    queryClient.invalidateQueries({ queryKey: ["client-package-offers"] });
    queryClient.invalidateQueries({ queryKey: ["client-package-credit"] });
    setStep("success");
  };

  if (authLoading || isLoading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/auth?type=employer" replace />;
  if (!job || job.posted_by !== user.id) return <Navigate to="/dashboard" replace />;
  if (job.is_active && step !== "success") return <Navigate to={`/jobs/${job.slug}`} replace />;

  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://jobs.al/jobs/${job.slug}`)}`;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{sq ? "Publiko punën" : "Publish your job"}</h1>
          <p className="text-muted-foreground">{job.title}</p>
        </div>

        {step === "visibility" && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{sq ? "Zgjidh dukshmërinë" : "Choose visibility"}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hasFreeOption && (
                <Card
                  className={`cursor-pointer flex flex-col ${selected === "free" ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelected("free")}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{clientPackage ? (sq ? "Kredit i paketës" : "Package credit") : (sq ? "Falas këtë muaj" : "Free this month")}</CardTitle>
                    <CardDescription>€0 · {approxLek(0)}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground flex-1">
                    {clientPackage
                      ? (sq ? `${clientPackage.credit_limit - clientPackage.credits_used} kredite të mbetura deri më ${new Date(clientPackage.expires_at).toLocaleDateString("sq-AL")}` : `${clientPackage.credit_limit - clientPackage.credits_used} credits remaining until ${new Date(clientPackage.expires_at).toLocaleDateString("en-GB")}`)
                      : packageSlot
                      ? (sq ? `Përfshihet në paketën tuaj ${packageSlot.plan_slug}` : `Included in your ${packageSlot.plan_slug} package`)
                      : (sq ? "Njoftimi juaj i parë standard çdo muaj është falas" : "Your first standard listing each month is free")}
                  </CardContent>
                </Card>
              )}
              {LISTING_OPTIONS.map((o) => (
                <Card
                  key={o.key}
                  className={`cursor-pointer flex flex-col relative ${selected === o.key ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelected(o.key)}
                >
                  {o.recommended && (
                    <Badge className="absolute -top-3 left-4"><Star className="h-3 w-3 mr-1" />{sq ? "Rekomandohet" : "Recommended"}</Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{o.name}</CardTitle>
                    <CardDescription>{eur(o.amount_cents)} · {approxLek(o.amount_cents)}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground flex-1 space-y-1">
                    <p className="flex items-center gap-1"><Check className="h-3 w-3" />{sq ? "30 ditë aktiv" : "30 days live"}</p>
                    {o.featured_days > 0 && (
                      <p className="flex items-center gap-1"><Check className="h-3 w-3" />{o.featured_days} {sq ? "ditë i veçuar" : "days featured"}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {selected !== "free" && (
              <div className="flex items-center space-x-2 rounded-lg border p-4">
                <Checkbox id="urgent" checked={urgent} onCheckedChange={(c) => setUrgent(!!c)} />
                <Label htmlFor="urgent" className="cursor-pointer flex-1">
                  {sq ? "Shënoje si punë urgjente" : "Mark as urgent hiring"}
                  <span className="ml-2 text-muted-foreground">{eur(URGENT_ADDON.amount_cents)} · {approxLek(URGENT_ADDON.amount_cents)}</span>
                </Label>
              </div>
            )}

            <Button size="lg" className="w-full" onClick={() => (selected === "free" ? publishFree() : setStep("review"))} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {selected === "free"
                ? (sq ? "Publiko falas tani" : "Publish free now")
                : (sq ? "Vazhdo te pagesa" : "Continue to payment")}
            </Button>
          </section>
        )}

        {step === "review" && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{sq ? "Rishiko dhe paguaj" : "Review and pay"}</h2>
            <Card>
              <CardHeader><CardTitle className="text-lg">{sq ? "Përmbledhja e porosisë" : "Order summary"}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>{sq ? "Puna" : "Job"}</span><span className="font-medium">{job.title}</span></div>
                <div className="flex justify-between"><span>{sq ? "Opsioni" : "Option"}</span><span>{selectedProduct?.name}{urgent ? ` + ${sq ? "Urgjent" : "Urgent"}` : ""}</span></div>
                <div className="flex justify-between"><span>{sq ? "Kohëzgjatja" : "Duration"}</span><span>30 {sq ? "ditë" : "days"}</span></div>
                <div className="flex justify-between border-t pt-2 text-base font-bold">
                  <span>Total</span>
                  <span>{eur(totalCents)} <span className="text-sm font-normal text-muted-foreground">{approxLek(totalCents)}</span></span>
                </div>
                <p className="text-xs text-muted-foreground pt-1">{sq ? VAT_NOTE.sq : VAT_NOTE.en}</p>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {busy ? (
                <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : (
                <div ref={paypalRef} className="min-h-[50px]" />
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
                <ShieldCheck className="h-3 w-3" />{sq ? PAYPAL_NOTE.sq : PAYPAL_NOTE.en}
              </p>
            </div>

            <Button variant="ghost" onClick={() => setStep("visibility")}>{sq ? "← Kthehu" : "← Back"}</Button>
          </section>
        )}

        {step === "success" && (
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto rounded-full bg-green-500/10 p-3 text-green-600 w-fit"><Check className="h-8 w-8" /></div>
              <CardTitle className="text-2xl">{sq ? "Puna juaj është live!" : "Your job is live!"}</CardTitle>
              <CardDescription>{sq ? "Një faturë u dërgua në emailin tuaj." : "A receipt has been sent to your email."}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild><Link to={`/jobs/${job.slug}`}><ExternalLink className="h-4 w-4 mr-2" />{sq ? "Shiko punën" : "View the job"}</Link></Button>
              <Button variant="outline" asChild>
                <a href={shareUrl} target="_blank" rel="noopener noreferrer"><Facebook className="h-4 w-4 mr-2" />{sq ? "Ndaje në Facebook" : "Share on Facebook"}</a>
              </Button>
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>{sq ? "Paneli" : "Dashboard"}</Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
