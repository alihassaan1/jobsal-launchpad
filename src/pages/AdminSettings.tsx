import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mail, CreditCard, Palette, Globe, FileText } from "lucide-react";

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*');

    if (!error && data) {
      const settingsMap = data.reduce((acc, setting) => {
        acc[setting.key] = setting.value || '';
        return acc;
      }, {} as Record<string, string>);
      setSettings(settingsMap);
    }
    setLoading(false);
  };

  const updateSetting = async (key: string, value: string, description?: string) => {
    const { error } = await supabase
      .from('admin_settings')
      .upsert({ 
        key, 
        value,
        description: description || null
      }, { onConflict: 'key' });

    if (error) {
      toast.error(`Failed to update ${key}`);
      return false;
    }
    return true;
  };

  const handleSaveSection = async (section: string, keys: string[]) => {
    let success = true;
    for (const key of keys) {
      const result = await updateSetting(key, settings[key] || '');
      if (!result) success = false;
    }
    
    if (success) {
      toast.success(`${section} settings saved successfully`);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="p-6">Loading settings...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground mt-1">Configure global platform settings</p>
      </div>

      <Tabs defaultValue="email" className="space-y-4">
        <TabsList>
          <TabsTrigger value="email">
            <Mail className="mr-2 h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="mr-2 h-4 w-4" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="theme">
            <Palette className="mr-2 h-4 w-4" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Globe className="mr-2 h-4 w-4" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="legal">
            <FileText className="mr-2 h-4 w-4" />
            Legal
          </TabsTrigger>
        </TabsList>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>Configure email service settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="smtp_host">SMTP Host</Label>
                <Input
                  id="smtp_host"
                  value={settings.smtp_host || ''}
                  onChange={(e) => handleInputChange('smtp_host', e.target.value)}
                  placeholder="smtp.example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp_port">SMTP Port</Label>
                <Input
                  id="smtp_port"
                  value={settings.smtp_port || ''}
                  onChange={(e) => handleInputChange('smtp_port', e.target.value)}
                  placeholder="587"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="from_email">From Email</Label>
                <Input
                  id="from_email"
                  type="email"
                  value={settings.from_email || ''}
                  onChange={(e) => handleInputChange('from_email', e.target.value)}
                  placeholder="noreply@jobs.al"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support_email">Support Email</Label>
                <Input
                  id="support_email"
                  type="email"
                  value={settings.support_email || ''}
                  onChange={(e) => handleInputChange('support_email', e.target.value)}
                  placeholder="support@jobs.al"
                />
              </div>
              <Button onClick={() => handleSaveSection('Email', ['smtp_host', 'smtp_port', 'from_email', 'support_email'])}>
                Save Email Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Gateway</CardTitle>
              <CardDescription>Configure Stripe or other payment settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stripe_publishable_key">Stripe Publishable Key</Label>
                <Input
                  id="stripe_publishable_key"
                  value={settings.stripe_publishable_key || ''}
                  onChange={(e) => handleInputChange('stripe_publishable_key', e.target.value)}
                  placeholder="pk_live_..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Input
                  id="currency"
                  value={settings.currency || 'EUR'}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  placeholder="EUR"
                />
              </div>
              <Button onClick={() => handleSaveSection('Payment', ['stripe_publishable_key', 'currency'])}>
                Save Payment Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme Settings */}
        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle>Theme & Branding</CardTitle>
              <CardDescription>Customize the look and feel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary_color">Primary Color</Label>
                <Input
                  id="primary_color"
                  type="color"
                  value={settings.primary_color || '#0066ff'}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site_logo">Site Logo URL</Label>
                <Input
                  id="site_logo"
                  value={settings.site_logo || ''}
                  onChange={(e) => handleInputChange('site_logo', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <Button onClick={() => handleSaveSection('Theme', ['primary_color', 'site_logo'])}>
                Save Theme Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Settings */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO Configuration</CardTitle>
              <CardDescription>Global SEO defaults</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta_title">Default Meta Title</Label>
                <Input
                  id="meta_title"
                  value={settings.meta_title || ''}
                  onChange={(e) => handleInputChange('meta_title', e.target.value)}
                  placeholder="Jobs.al - Find Your Dream Job in Albania"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta_description">Default Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={settings.meta_description || ''}
                  onChange={(e) => handleInputChange('meta_description', e.target.value)}
                  placeholder="Albania's leading job portal..."
                  rows={3}
                />
              </div>
              <Button onClick={() => handleSaveSection('SEO', ['meta_title', 'meta_description'])}>
                Save SEO Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Legal Settings */}
        <TabsContent value="legal">
          <Card>
            <CardHeader>
              <CardTitle>Legal & Contact</CardTitle>
              <CardDescription>Terms of Service and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="terms_url">Terms of Service URL</Label>
                <Input
                  id="terms_url"
                  value={settings.terms_url || ''}
                  onChange={(e) => handleInputChange('terms_url', e.target.value)}
                  placeholder="https://jobs.al/terms"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="privacy_url">Privacy Policy URL</Label>
                <Input
                  id="privacy_url"
                  value={settings.privacy_url || ''}
                  onChange={(e) => handleInputChange('privacy_url', e.target.value)}
                  placeholder="https://jobs.al/privacy"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={settings.contact_phone || ''}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  placeholder="+355 XX XXX XXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                <Input
                  id="whatsapp_number"
                  value={settings.whatsapp_number || ''}
                  onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                  placeholder="+355 XX XXX XXX"
                />
              </div>
              <Button onClick={() => handleSaveSection('Legal', ['terms_url', 'privacy_url', 'contact_phone', 'whatsapp_number'])}>
                Save Legal Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
