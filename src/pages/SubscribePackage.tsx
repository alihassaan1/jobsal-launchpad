import { useEffect, useRef, useState } from "react";
import { useParams, Link, Navigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { MONTHLY_PACKAGES, eur, approxLek, VAT_NOTE, PAYPAL_NOTE } from "@/lib/pricingConfig";

declare global {
  interface Window { paypal?: any; }
}

export default function SubscribePackage() {
  const { packageKey } = useParams<{ packageKey: string }>();
  const { user, userRole, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const sq = language === "sq";

  const pkg = MONTHLY_PACKAGES.find((p) => p.key === packageKey);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const paypalRef = useRef<HTMLDivElement>(null);

  // Handle PayPal's redirect return (?paypal=subscribe-return&subscription_id=...).
  useEffect(() => {
    const subId = searchParams.get("subscription_id");
    if (searchParams.get("paypal") !== "subscribe-return" || !subId || !user) return;
    setBusy(true);
    supabase.functions.invoke("paypal-checkout", { body: { action: "activate", subscription_id: subId } })
      .then(({ data, error }) => {
        if (error || data?.error) toast.error(data?.error ?? (sq ? "Aktivizimi dështoi" : "Activation failed"));
        else setDone(true);
      })
      .finally(() => setBusy(false));
  }, [searchParams, user]);

  // Load the PayPal JS SDK in subscription mode.
  useEffect(() => {
    if (!user || !pkg || done) return;
    if (window.paypal) { setSdkReady(true); return; }
    if (document.querySelector('script[data-paypal-sdk]')) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.functions.invoke("paypal-checkout", { body: { action: "config" } });
      if (error || !data?.client_id || cancelled) return;
      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${data.client_id}&currency=EUR&components=buttons&intent=subscription&vault=true`;
      script.dataset.paypalSdk = "true";
      script.onload = () => !cancelled && setSdkReady(true);
      script.onerror = () => toast.error(sq ? "PayPal nuk u ngarkua" : "PayPal failed to load");
      document.body.appendChild(script);
    })();
    return () => { cancelled = true; };
  }, [user, pkg, done]);

  // Render the subscription buttons once the SDK is ready.
  useEffect(() => {
    if (!sdkReady || busy || done || !paypalRef.current || !window.paypal || !pkg) return;
    paypalRef.current.innerHTML = "";
    window.paypal.Buttons({
      style: { layout: "vertical", label: "subscribe" },
      createSubscription: async () => {
        const { data, error } = await supabase.functions.invoke("paypal-checkout", {
          body: { action: "subscribe", product_key: pkg.key, return_url: window.location.origin + `/subscribe/${pkg.key}` },
        });
        if (error || !data?.subscription_id) {
          toast.error(data?.error ?? (sq ? "Abonimi nuk u krijua" : "Could not create the subscription"));
          throw new Error(data?.error ?? "subscribe failed");
        }
        return data.subscription_id;
      },
      onApprove: async (data: any) => {
        setBusy(true);
        const { data: act, error } = await supabase.functions.invoke("paypal-checkout", {
          body: { action: "activate", subscription_id: data.subscriptionID },
        });
        setBusy(false);
        if (error || act?.error) {
          toast.error(sq ? "Aktivizimi dështoi, kontaktoni mbështetjen" : "Activation failed, please contact support");
          return;
        }
        setDone(true);
      },
      onError: () => toast.error(sq ? "PayPal nuk u hap" : "PayPal could not start"),
    }).render(paypalRef.current);
  }, [sdkReady, busy, done, pkg]);

  if (authLoading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/auth?type=employer" replace />;
  if (userRole !== "employer" && userRole !== "admin") return <Navigate to="/" replace />;
  if (!pkg) return <Navigate to="/pricing" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-xl space-y-6">
        <h1 className="text-3xl font-bold">{sq ? `Abonohu në ${pkg.name}` : `Subscribe to ${pkg.name}`}</h1>

        {done ? (
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto rounded-full bg-green-500/10 p-3 text-green-600 w-fit"><Check className="h-8 w-8" /></div>
              <CardTitle className="text-2xl">{sq ? "Paketa juaj është aktive!" : "Your package is active!"}</CardTitle>
              <CardDescription>{sq ? "Rinovohet automatikisht çdo muaj." : "It renews automatically every month."}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild><Link to="/dashboard">{sq ? "Publiko një punë" : "Post a job"}</Link></Button>
              <Button variant="outline" asChild><Link to="/employer/billing">{sq ? "Shiko faturimin" : "View billing"}</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader><CardTitle className="text-lg">{sq ? "Përmbledhja" : "Summary"}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>{sq ? "Paketa" : "Package"}</span><span className="font-medium">{pkg.name}</span></div>
                <div className="flex justify-between"><span>{sq ? "Njoftime aktive" : "Active listings"}</span><span>{pkg.listing_credits}</span></div>
                <div className="flex justify-between border-t pt-2 text-base font-bold">
                  <span>Total</span>
                  <span>{eur(pkg.amount_cents)}{sq ? "/muaj" : "/month"} <span className="text-sm font-normal text-muted-foreground">{approxLek(pkg.amount_cents)}</span></span>
                </div>
                <p className="text-xs text-muted-foreground pt-1">{sq ? "Rinovohet automatikisht çdo muaj, anulo kur të duash." : "Renews automatically every month, cancel anytime."} {sq ? VAT_NOTE.sq : VAT_NOTE.en}</p>
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

            <Button variant="ghost" asChild><Link to="/pricing">{sq ? "← Kthehu te çmimet" : "← Back to pricing"}</Link></Button>
          </>
        )}
      </main>
    </div>
  );
}
