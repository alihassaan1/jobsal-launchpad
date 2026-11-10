import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { loadPayPalSdk } from "@/lib/paypalSdk";

type Offer = { package_name: string | null; company_name: string; amount_cents: number; credit_limit: number; expires_at: string; offer_expires_at: string; status: string };

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export default function PayPackage() {
  const { offerId = "" } = useParams();
  const [params] = useSearchParams();
  const token = params.get("t") ?? "";
  const [offer, setOffer] = useState<Offer | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.functions.invoke("paypal-checkout", { body: { action: "link_offer", offer_id: offerId, token } })
      .then(({ data }) => (data?.offer ? setOffer(data.offer) : setError("This payment link is invalid.")));
  }, [offerId, token]);

  const payable = offer?.status === "offered" && new Date(offer.offer_expires_at) > new Date();

  useEffect(() => {
    if (!payable || !ref.current) return;
    let cancelled = false;
    loadPayPalSdk("capture").then((paypal) => {
      if (cancelled || !ref.current) return;
      ref.current.innerHTML = "";
      paypal.Buttons({
        createOrder: async () => {
          const { data } = await supabase.functions.invoke("paypal-checkout", { body: { action: "link_create", offer_id: offerId, token, return_url: window.location.href } });
          if (!data?.order_id) throw new Error(data?.error ?? "Could not start payment");
          return data.order_id;
        },
        onApprove: async ({ orderID }: { orderID: string }) => {
          setBusy(true);
          const { data } = await supabase.functions.invoke("paypal-checkout", { body: { action: "link_capture", offer_id: offerId, token, order_id: orderID } });
          setBusy(false);
          if (data?.status === "completed") setOffer((o) => (o ? { ...o, status: "paid" } : o));
          else setError(data?.error ?? "Payment was not completed.");
        },
        onError: () => setError("PayPal could not complete the payment. Please try again."),
      }).render(ref.current);
    }).catch(() => setError("PayPal failed to load."));
    return () => { cancelled = true; };
  }, [payable, offerId, token]);

  return (
    <main className="min-h-[70vh] bg-muted/30 py-12 px-4">
      <Helmet><title>Package payment | Jobs.al</title><meta name="robots" content="noindex, nofollow" /></Helmet>
      <Card className="max-w-lg mx-auto">
        <CardHeader><CardTitle>Jobs.al package payment</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!offer && !error && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
          {offer && (
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">Company</dt><dd className="font-medium">{offer.company_name}</dd>
              <dt className="text-muted-foreground">Package</dt><dd className="font-medium">{offer.package_name}</dd>
              <dt className="text-muted-foreground">Job posts</dt><dd className="font-medium">{offer.credit_limit}</dd>
              <dt className="text-muted-foreground">Valid until</dt><dd className="font-medium">{fmt(offer.expires_at)}</dd>
              <dt className="text-muted-foreground">Total</dt><dd className="text-lg font-bold">€{(offer.amount_cents / 100).toFixed(2)}</dd>
            </dl>
          )}
          {offer?.status === "paid" && (
            <div className="flex items-center gap-2 rounded-md bg-primary/10 p-3 text-sm font-medium">
              <CheckCircle2 className="h-5 w-5 text-primary" /> Paid — thank you. The package is active and a receipt has been emailed.
            </div>
          )}
          {offer && !payable && offer.status !== "paid" && <p className="text-sm text-destructive">This payment link has expired. Contact info@jobs.al.</p>}
          {payable && <p className="text-xs text-muted-foreground">Pay with PayPal or a debit/credit card. No Jobs.al account needed.</p>}
          {busy && <p className="text-sm flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Confirming payment…</p>}
          {payable && <div ref={ref} />}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </main>
  );
}
