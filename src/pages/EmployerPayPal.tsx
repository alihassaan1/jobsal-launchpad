import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { PAYPAL_PRODUCTS, formatEur } from "../../supabase/functions/paypal-checkout/products";

export default function EmployerPayPal() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [busy, setBusy] = useState<string | null>(null);

  const { data: orders, refetch } = useQuery({
    queryKey: ["paypal-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any).from("paypal_orders").select("*").order("created_at", { ascending: false }).limit(10);
      return (data ?? []) as any[];
    },
  });

  const { data: subscription, refetch: refetchSub } = useQuery({
    queryKey: ["paypal-subscription", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any).from("subscriptions").select("*")
        .not("paypal_subscription_id", "is", null)
        .in("status", ["active", "pending", "past_due"])
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data as any | null;
    },
  });

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  useEffect(() => {
    const state = params.get("paypal");
    const token = params.get("token");
    const subId = params.get("subscription_id");
    if (state === "cancel") { toast.info("Payment cancelled / Pagesa u anulua"); setParams({}); }
    if (state === "return" && token && user) {
      setBusy("capture");
      supabase.functions.invoke("paypal-checkout", { body: { action: "capture", order_id: token } })
        .then(({ data, error }) => {
          if (error || data?.error) toast.error("Payment not completed / Pagesa nuk u krye");
          else toast.success("Payment received / Pagesa u krye me sukses");
          refetch();
        })
        .finally(() => { setBusy(null); setParams({}); });
    }
    if (state === "subscribe-return" && subId && user) {
      setBusy("activate");
      supabase.functions.invoke("paypal-checkout", { body: { action: "activate", subscription_id: subId } })
        .then(({ data, error }) => {
          if (error || data?.error) toast.error("Subscription not activated / Abonimi nuk u aktivizua");
          else toast.success("Subscription active — renews monthly / Abonimi aktiv — rinovohet çdo muaj");
          refetchSub();
        })
        .finally(() => { setBusy(null); setParams({}); });
    }
  }, [params, user]);

  const buy = async (key: string) => {
    setBusy(key);
    const { data, error } = await supabase.functions.invoke("paypal-checkout", {
      body: { action: "create", product_key: key, return_url: window.location.origin + "/employer/paypal" },
    });
    if (error || !data?.approve_url) { toast.error("Could not start PayPal / PayPal nuk u hap"); setBusy(null); return; }
    window.location.href = data.approve_url;
  };

  const subscribe = async (key: string) => {
    setBusy(key);
    const { data, error } = await supabase.functions.invoke("paypal-checkout", {
      body: { action: "subscribe", product_key: key, return_url: window.location.origin + "/employer/paypal" },
    });
    if (error || !data?.approve_url) {
      toast.error(data?.error ?? "Could not start subscription / Abonimi nuk u hap");
      setBusy(null);
      return;
    }
    window.location.href = data.approve_url;
  };

  const cancelSub = async (id: string) => {
    setBusy("cancel");
    const { data, error } = await supabase.functions.invoke("paypal-checkout", {
      body: { action: "cancel", subscription_id: id },
    });
    if (error || data?.error) toast.error("Could not cancel / Anulimi dështoi");
    else { toast.success("Subscription cancelled / Abonimi u anulua"); refetchSub(); }
    setBusy(null);
  };

  const products = Object.values(PAYPAL_PRODUCTS);
  const hasActiveSub = !!subscription;
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Pay with PayPal / Paguaj me PayPal</h1>
          <p className="text-muted-foreground">Your first standard listing each month is free. / Njoftimi i parë standard çdo muaj është falas.</p>
          <Badge variant="secondary" className="mt-2">Test mode / Modalitet testimi</Badge>
        </div>

        {subscription && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <RefreshCw className="h-5 w-5" />
                Your package / Paketa juaj
                <Badge variant={subscription.status === "active" ? "default" : "secondary"}>{subscription.status}</Badge>
              </CardTitle>
              <CardDescription>
                {subscription.plan_slug} · €{subscription.amount_eur}/month — renews automatically / rinovohet automatikisht çdo muaj
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {subscription.current_period_end && (
                <p>Next renewal / Rinovimi i radhës: {new Date(subscription.current_period_end).toLocaleDateString()}</p>
              )}
              {subscription.last_payment_at && (
                <p>Last payment / Pagesa e fundit: {new Date(subscription.last_payment_at).toLocaleDateString()} (€{subscription.last_payment_amount})</p>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" disabled={!!busy} onClick={() => cancelSub(subscription.paypal_subscription_id)}>
                {busy === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel auto-renewal / Anulo rinovimin"}
              </Button>
            </CardFooter>
          </Card>
        )}

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Job listings / Njoftime pune</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.filter((p) => p.kind === "listing").map((p) => (
              <Card key={p.key}>
                <CardHeader>
                  <CardTitle className="text-lg">{p.name}</CardTitle>
                  <CardDescription>€{formatEur(p.amount_cents)}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {p.listing_credits > 0 && <p>{p.listing_credits} listing(s)</p>}
                  {p.featured_days > 0 && <p>{p.featured_days} days featured</p>}
                </CardContent>
                <CardFooter>
                  <Button className="w-full" disabled={!!busy} onClick={() => buy(p.key)}>
                    {busy === p.key ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pay with PayPal"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Monthly packages / Paketa mujore</h2>
          <p className="text-sm text-muted-foreground">
            Charged automatically every month until you cancel. / Tarifohet automatikisht çdo muaj derisa ta anuloni.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.filter((p) => p.kind === "subscription").map((p) => (
              <Card key={p.key}>
                <CardHeader>
                  <CardTitle className="text-lg">{p.name}</CardTitle>
                  <CardDescription>€{formatEur(p.amount_cents)}/month</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {p.listing_credits > 0 && <p>{p.listing_credits} active listings</p>}
                  <p className="flex items-center gap-1"><RefreshCw className="h-3 w-3" /> Auto-renews monthly</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" disabled={!!busy || hasActiveSub} onClick={() => subscribe(p.key)}>
                    {busy === p.key ? <Loader2 className="h-4 w-4 animate-spin" />
                      : hasActiveSub ? "One package at a time" : "Subscribe with PayPal"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {orders && orders.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Recent payments / Pagesat e fundit</h2>
            {orders.map((o) => (
              <div key={o.id} className="flex justify-between rounded-lg bg-muted p-3 text-sm">
                <span>{PAYPAL_PRODUCTS[o.product_key]?.name ?? o.product_key}</span>
                <span>€{formatEur(o.amount_cents)} · {o.status}</span>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
