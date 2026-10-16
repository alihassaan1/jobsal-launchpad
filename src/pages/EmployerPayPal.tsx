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
import { Loader2 } from "lucide-react";
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

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  useEffect(() => {
    const state = params.get("paypal");
    const token = params.get("token");
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
  }, [params, user]);

  const buy = async (key: string) => {
    setBusy(key);
    const { data, error } = await supabase.functions.invoke("paypal-checkout", {
      body: { action: "create", product_key: key, return_url: window.location.origin + "/employer/paypal" },
    });
    if (error || !data?.approve_url) { toast.error("Could not start PayPal / PayPal nuk u hap"); setBusy(null); return; }
    window.location.href = data.approve_url;
  };

  const products = Object.values(PAYPAL_PRODUCTS);
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Pay with PayPal / Paguaj me PayPal</h1>
          <p className="text-muted-foreground">Your first standard listing each month is free. / Njoftimi i parë standard çdo muaj është falas.</p>
          <Badge variant="secondary" className="mt-2">Test mode / Modalitet testimi</Badge>
        </div>
        {(["listing", "package"] as const).map((kind) => (
          <section key={kind} className="space-y-4">
            <h2 className="text-xl font-semibold">{kind === "listing" ? "Job listings / Njoftime pune" : "Monthly packages / Paketa mujore"}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.filter((p) => p.kind === kind).map((p) => (
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
        ))}
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
