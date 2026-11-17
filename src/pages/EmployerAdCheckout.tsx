import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { loadPayPalSdk } from "@/lib/paypalSdk";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Check, Tag, ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { addDays, format } from "date-fns";

type CartItem = { productId: string; jobId: string | null };
type AdProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  product_type: string;
  duration_days: number;
  price: number;
  currency: string;
  features: string[];
};

declare global { interface Window { paypal?: any } }

export default function EmployerAdCheckout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const paypalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedCart = sessionStorage.getItem("ad_cart");
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch { navigate("/employer/ads"); }
    } else {
      navigate("/employer/ads");
    }
  }, [navigate]);

  const { data: company } = useQuery({
    queryKey: ["employer-company", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("id, name").eq("owner_id", user?.id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["ad-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ad_products").select("*").eq("is_active", true);
      if (error) throw error;
      return data as AdProduct[];
    },
  });

  const { data: jobs } = useQuery({
    queryKey: ["employer-jobs", company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("id, title").eq("company_id", company?.id);
      if (error) throw error;
      return data;
    },
  });

  const subtotal = cart.reduce((sum, item) => sum + (products?.find((product) => product.id === item.productId)?.price || 0), 0);

  useEffect(() => {
    if (!cart.length) return;
    let cancelled = false;
    loadPayPalSdk("capture").then(() => { if (!cancelled) setSdkReady(true); })
      .catch(() => { if (!cancelled) toast.error("PayPal failed to load"); });
    return () => { cancelled = true; };
  }, [cart.length]);

  useEffect(() => {
    if (!sdkReady || busy || !paypalRef.current || !window.paypal || !cart.length || !products?.length) return;
    paypalRef.current.innerHTML = "";
    window.paypal.Buttons({
      createOrder: async () => {
        const { data, error } = await supabase.functions.invoke("paypal-checkout", {
          body: {
            action: "create_ad",
            items: cart.map((item) => ({ product_id: item.productId, job_id: item.jobId })),
            promo_code: promoCode.trim() || undefined,
            return_url: `${window.location.origin}/employer/ads/checkout`,
          },
        });
        if (error || !data?.order_id) throw new Error(data?.error || "Could not create the PayPal order");
        return data.order_id;
      },
      onApprove: async (data: any) => {
        setBusy(true);
        const { data: capture, error } = await supabase.functions.invoke("paypal-checkout", {
          body: { action: "capture_ad", order_id: data.orderID },
        });
        setBusy(false);
        if (error || capture?.error || capture?.status !== "completed") {
          toast.error(capture?.error || "Payment was not completed");
          return;
        }
        sessionStorage.removeItem("ad_cart");
        toast.success("Payment confirmed. Your ads are now active.");
        navigate("/employer/ads");
      },
      onCancel: () => toast.info("Payment cancelled. Your ads have not been activated."),
      onError: (error: any) => toast.error(error?.message || "PayPal could not start"),
    }).render(paypalRef.current);
  }, [sdkReady, busy, cart, products, promoCode, navigate]);

  if (!cart.length) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Card><CardContent className="py-12 text-center space-y-4">
            <p className="text-muted-foreground">Your cart is empty</p>
            <Button onClick={() => navigate("/employer/ads")}>Browse Ad Products</Button>
          </CardContent></Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-4" onClick={() => navigate("/employer/ads")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Ads
        </Button>
        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review your ad purchases</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.map((item, index) => {
                const product = products?.find((entry) => entry.id === item.productId);
                const job = jobs?.find((entry) => entry.id === item.jobId);
                const startDate = new Date();
                const endDate = addDays(startDate, product?.duration_days || 7);
                return (
                  <div key={`${item.productId}-${index}`} className="flex items-start justify-between p-4 bg-muted rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{product?.name}</p>
                      <p className="text-sm text-muted-foreground">{job?.title || "Company-wide promotion"}</p>
                      <p className="text-xs text-muted-foreground">{format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}</p>
                    </div>
                    <span className="font-medium">€{((product?.price || 0) / 100).toFixed(2)}</span>
                  </div>
                );
              })}
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="promo">Promo Code (optional)</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="promo" className="pl-9" value={promoCode} onChange={(event) => setPromoCode(event.target.value.toUpperCase())} placeholder="Enter code" />
                </div>
                <p className="text-xs text-muted-foreground">The code and final discount are validated securely before PayPal opens.</p>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Subtotal</span>
                <span>€{(subtotal / 100).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pay with PayPal</CardTitle>
              <CardDescription>Your ads activate only after PayPal confirms the exact payment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {busy ? (
                <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" /> Confirming payment and activating your ads…
                </div>
              ) : (
                <div ref={paypalRef} className="min-h-[50px]" />
              )}
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /><span>Server-verified prices and promo codes</span></div>
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /><span>Activation only after confirmed payment</span></div>
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /><span>PayPal handles your payment details</span></div>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">Cancelling or closing PayPal leaves every ad pending and takes no payment.</p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
