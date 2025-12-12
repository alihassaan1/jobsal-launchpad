import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Ticket, Users, TrendingUp } from "lucide-react";
import { format } from "date-fns";

type DiscountType = "percentage" | "fixed";

type PromoCode = {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  min_purchase_amount: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
};

export default function AdminPromoCodes() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [form, setForm] = useState({
    code: "",
    description: "",
    discount_type: "percentage" as DiscountType,
    discount_value: 10,
    max_uses: "",
    min_purchase_amount: 0,
    valid_from: new Date().toISOString().split("T")[0],
    valid_until: "",
    is_active: true,
  });

  const { data: promoCodes, isLoading } = useQuery({
    queryKey: ["admin-promo-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PromoCode[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["promo-code-stats"],
    queryFn: async () => {
      const [totalRes, activeRes] = await Promise.all([
        supabase.from("promo_codes").select("id", { count: "exact" }),
        supabase.from("promo_codes").select("id", { count: "exact" }).eq("is_active", true),
      ]);
      const totalUses = promoCodes?.reduce((sum, p) => sum + (p.current_uses || 0), 0) || 0;
      return {
        total: totalRes.count || 0,
        active: activeRes.count || 0,
        totalUses,
      };
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string }) => {
      const payload = {
        code: data.code.toUpperCase(),
        description: data.description || null,
        discount_type: data.discount_type as DiscountType,
        discount_value: data.discount_value,
        max_uses: data.max_uses ? parseInt(data.max_uses) : null,
        min_purchase_amount: data.min_purchase_amount,
        valid_from: data.valid_from,
        valid_until: data.valid_until || null,
        is_active: data.is_active,
      };

      if (data.id) {
        const { error } = await supabase.from("promo_codes").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("promo_codes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
      queryClient.invalidateQueries({ queryKey: ["promo-code-stats"] });
      setIsDialogOpen(false);
      setEditingCode(null);
      resetForm();
      toast.success(editingCode ? "Promo code updated" : "Promo code created");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promo_codes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
      queryClient.invalidateQueries({ queryKey: ["promo-code-stats"] });
      toast.success("Promo code deleted");
    },
  });

  const resetForm = () => {
    setForm({
      code: "",
      description: "",
      discount_type: "percentage" as DiscountType,
      discount_value: 10,
      max_uses: "",
      min_purchase_amount: 0,
      valid_from: new Date().toISOString().split("T")[0],
      valid_until: "",
      is_active: true,
    });
  };

  const handleEdit = (code: PromoCode) => {
    setEditingCode(code);
    setForm({
      code: code.code,
      description: code.description || "",
      discount_type: code.discount_type as DiscountType,
      discount_value: code.discount_value,
      max_uses: code.max_uses?.toString() || "",
      min_purchase_amount: code.min_purchase_amount,
      valid_from: code.valid_from.split("T")[0],
      valid_until: code.valid_until?.split("T")[0] || "",
      is_active: code.is_active,
    });
    setIsDialogOpen(true);
  };

  const isExpired = (code: PromoCode) => {
    if (!code.valid_until) return false;
    return new Date(code.valid_until) < new Date();
  };

  const isMaxedOut = (code: PromoCode) => {
    if (!code.max_uses) return false;
    return code.current_uses >= code.max_uses;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Promo Codes</h1>
      </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Codes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.active || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Uses</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUses || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Add Button */}
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingCode(null); }}>
                <Plus className="mr-2 h-4 w-4" /> Add Promo Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCode ? "Edit Promo Code" : "New Promo Code"}</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  mutation.mutate({ ...form, id: editingCode?.id });
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Code</Label>
                    <Input
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      placeholder="SUMMER2024"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Discount Type</Label>
                    <Select
                      value={form.discount_type}
                      onValueChange={(v) => setForm({ ...form, discount_type: v as DiscountType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Summer promotion discount"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Discount Value</Label>
                    <Input
                      type="number"
                      value={form.discount_value}
                      onChange={(e) => setForm({ ...form, discount_value: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Uses (empty = unlimited)</Label>
                    <Input
                      type="number"
                      value={form.max_uses}
                      onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valid From</Label>
                    <Input
                      type="date"
                      value={form.valid_from}
                      onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valid Until (empty = no expiry)</Label>
                    <Input
                      type="date"
                      value={form.valid_until}
                      onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Min Purchase Amount (cents)</Label>
                  <Input
                    type="number"
                    value={form.min_purchase_amount}
                    onChange={(e) => setForm({ ...form, min_purchase_amount: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {editingCode ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Valid Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : promoCodes?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No promo codes found</TableCell>
                </TableRow>
              ) : (
                promoCodes?.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono font-bold">{code.code}</TableCell>
                    <TableCell>
                      {code.discount_type === "percentage" 
                        ? `${code.discount_value}%` 
                        : `€${(code.discount_value / 100).toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      {code.current_uses}{code.max_uses ? ` / ${code.max_uses}` : ""}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(code.valid_from), "MMM d, yyyy")}
                      {code.valid_until && ` - ${format(new Date(code.valid_until), "MMM d, yyyy")}`}
                    </TableCell>
                    <TableCell>
                      {isExpired(code) ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : isMaxedOut(code) ? (
                        <Badge variant="secondary">Maxed Out</Badge>
                      ) : code.is_active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(code)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(code.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
  );
}
