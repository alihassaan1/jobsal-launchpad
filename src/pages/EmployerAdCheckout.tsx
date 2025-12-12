import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

type PaymentMethod = "stripe" | "paypal" | "bank_transfer";
type AdPurchaseStatus = "pending" | "active" | "expired" | "cancelled";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CreditCard, Check, Tag, ArrowLeft, Loader2 } from "lucide-react";
import { addDays, format } from "date-fns";

type CartItem = {
  productId: string;
  jobId: string | null;
};

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

type PromoCode = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_purchase_amount: number;
};

export default function EmployerAdCheckout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load cart from session storage
  useEffect(() => {
    const savedCart = sessionStorage.getItem("ad_cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      navigate("/employer/ads");
    }
  }, [navigate]);

  // Fetch company
  const { data: company } = useQuery({
    queryKey: ["employer-company", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .eq("owner_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch ad products
  const { data: products } = useQuery({
    queryKey: ["ad-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_products")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data as AdProduct[];
    },
  });

  // Fetch jobs
  const { data: jobs } = useQuery({
    queryKey: ["employer-jobs", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title")
        .eq("company_id", company?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!company?.id,
  });

  const getSubtotal = () => {
    return cart.reduce((sum, item) => {
      const product = products?.find(p => p.id === item.productId);
      return sum + (product?.price || 0);
    }, 0);
  };

  const getDiscount = () => {
    if (!appliedPromo) return 0;
    const subtotal = getSubtotal();
    if (appliedPromo.discount_type === "percentage") {
      return Math.round(subtotal * (appliedPromo.discount_value / 100));
    }
    return appliedPromo.discount_value;
  };

  const getTotal = () => {
    return Math.max(0, getSubtotal() - getDiscount());
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error("Please enter a promo code");
      return;
    }

    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", promoCode.toUpperCase())
      .eq("is_active", true)
      .single();

    if (error || !data) {
      toast.error("Invalid promo code");
      return;
    }

    // Check if expired
    if (data.valid_until && new Date(data.valid_until) < new Date()) {
      toast.error("This promo code has expired");
      return;
    }

    // Check min purchase
    if (data.min_purchase_amount && getSubtotal() < data.min_purchase_amount) {
      toast.error(`Minimum purchase of €${(data.min_purchase_amount / 100).toFixed(2)} required`);
      return;
    }

    // Check max uses
    if (data.max_uses && data.current_uses >= data.max_uses) {
      toast.error("This promo code has reached its usage limit");
      return;
    }

    setAppliedPromo(data as PromoCode);
    toast.success("Promo code applied!");
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoCode("");
  };

  // Create ad purchases (simplified - in real app would integrate with Stripe/PayPal)
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !company?.id) throw new Error("Not authenticated");

      const purchases = cart.map((item) => {
        const product = products?.find(p => p.id === item.productId);
        if (!product) throw new Error("Product not found");

        const startDate = new Date();
        const endDate = addDays(startDate, product.duration_days);
        const discount = appliedPromo ? getDiscount() / cart.length : 0;

        return {
          company_id: company.id,
          job_id: item.jobId,
          ad_product_id: item.productId,
          user_id: user.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: "active" as AdPurchaseStatus,
          amount_paid: product.price - discount,
          currency: product.currency,
          payment_method: "stripe" as PaymentMethod,
          promo_code_id: appliedPromo?.id || null,
          discount_applied: discount,
        };
      });

      const { error } = await supabase.from("ad_purchases").insert(purchases);
      if (error) throw error;

      // Update promo code usage if applied
      if (appliedPromo) {
        await supabase
          .from("promo_codes")
          .update({ current_uses: appliedPromo.discount_value + 1 })
          .eq("id", appliedPromo.id);
      }

      // Clear cart
      sessionStorage.removeItem("ad_cart");
    },
    onSuccess: () => {
      toast.success("Purchase successful! Your ads are now active.");
      navigate("/employer/ads");
    },
    onError: (error) => {
      toast.error("Purchase failed: " + error.message);
    },
  });

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      await checkoutMutation.mutateAsync();
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Your cart is empty</p>
              <Button onClick={() => navigate("/employer/ads")}>Browse Ad Products</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate("/employer/ads")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Ads
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Review your ad purchases</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map((item, index) => {
                  const product = products?.find(p => p.id === item.productId);
                  const job = jobs?.find(j => j.id === item.jobId);
                  const startDate = new Date();
                  const endDate = addDays(startDate, product?.duration_days || 7);

                  return (
                    <div key={index} className="flex items-start justify-between p-4 bg-muted rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{product?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {job?.title || "Company-wide promotion"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
                        </p>
                      </div>
                      <span className="font-medium">€{((product?.price || 0) / 100).toFixed(2)}</span>
                    </div>
                  );
                })}

                <Separator />

                {/* Promo Code */}
                <div className="space-y-2">
                  <Label htmlFor="promo">Promo Code</Label>
                  {appliedPromo ? (
                    <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" />
                        <span className="font-medium">{appliedPromo.code}</span>
                        <span className="text-sm text-muted-foreground">
                          -{appliedPromo.discount_type === "percentage" 
                            ? `${appliedPromo.discount_value}%` 
                            : `€${(appliedPromo.discount_value / 100).toFixed(2)}`}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={removePromoCode}>
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        id="promo"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                      />
                      <Button variant="outline" onClick={applyPromoCode}>
                        Apply
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>€{(getSubtotal() / 100).toFixed(2)}</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-€{(getDiscount() / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>€{(getTotal() / 100).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
                <CardDescription>Complete your purchase</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Demo mode notice */}
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    <strong>Demo Mode:</strong> This is a simplified checkout. 
                    In production, this would integrate with Stripe or PayPal for secure payment processing.
                  </p>
                </div>

                {/* Payment methods */}
                <div className="space-y-3">
                  <Label>Payment Method</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-20 flex-col gap-2" disabled>
                      <CreditCard className="h-6 w-6" />
                      <span>Credit Card</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2" disabled>
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.64.64 0 0 1 .632-.54h4.606l-3.106 18.156z"/>
                        <path d="M21.53 3.72a.64.64 0 0 0-.631-.54h-4.606l3.106 18.156h4.605a.641.641 0 0 0 .633-.74L21.53 3.72z"/>
                        <path d="M15.07 3.18h-6.14l-1.76 10.29h4.23l.84-4.93h3.47l.84 4.93h4.23z"/>
                      </svg>
                      <span>PayPal</span>
                    </Button>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Secure payment processing</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Instant ad activation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Receipt sent to your email</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Complete Purchase - €{(getTotal() / 100).toFixed(2)}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
