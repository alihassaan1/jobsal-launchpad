import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Check, Star, Users, BarChart, Building2, Headphones } from "lucide-react";
import { useState } from "react";

export default function Pricing() {
  const { user, userRole } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  // Fetch pricing plans
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["pricing-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  // Fetch current subscription if user is logged in
  const { data: currentSubscription } = useQuery({
    queryKey: ["current-subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, subscription_plans(*)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user,
  });

  const getSupportIcon = (level: string) => {
    switch (level) {
      case "dedicated":
        return <Headphones className="h-4 w-4" />;
      case "chat_email":
        return <Users className="h-4 w-4" />;
      case "priority_email":
        return <BarChart className="h-4 w-4" />;
      default:
        return <Check className="h-4 w-4" />;
    }
  };

  const getSupportLabel = (level: string) => {
    switch (level) {
      case "dedicated":
        return "Dedicated Support";
      case "chat_email":
        return "Chat + Email";
      case "priority_email":
        return "Priority Email";
      default:
        return "Email Only";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Jobs.al</span>
          </Link>
          <div className="flex gap-2">
            <Link to="/jobs">
              <Button variant="ghost">Browse Jobs</Button>
            </Link>
            {user ? (
              <Link to={userRole === "employer" ? "/dashboard" : "/my-applications"}>
                <Button variant="outline">Dashboard</Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose the Right Plan for You
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Whether you're hiring your first employee or building a team, we have a plan that fits your needs.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-2 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-md transition-colors ${
                billingCycle === "monthly"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-md transition-colors ${
                billingCycle === "yearly"
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              }`}
            >
              Yearly
              <Badge variant="secondary" className="ml-2 text-xs">
                Save 17%
              </Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-8 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-full" />
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan: any) => {
              const isCurrentPlan = currentSubscription?.subscription_plans?.id === plan.id;
              const price = billingCycle === "monthly" ? plan.price_monthly : plan.price_yearly;
              const displayPrice = price === 0 ? "Free" : `€${(price / 100).toFixed(2)}`;
              const priceLabel = plan.slug === "enterprise" ? "Custom" : displayPrice;

              return (
                <Card
                  key={plan.id}
                  className={`relative ${
                    plan.is_popular
                      ? "border-primary shadow-lg scale-105"
                      : ""
                  } ${isCurrentPlan ? "ring-2 ring-primary" : ""}`}
                >
                  {plan.is_popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground shadow-md">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-4 right-4">
                      <Badge variant="secondary">Current Plan</Badge>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="min-h-12">
                      {plan.description}
                    </CardDescription>
                    <div className="mt-4">
                      <div className="text-4xl font-bold">
                        {priceLabel}
                        {price > 0 && (
                          <span className="text-base font-normal text-muted-foreground">
                            /{billingCycle === "monthly" ? "mo" : "yr"}
                          </span>
                        )}
                      </div>
                      {billingCycle === "yearly" && price > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          €{((price / 100) / 12).toFixed(2)}/month billed annually
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>
                            {plan.job_posts_limit === -1
                              ? "Unlimited"
                              : plan.job_posts_limit}
                          </strong>{" "}
                          job posts
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>
                            {plan.resume_views_limit === -1
                              ? "Unlimited"
                              : plan.resume_views_limit}
                          </strong>{" "}
                          resume views
                        </span>
                      </li>
                      {plan.featured_jobs_limit > 0 && (
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>
                            <strong>
                              {plan.featured_jobs_limit === -1
                                ? "Unlimited"
                                : plan.featured_jobs_limit}
                            </strong>{" "}
                            featured job slots
                          </span>
                        </li>
                      )}
                      {plan.ai_access && (
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>AI-powered matching</span>
                        </li>
                      )}
                      {plan.ats_access && (
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>ATS (Applicant Tracking)</span>
                        </li>
                      )}
                      {plan.company_page && (
                        <li className="flex items-start gap-2">
                          <Building2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>Custom company page</span>
                        </li>
                      )}
                      {plan.analytics_enabled && (
                        <li className="flex items-start gap-2">
                          <BarChart className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>Analytics dashboard</span>
                        </li>
                      )}
                      <li className="flex items-start gap-2">
                        {getSupportIcon(plan.support_level)}
                        <span>{getSupportLabel(plan.support_level)}</span>
                      </li>
                    </ul>

                    {isCurrentPlan ? (
                      <Button className="w-full" variant="outline" disabled>
                        Current Plan
                      </Button>
                    ) : plan.slug === "enterprise" ? (
                      <Button className="w-full" variant={plan.is_popular ? "default" : "outline"}>
                        Contact Sales
                      </Button>
                    ) : user && userRole === "employer" ? (
                      <Link to="/employer/subscription">
                        <Button className="w-full" variant={plan.is_popular ? "default" : "outline"}>
                          Subscribe Now
                        </Button>
                      </Link>
                    ) : (
                      <Link to="/auth">
                        <Button className="w-full" variant={plan.is_popular ? "default" : "outline"}>
                          Get Started
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Comparison Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">Compare Plans</h2>
          <Card>
            <CardContent className="p-6 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-4">Features</th>
                    {plans.map((plan: any) => (
                      <th key={plan.id} className="text-center py-4 px-4">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-4">Job Posts</td>
                    {plans.map((plan: any) => (
                      <td key={plan.id} className="text-center py-3 px-4">
                        {plan.job_posts_limit === -1 ? "Unlimited" : plan.job_posts_limit}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Resume Views</td>
                    {plans.map((plan: any) => (
                      <td key={plan.id} className="text-center py-3 px-4">
                        {plan.resume_views_limit === -1 ? "Unlimited" : plan.resume_views_limit}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">AI Matching</td>
                    {plans.map((plan: any) => (
                      <td key={plan.id} className="text-center py-3 px-4">
                        {plan.ai_access ? <Check className="h-5 w-5 text-green-600 mx-auto" /> : "-"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">ATS Access</td>
                    {plans.map((plan: any) => (
                      <td key={plan.id} className="text-center py-3 px-4">
                        {plan.ats_access ? <Check className="h-5 w-5 text-green-600 mx-auto" /> : "-"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Analytics</td>
                    {plans.map((plan: any) => (
                      <td key={plan.id} className="text-center py-3 px-4">
                        {plan.analytics_enabled ? <Check className="h-5 w-5 text-green-600 mx-auto" /> : "-"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change my plan later?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time from your dashboard.
                  Changes take effect immediately.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We accept all major credit cards and PayPal. Payment processing is secured through Stripe.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a contract or commitment?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No! All plans are month-to-month with no long-term contracts. Cancel anytime.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
