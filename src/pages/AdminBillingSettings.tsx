import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Settings, Save, Building, CreditCard, FileText, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type BillingSetting = {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
};

export default function AdminBillingSettings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: billingSettings, isLoading } = useQuery({
    queryKey: ["billing-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billing_settings")
        .select("*")
        .order("key");
      if (error) throw error;
      
      const settingsMap: Record<string, string> = {};
      data.forEach((s: BillingSetting) => {
        settingsMap[s.key] = s.value || "";
      });
      setSettings(settingsMap);
      return data as BillingSetting[];
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("billing_settings")
          .update({ value: update.value, updated_at: update.updated_at })
          .eq("key", update.key);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-settings"] });
      toast.success("Settings saved successfully");
      setHasChanges(false);
    },
    onError: (error) => toast.error("Failed to save: " + error.message),
  });

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const SettingField = ({ 
    settingKey, 
    label, 
    type = "text",
    placeholder,
    description,
  }: { 
    settingKey: string; 
    label: string; 
    type?: string;
    placeholder?: string;
    description?: string;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={settingKey}>{label}</Label>
      <Input
        id={settingKey}
        type={type}
        value={settings[settingKey] || ""}
        onChange={(e) => handleChange(settingKey, e.target.value)}
        placeholder={placeholder}
      />
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Billing Settings</h1>
          <p className="text-muted-foreground">Configure invoicing, tax rates, and payment settings</p>
        </div>
        <Button 
          onClick={() => updateSettingsMutation.mutate()} 
          disabled={!hasChanges || updateSettingsMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company">
            <Building className="h-4 w-4 mr-2" />
            Company Info
          </TabsTrigger>
          <TabsTrigger value="invoicing">
            <FileText className="h-4 w-4 mr-2" />
            Invoicing
          </TabsTrigger>
          <TabsTrigger value="banking">
            <CreditCard className="h-4 w-4 mr-2" />
            Banking
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Mail className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                This information appears on all invoices and receipts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingField 
                  settingKey="company_name" 
                  label="Company Name" 
                  placeholder="Jobs.al"
                />
                <SettingField 
                  settingKey="company_email" 
                  label="Billing Email" 
                  type="email"
                  placeholder="billing@jobs.al"
                />
                <SettingField 
                  settingKey="company_phone" 
                  label="Phone Number" 
                  placeholder="+355 69 XXX XXXX"
                />
                <SettingField 
                  settingKey="company_tax_id" 
                  label="Tax ID (NIPT)" 
                  placeholder="L12345678A"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_address">Company Address</Label>
                <Textarea
                  id="company_address"
                  value={settings.company_address || ""}
                  onChange={(e) => handleChange("company_address", e.target.value)}
                  placeholder="Full company address"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoicing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Settings
              </CardTitle>
              <CardDescription>
                Configure invoice numbering, tax rates, and payment terms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingField 
                  settingKey="invoice_prefix" 
                  label="Invoice Prefix" 
                  placeholder="INV"
                  description="Prefix for invoice numbers (e.g., INV-2025-000001)"
                />
                <SettingField 
                  settingKey="credit_note_prefix" 
                  label="Credit Note Prefix" 
                  placeholder="CN"
                  description="Prefix for credit note numbers"
                />
                <SettingField 
                  settingKey="default_tax_rate" 
                  label="Default Tax Rate (%)" 
                  type="number"
                  placeholder="20"
                  description="Albanian VAT/TVSH rate (typically 20%)"
                />
                <SettingField 
                  settingKey="default_payment_terms" 
                  label="Payment Terms (days)" 
                  type="number"
                  placeholder="30"
                  description="Default number of days until payment is due"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice_footer_text">Invoice Footer Text</Label>
                <Textarea
                  id="invoice_footer_text"
                  value={settings.invoice_footer_text || ""}
                  onChange={(e) => handleChange("invoice_footer_text", e.target.value)}
                  placeholder="Thank you for your business!"
                  rows={2}
                />
                <p className="text-sm text-muted-foreground">
                  This text appears at the bottom of all invoices
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banking">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Banking Details
              </CardTitle>
              <CardDescription>
                Bank account information for wire transfers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingField 
                  settingKey="bank_name" 
                  label="Bank Name" 
                  placeholder="Raiffeisen Bank Albania"
                />
                <SettingField 
                  settingKey="bank_account" 
                  label="Account Number" 
                  placeholder="1234567890"
                />
                <SettingField 
                  settingKey="bank_iban" 
                  label="IBAN" 
                  placeholder="AL47..."
                  description="International Bank Account Number"
                />
                <SettingField 
                  settingKey="bank_swift" 
                  label="SWIFT/BIC Code" 
                  placeholder="SGSBALTX"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Configure automated billing notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingField 
                  settingKey="overdue_reminder_days" 
                  label="Overdue Reminder (days)" 
                  type="number"
                  placeholder="7"
                  description="Days after due date to send overdue notice"
                />
                <SettingField 
                  settingKey="payment_reminder_days" 
                  label="Payment Reminder (days before)" 
                  type="number"
                  placeholder="3"
                  description="Days before due date to send payment reminder"
                />
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Automated Emails</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Invoice created - Sent when a new invoice is generated</li>
                  <li>• Payment received - Sent when payment is recorded</li>
                  <li>• Payment reminder - Sent before due date</li>
                  <li>• Overdue notice - Sent when invoice becomes overdue</li>
                  <li>• Monthly statement - Sent at start of each month</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}