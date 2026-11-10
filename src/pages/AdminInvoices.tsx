import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { INVOICE_SELLER, reverseChargeNote } from "@/lib/invoiceRules";
import { 
  FileText, Search, Download, Plus, Eye, Send, 
  RefreshCcw, Ban, DollarSign, Calendar, Building,
  FileSpreadsheet, MoreHorizontal, Mail
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Invoice = {
  id: string;
  invoice_number: string;
  company_id: string | null;
  user_id: string | null;
  status: string;
  issue_date: string;
  due_date: string | null;
  paid_date: string | null;
  subtotal: number;
  tax_rate: number;
  billing_address: string | null;
  tax_amount: number;
  discount_amount: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  billing_name: string | null;
  billing_email: string | null;
  billing_city: string | null;
  billing_country: string | null;
  tax_id: string | null;
  reference: string | null;
  payment_link: string | null;
  source_type: string | null;
  created_at: string;
  companies?: { name: string; slug: string } | null;
};

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-yellow-500/20 text-yellow-600",
  sent: "bg-blue-500/20 text-blue-600",
  paid: "bg-green-500/20 text-green-600",
  partially_paid: "bg-orange-500/20 text-orange-600",
  overdue: "bg-red-500/20 text-red-600",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-purple-500/20 text-purple-600",
  void: "bg-muted text-muted-foreground line-through",
};


const safeFormat = (value: string | Date | null | undefined, fmt: string) => {
  if (!value) return "-";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "-" : format(d, fmt);
};

const downloadInvoicePdf = async (invoiceId: string) => {
  const win = window.open("", "_blank");
  const { data, error } = await supabase.functions.invoke("generate-invoice-pdf", { body: { invoiceId } });
  if (error || !data?.html) { win?.close(); toast.error("Could not generate invoice PDF"); return; }
  if (!win) { toast.error("Allow pop-ups to download the invoice"); return; }
  win.document.write(data.html);
  win.document.close();
  win.onload = () => win.print();
  setTimeout(() => win.print(), 600);
};

