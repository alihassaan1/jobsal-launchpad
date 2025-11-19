import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Key, DollarSign, Users } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

interface AdminSetting {
  id: string;
  key: string;
  value: string | null;
  description: string;
  is_encrypted: boolean;
}

export default function AdminSubscriptions() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch subscription plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["admin-subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });

  // Fetch admin settings
  const { data: settings = [], isLoading: settingsLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .in("key", ["stripe_secret_key", "stripe_publishable_key", "stripe_webhook_secret"]);
      if (error) throw error;
      return data as AdminSetting[];
    },
  });

  // Fetch revenue stats
  const { data: revenueStats } = useQuery({
    queryKey: ["revenue-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("tier, status")
        .eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("admin_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast({ title: "Setting updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update setting", variant: "destructive" });
    },
  });

  // Save plan mutation
  const savePlanMutation = useMutation({
    mutationFn: async (plan: Partial<SubscriptionPlan>) => {
      if (plan.id) {
        const { error } = await supabase
          .from("subscription_plans")
          .update(plan as any)
          .eq("id", plan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subscription_plans").insert([plan as any]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscription-plans"] });
      toast({ title: "Plan saved successfully" });
      setIsDialogOpen(false);
      setEditingPlan(null);
    },
    onError: () => {
      toast({ title: "Failed to save plan", variant: "destructive" });
    },
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("subscription_plans")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscription-plans"] });
      toast({ title: "Plan deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete plan", variant: "destructive" });
    },
  });

  if (userRole !== "admin") {
    return <Navigate to="/" replace />;
  }

  const activeSubscribers = revenueStats?.length || 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscription Management</h1>
        <p className="text-muted-foreground">Manage pricing plans and payment settings</p>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscribers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Stripe Configuration */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Payment Gateway Configuration
          </CardTitle>
          <CardDescription>Configure Stripe API keys for payment processing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settingsLoading ? (
            <p>Loading settings...</p>
          ) : (
            settings.map((setting) => (
              <div key={setting.id} className="space-y-2">
                <Label htmlFor={setting.key}>{setting.description}</Label>
                <div className="flex gap-2">
                  <Input
                    id={setting.key}
                    type={setting.is_encrypted ? "password" : "text"}
                    defaultValue={setting.value || ""}
                    placeholder={`Enter ${setting.description}`}
                  />
                  <Button
                    onClick={() => {
                      const input = document.getElementById(setting.key) as HTMLInputElement;
                      updateSettingMutation.mutate({
                        key: setting.key,
                        value: input.value,
                      });
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Subscription Plans */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>Manage membership tiers and pricing</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingPlan(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPlan ? "Edit Plan" : "Create New Plan"}
                  </DialogTitle>
                </DialogHeader>
                <PlanForm
                  plan={editingPlan}
                  onSave={(plan) => savePlanMutation.mutate(plan)}
                  onCancel={() => {
                    setIsDialogOpen(false);
                    setEditingPlan(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {plansLoading ? (
            <p>Loading plans...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Monthly</TableHead>
                  <TableHead>Yearly</TableHead>
                  <TableHead>Job Posts</TableHead>
                  <TableHead>ATS</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>
                      {plan.price_monthly === 0
                        ? "Free"
                        : `ALL ${(plan.price_monthly / 100).toFixed(0)}`}
                    </TableCell>
                    <TableCell>
                      {plan.price_yearly === 0
                        ? "Free"
                        : `ALL ${(plan.price_yearly / 100).toFixed(0)}`}
                    </TableCell>
                    <TableCell>
                      {plan.job_posts_limit === -1 ? "Unlimited" : plan.job_posts_limit}
                    </TableCell>
                    <TableCell>{plan.ats_access ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          plan.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {plan.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingPlan(plan);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this plan?")) {
                            deletePlanMutation.mutate(plan.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PlanForm({
  plan,
  onSave,
  onCancel,
}: {
  plan: SubscriptionPlan | null;
  onSave: (plan: Partial<SubscriptionPlan>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<SubscriptionPlan>>(
    plan || {
      name: "",
      slug: "",
      description: "",
      price_monthly: 0,
      price_yearly: 0,
      job_posts_limit: 1,
      featured_jobs_limit: 0,
      resume_views_limit: 10,
      ats_access: false,
      priority_support: false,
      is_active: true,
      display_order: 0,
    }
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(formData);
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Plan Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price_monthly">Monthly Price (in cents)</Label>
          <Input
            id="price_monthly"
            type="number"
            value={formData.price_monthly}
            onChange={(e) =>
              setFormData({ ...formData, price_monthly: parseInt(e.target.value) })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price_yearly">Yearly Price (in cents)</Label>
          <Input
            id="price_yearly"
            type="number"
            value={formData.price_yearly}
            onChange={(e) =>
              setFormData({ ...formData, price_yearly: parseInt(e.target.value) })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="job_posts_limit">Job Posts Limit (-1 = unlimited)</Label>
          <Input
            id="job_posts_limit"
            type="number"
            value={formData.job_posts_limit}
            onChange={(e) =>
              setFormData({ ...formData, job_posts_limit: parseInt(e.target.value) })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="featured_jobs_limit">Featured Jobs Limit</Label>
          <Input
            id="featured_jobs_limit"
            type="number"
            value={formData.featured_jobs_limit}
            onChange={(e) =>
              setFormData({ ...formData, featured_jobs_limit: parseInt(e.target.value) })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="resume_views_limit">Resume Views Limit</Label>
          <Input
            id="resume_views_limit"
            type="number"
            value={formData.resume_views_limit}
            onChange={(e) =>
              setFormData({ ...formData, resume_views_limit: parseInt(e.target.value) })
            }
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="ats_access"
            checked={formData.ats_access}
            onCheckedChange={(checked) => setFormData({ ...formData, ats_access: checked })}
          />
          <Label htmlFor="ats_access">ATS Access</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="priority_support"
            checked={formData.priority_support}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, priority_support: checked })
            }
          />
          <Label htmlFor="priority_support">Priority Support</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Active</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Plan</Button>
      </div>
    </form>
  );
}
