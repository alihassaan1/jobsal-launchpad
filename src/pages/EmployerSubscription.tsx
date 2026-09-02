import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Crown } from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  job_posts_limit: number;
  featured_jobs_limit: number;
  resume_views_limit: number;
  ats_access: boolean;
  priority_support: boolean;
  is_active: boolean;
  display_order: number;
}

export default function EmployerSubscription() {
  const { user, userRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current subscription
  const { data: currentSubscription } = useQuery({
    queryKey: ["current-subscription", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(
          `
          *,
          subscription_plans(*)
        `
        )
        .eq("user_id", user?.id)
        .eq("status", "active")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch all available plans
  const { data: plans = [] } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });

  // Fetch usage stats
  const { data: usage } = useQuery({
    queryKey: ["subscription-usage", user?.id],
    queryFn: async () => {
      const [companyData, jobsData] = await Promise.all([
        supabase.from("companies").select("id").eq("owner_id", user?.id).single(),
        supabase.from("jobs").select("id, is_active").eq("posted_by", user?.id),
      ]);

      const activeJobs = jobsData.data?.filter((j) => j.is_active).length || 0;

      return {
        activeJobs,
        totalJobs: jobsData.data?.length || 0,
      };
    },
    enabled: !!user?.id,
  });

  // Upgrade subscription mutation
  const upgradeMutation = useMutation({
    mutationFn: async (planId: string) => {
      // In a real app, this would redirect to Stripe checkout
      // For now, we'll just update the subscription in the database
      const selectedPlan = plans.find((p) => p.id === planId);
      if (!selectedPlan) throw new Error("Plan not found");

      if (currentSubscription) {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            plan_id: planId,
            tier: selectedPlan.slug as any,
            job_posts_limit: selectedPlan.job_posts_limit,
            featured_jobs_limit: selectedPlan.featured_jobs_limit,
            resume_views_limit: selectedPlan.resume_views_limit,
            ats_access: selectedPlan.ats_access,
            priority_support: selectedPlan.priority_support,
          })
          .eq("id", currentSubscription.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subscriptions").insert({
          user_id: user?.id,
          plan_id: planId,
          tier: selectedPlan.slug as any,
          status: "active",
          job_posts_limit: selectedPlan.job_posts_limit,
          featured_jobs_limit: selectedPlan.featured_jobs_limit,
          resume_views_limit: selectedPlan.resume_views_limit,
          ats_access: selectedPlan.ats_access,
          priority_support: selectedPlan.priority_support,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-subscription"] });
      toast({
        title: "Subscription updated",
        description: "Your plan has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (authLoading || (!!user && !userRole)) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!user) {
    return <Navigate to="/auth?type=employer" replace />;
  }

  if (userRole !== "employer" && userRole !== "admin") {
    return <Navigate to="/" replace />;
  }


  const currentPlan = currentSubscription?.subscription_plans as any;
  const jobLimit = currentSubscription?.job_posts_limit || 1;
  const usagePercent = usage ? (usage.activeJobs / (jobLimit === -1 ? 100 : jobLimit)) * 100 : 0;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subscription & Billing</h1>
        <p className="text-muted-foreground">Manage your membership and view usage</p>
      </div>

      {/* Current Plan & Usage */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your active subscription and usage limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  {currentPlan?.name || "Free"}
                  {currentPlan?.slug !== "free" && (
                    <Crown className="h-5 w-5 text-yellow-500" />
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">{currentPlan?.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {currentPlan?.price_monthly
                    ? `ALL ${(currentPlan.price_monthly / 100).toFixed(0)}`
                    : "Free"}
                </div>
                <div className="text-sm text-muted-foreground">per month</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Job Posts Used</span>
                <span className="font-medium">
                  {usage?.activeJobs || 0} / {jobLimit === -1 ? "Unlimited" : jobLimit}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
              {usagePercent >= 80 && usagePercent < 100 && (
                <p className="text-sm text-yellow-600">
                  You're approaching your job posting limit. Consider upgrading.
                </p>
              )}
              {usagePercent >= 100 && (
                <p className="text-sm text-destructive">
                  You've reached your job posting limit. Upgrade to post more jobs.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2">Available Plans</h2>
        <p className="text-muted-foreground">Choose the plan that fits your needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrent = currentPlan?.id === plan.id;
          const isUpgrade =
            plan.display_order > (currentPlan?.display_order || 0) || !currentPlan;

          return (
            <Card
              key={plan.id}
              className={isCurrent ? "border-primary shadow-lg" : ""}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{plan.name}</CardTitle>
                  {isCurrent && <Badge>Current</Badge>}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-3xl font-bold">
                    {plan.price_monthly === 0
                      ? "Free"
                      : `ALL ${(plan.price_monthly / 100).toFixed(0)}`}
                  </div>
                  <div className="text-sm text-muted-foreground">per month</div>
                  {plan.price_yearly > 0 && (
                    <div className="text-sm text-muted-foreground">
                      or ALL {(plan.price_yearly / 100).toFixed(0)}/year
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>
                      {plan.job_posts_limit === -1 ? "Unlimited" : plan.job_posts_limit} job posts
                    </span>
                  </div>
                  {plan.featured_jobs_limit > 0 && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>{plan.featured_jobs_limit} featured jobs</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>
                      {plan.resume_views_limit === -1
                        ? "Unlimited"
                        : plan.resume_views_limit}{" "}
                      resume views
                    </span>
                  </div>
                  {plan.ats_access && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>ATS Access</span>
                    </div>
                  )}
                  {plan.priority_support && (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Priority Support</span>
                    </div>
                  )}
                </div>

                {!isCurrent && (
                  <Button
                    className="w-full"
                    variant={isUpgrade ? "default" : "outline"}
                    onClick={() => upgradeMutation.mutate(plan.id)}
                    disabled={upgradeMutation.isPending}
                  >
                    {isUpgrade ? "Upgrade" : "Downgrade"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Stripe Notice */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Note: Payment processing via Stripe will be enabled once configured by the admin.
            Contact support for assistance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