export default function AdminInvoices() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Form state for new invoice
  const [newInvoice, setNewInvoice] = useState({
    billing_name: "",
    billing_email: "",
    billing_address: "",
    tax_id: "",
    reference: "",
    notes: "",
    items: [{ description: "", quantity: 1, unit_price: 0 }],
  });

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["admin-invoices", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("invoices")
        .select(`*, companies!invoices_company_id_fkey(name, slug)`)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Invoice[];
    },
  });

  const { data: invoiceItems } = useQuery({
    queryKey: ["invoice-items", selectedInvoice?.id],
    queryFn: async () => {
      if (!selectedInvoice) return [];
      const { data, error } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", selectedInvoice.id)
        .order("sort_order");
      if (error) throw error;
      return data as InvoiceItem[];
    },
    enabled: !!selectedInvoice,
  });

  const { data: stats } = useQuery({
    queryKey: ["invoice-stats"],
    queryFn: async () => {
      let { data, error } = await supabase.from("invoices").select("status, total, amount_paid");
      if (error) throw error;

      data = data ?? [];
      const total = data.length;
      const paid = data.filter(i => i.status === "paid").length;
      const pending = data.filter(i => ["pending", "sent"].includes(i.status)).length;
      const overdue = data.filter(i => i.status === "overdue").length;
      const totalRevenue = data.filter(i => i.status === "paid").reduce((sum, i) => sum + i.total, 0);
      const outstanding = data.filter(i => ["pending", "sent", "overdue", "partially_paid"].includes(i.status))
        .reduce((sum, i) => sum + (i.total - i.amount_paid), 0);

      return { total, paid, pending, overdue, totalRevenue, outstanding };
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const subtotal = newInvoice.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
      const taxRate = 20;
      const taxAmount = Math.round(subtotal * taxRate / 100);
      const total = subtotal + taxAmount;

      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert([{
          invoice_number: "", // Auto-generated by trigger
          billing_name: newInvoice.billing_name,
          billing_email: newInvoice.billing_email,
          billing_address: newInvoice.billing_address,
          tax_id: newInvoice.tax_id || null,
          reference: newInvoice.reference || null,
          notes: newInvoice.notes,
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total,
          status: "draft",
          source_type: "manual",
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Insert items
      const items = newInvoice.items.map((item, index) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: taxRate,
        tax_amount: Math.round(item.quantity * item.unit_price * taxRate / 100),
        total: item.quantity * item.unit_price + Math.round(item.quantity * item.unit_price * taxRate / 100),
        sort_order: index,
      }));

      const { error: itemsError } = await supabase.from("invoice_items").insert(items);
      if (itemsError) throw itemsError;

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
      toast.success("Invoice created successfully");
      setIsCreateOpen(false);
      setNewInvoice({ billing_name: "", billing_email: "", billing_address: "", tax_id: "", reference: "", notes: "", items: [{ description: "", quantity: 1, unit_price: 0 }] });
    },
    onError: (error) => toast.error("Failed to create invoice: " + error.message),
  });

  const [details, setDetails] = useState({ due_date: "", tax_id: "", billing_address: "", billing_city: "", billing_country: "", reference: "" });
  const openInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setDetails({
      due_date: inv.due_date ? inv.due_date.slice(0, 10) : "",
      tax_id: inv.tax_id ?? "",
      billing_address: inv.billing_address ?? "",
      billing_city: inv.billing_city ?? "",
      billing_country: inv.billing_country ?? "",
      reference: inv.reference ?? "",
    });
    setIsViewOpen(true);
  };
  const saveDetailsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedInvoice) return;
      const updates = {
        due_date: details.due_date ? new Date(details.due_date + "T12:00:00Z").toISOString() : null,
        tax_id: details.tax_id.trim() || null,
        billing_address: details.billing_address.trim() || null,
        billing_city: details.billing_city.trim() || null,
        billing_country: details.billing_country.trim() || null,
        reference: details.reference.trim() || null,
      };
      const { error } = await supabase.from("invoices").update(updates).eq("id", selectedInvoice.id);
      if (error) throw error;
      setSelectedInvoice({ ...selectedInvoice, ...updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
      toast.success("Invoice details saved");
    },
    onError: (error) => toast.error("Failed to save: " + error.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, paid_date }: { id: string; status: string; paid_date?: string }) => {
      const updates: Record<string, unknown> = { status };
      if (paid_date) updates.paid_date = paid_date;
      if (status === "paid") updates.amount_paid = selectedInvoice?.total;

      const { error } = await supabase.from("invoices").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
      toast.success("Invoice status updated");
    },
    onError: (error) => toast.error("Failed to update: " + error.message),
  });

  const sendInvoiceMutation = useMutation({
    mutationFn: async (invoice: Invoice) => {
      const { error } = await supabase.functions.invoke("send-email", {
        body: {
          to: invoice.billing_email,
          templateSlug: "invoice-created",
          data: {
            invoiceNumber: invoice.invoice_number,
            amount: (invoice.total / 100).toFixed(2),
            currency: invoice.currency,
            dueDate: invoice.due_date ? safeFormat((invoice.due_date), "PPP") : "N/A",
          },
        },
      });
      if (error) throw error;

      await supabase.from("invoices").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", invoice.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
      toast.success("Invoice sent successfully");
    },
    onError: (error) => toast.error("Failed to send: " + error.message),
  });

  const exportToCSV = () => {
    if (!invoices?.length) return;

    const headers = ["Invoice #", "Customer", "Email", "Status", "Issue Date", "Due Date", "Subtotal", "Tax", "Total", "Paid", "Outstanding"];
    const rows = invoices.map(inv => [
      inv.invoice_number,
      inv.billing_name || inv.companies?.name || "",
      inv.billing_email || "",
      inv.status,
      safeFormat((inv.issue_date), "yyyy-MM-dd"),
      inv.due_date ? safeFormat((inv.due_date), "yyyy-MM-dd") : "",
      (inv.subtotal / 100).toFixed(2),
      (inv.tax_amount / 100).toFixed(2),
      (inv.total / 100).toFixed(2),
      (inv.amount_paid / 100).toFixed(2),
      (inv.amount_due / 100).toFixed(2),
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-${safeFormat(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  const filteredInvoices = invoices?.filter(inv => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.invoice_number.toLowerCase().includes(q) ||
      inv.billing_name?.toLowerCase().includes(q) ||
      inv.billing_email?.toLowerCase().includes(q) ||
      inv.companies?.name?.toLowerCase().includes(q)
    );
  });

  const addItem = () => {
    setNewInvoice(prev => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, unit_price: 0 }],
    }));
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const removeItem = (index: number) => {
    if (newInvoice.items.length === 1) return;
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoice Management</h1>
          <p className="text-muted-foreground">Manage invoices, track payments, and send reminders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer Name</Label>
                    <Input
                      value={newInvoice.billing_name}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, billing_name: e.target.value }))}
                      placeholder="Company or person name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newInvoice.billing_email}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, billing_email: e.target.value }))}
                      placeholder="billing@example.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tax ID (NUIS)</Label>
                    <Input value={newInvoice.tax_id} onChange={(e) => setNewInvoice(prev => ({ ...prev, tax_id: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Reference</Label>
                    <Input value={newInvoice.reference} onChange={(e) => setNewInvoice(prev => ({ ...prev, reference: e.target.value }))} placeholder="e.g. Contract number" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Billing Address</Label>
                  <Textarea
                    value={newInvoice.billing_address}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, billing_address: e.target.value }))}
                    placeholder="Full billing address"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Line Items</Label>
                    <Button variant="outline" size="sm" onClick={addItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {newInvoice.items.map((item, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateItem(index, "description", e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                          className="w-20"
                        />
                        <Input
                          type="number"
                          placeholder="Price (€)"
                          value={item.unit_price / 100 || ""}
                          onChange={(e) => updateItem(index, "unit_price", Math.round(parseFloat(e.target.value) * 100) || 0)}
                          className="w-28"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          disabled={newInvoice.items.length === 1}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    Subtotal: €{(newInvoice.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0) / 100).toFixed(2)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={newInvoice.notes}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes"
                    rows={2}
                  />
                </div>
                <Button onClick={() => createInvoiceMutation.mutate()} disabled={createInvoiceMutation.isPending} className="w-full">
                  {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold">{stats?.total || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Paid</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats?.paid || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <RefreshCcw className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Overdue</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats?.overdue || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Revenue</span>
            </div>
            <p className="text-2xl font-bold">€{((stats?.totalRevenue || 0) / 100).toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">Outstanding</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">€{((stats?.outstanding || 0) / 100).toFixed(0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partially_paid">Partially Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="void">Void</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading invoices...</p>
          ) : filteredInvoices?.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No invoices found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices?.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{invoice.billing_name || invoice.companies?.name || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">{invoice.billing_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[invoice.status]}>
                        {invoice.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{safeFormat((invoice.issue_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      {invoice.due_date ? safeFormat((invoice.due_date), "MMM d, yyyy") : "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      €{(invoice.total / 100).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.amount_due > 0 ? (
                        <span className="text-orange-600">€{(invoice.amount_due / 100).toFixed(2)}</span>
                      ) : (
                        <span className="text-green-600">€0.00</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openInvoice(invoice)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {invoice.billing_email && invoice.status === "draft" && (
                            <DropdownMenuItem onClick={() => sendInvoiceMutation.mutate(invoice)}>
                              <Send className="h-4 w-4 mr-2" />
                              Send Invoice
                            </DropdownMenuItem>
                          )}
                          {invoice.billing_email && ["sent", "overdue"].includes(invoice.status) && (
                            <DropdownMenuItem onClick={() => sendInvoiceMutation.mutate(invoice)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Reminder
                            </DropdownMenuItem>
                          )}
                          {["pending", "sent", "overdue", "partially_paid"].includes(invoice.status) && (
                            <DropdownMenuItem onClick={() => {
                              setSelectedInvoice(invoice);
                              updateStatusMutation.mutate({ id: invoice.id, status: "paid", paid_date: new Date().toISOString() });
                            }}>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Mark as Paid
                            </DropdownMenuItem>
                          )}
                          {invoice.status !== "void" && invoice.status !== "paid" && (
                            <DropdownMenuItem 
                              onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: "void" })}
                              className="text-destructive"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Void Invoice
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Invoice Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice {selectedInvoice?.invoice_number}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="flex justify-between gap-4">
                <div className="text-sm">
                  <p className="text-xs uppercase text-muted-foreground mb-1">From</p>
                  <p className="font-medium">{INVOICE_SELLER.name}</p>
                  <p className="text-muted-foreground">{INVOICE_SELLER.tagline}</p>
                  {INVOICE_SELLER.address.map((l) => <p key={l} className="text-muted-foreground">{l}</p>)}
                  <p className="text-muted-foreground">{INVOICE_SELLER.email}</p>
                </div>
                <div className="text-sm">
                  <p className="text-xs uppercase text-muted-foreground mb-1">Bill to</p>
                  <p className="font-medium">{selectedInvoice.billing_name}</p>
                  {selectedInvoice.tax_id && <p className="text-muted-foreground">NUIS: {selectedInvoice.tax_id}</p>}
                  {selectedInvoice.billing_address && <p className="text-muted-foreground">{selectedInvoice.billing_address}</p>}
                  {(selectedInvoice.billing_city || selectedInvoice.billing_country) && (
                    <p className="text-muted-foreground">{[selectedInvoice.billing_city, selectedInvoice.billing_country].filter(Boolean).join(", ")}</p>
                  )}
                  <p className="text-muted-foreground">{selectedInvoice.billing_email}</p>
                </div>
                <div className="text-right">
                  <Badge className={statusColors[selectedInvoice.status]}>
                    {selectedInvoice.status.replace("_", " ")}
                  </Badge>
                  {selectedInvoice.reference && (
                    <p className="text-sm text-muted-foreground mt-2">Reference: {selectedInvoice.reference}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    Issued: {safeFormat((selectedInvoice.issue_date), "PPP")}
                  </p>
                  {selectedInvoice.due_date && (
                    <p className="text-sm text-muted-foreground">
                      Due: {safeFormat((selectedInvoice.due_date), "PPP")}
                    </p>
                  )}
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceItems?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">€{(item.unit_price / 100).toFixed(2)}</TableCell>
                      <TableCell className="text-right">€{(item.total / 100).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="border-t pt-4 space-y-1 text-right">
                <p>Subtotal: €{(selectedInvoice.subtotal / 100).toFixed(2)}</p>
                <p>Tax ({selectedInvoice.tax_rate}%): €{(selectedInvoice.tax_amount / 100).toFixed(2)}</p>
                {selectedInvoice.discount_amount > 0 && (
                  <p className="text-green-600">Discount: -€{(selectedInvoice.discount_amount / 100).toFixed(2)}</p>
                )}
                <p className="text-lg font-bold">Total: €{(selectedInvoice.total / 100).toFixed(2)}</p>
                {selectedInvoice.amount_paid > 0 && (
                  <>
                    <p className="text-green-600">Paid: €{(selectedInvoice.amount_paid / 100).toFixed(2)}</p>
                    <p className="font-medium">Balance Due: €{(selectedInvoice.amount_due / 100).toFixed(2)}</p>
                  </>
                )}
              </div>

              {reverseChargeNote(selectedInvoice.tax_rate, selectedInvoice.tax_id) && (
                <p className="text-sm">{reverseChargeNote(selectedInvoice.tax_rate, selectedInvoice.tax_id)}</p>
              )}
              {selectedInvoice.payment_link && !["paid", "void", "cancelled"].includes(selectedInvoice.status) && (
                <p className="text-sm break-all">
                  Pay online: <a className="text-primary underline" href={selectedInvoice.payment_link} target="_blank" rel="noreferrer">{selectedInvoice.payment_link}</a>
                </p>
              )}

              <div className="border-t pt-4 space-y-3">
                <p className="font-medium text-sm">Edit details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Due date</Label><Input type="date" value={details.due_date} onChange={(e) => setDetails(d => ({ ...d, due_date: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Reference</Label><Input value={details.reference} onChange={(e) => setDetails(d => ({ ...d, reference: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Tax ID (NUIS)</Label><Input value={details.tax_id} onChange={(e) => setDetails(d => ({ ...d, tax_id: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Address</Label><Input value={details.billing_address} onChange={(e) => setDetails(d => ({ ...d, billing_address: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>City</Label><Input value={details.billing_city} onChange={(e) => setDetails(d => ({ ...d, billing_city: e.target.value }))} /></div>
                  <div className="space-y-1"><Label>Country</Label><Input value={details.billing_country} onChange={(e) => setDetails(d => ({ ...d, billing_country: e.target.value }))} /></div>
                </div>
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => saveDetailsMutation.mutate()} disabled={saveDetailsMutation.isPending}>Save details</Button>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                  Close
                </Button>
                <Button variant="outline" onClick={() => downloadInvoicePdf(selectedInvoice.id)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}