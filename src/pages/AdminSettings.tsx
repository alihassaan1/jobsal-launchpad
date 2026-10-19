import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mail, CreditCard, Palette, Globe, FileText, Share2, HardDrive, Loader2 } from "lucide-react";

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [migrationReport, setMigrationReport] = useState<{ total: number; migrated: number; skipped: number; failed: { id: string; path: string; error: string }[] } | null>(null);

  const runResumeMigration = async () => {
    setMigrating(true);
    setMigrationReport(null);
    try {
      const { data, error } = await supabase.functions.invoke("migrate-resumes-to-r2", { body: {} });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMigrationReport(data);
      toast.success(`Migration complete: ${data.migrated} moved, ${data.skipped} already in R2, ${data.failed?.length ?? 0} failed`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Migration failed");
    } finally {
      setMigrating(false);
    }
  };

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
          <TabsTrigger value="analytics">
            <Globe className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Globe className="mr-2 h-4 w-4" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="legal">
            <FileText className="mr-2 h-4 w-4" />
            Legal
          </TabsTrigger>
          <TabsTrigger value="social">
            <Share2 className="mr-2 h-4 w-4" />
            Social
          </TabsTrigger>
          <TabsTrigger value="storage">
            <HardDrive className="mr-2 h-4 w-4" />
            Storage
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

        {/* Analytics Settings */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Google Analytics</CardTitle>
              <CardDescription>Configure Google Analytics tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ga_measurement_id">Measurement ID</Label>
                <Input
                  id="ga_measurement_id"
                  value={settings.ga_measurement_id || ''}
                  onChange={(e) => handleInputChange('ga_measurement_id', e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                />
                <p className="text-xs text-muted-foreground">Current: G-Z5KWC604KL (configured in index.html)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ga_enabled">Tracking Status</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="ga_enabled"
                    value={settings.ga_enabled || 'true'}
                    onChange={(e) => handleInputChange('ga_enabled', e.target.value)}
                    placeholder="true or false"
                  />
                </div>
              </div>
              <Button onClick={() => handleSaveSection('Analytics', ['ga_measurement_id', 'ga_enabled'])}>
                Save Analytics Settings
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
        {/* Social Media Settings */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>URLs shown in the site footer. Leave blank to hide an icon.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'social_facebook', label: 'Facebook URL', placeholder: 'https://facebook.com/jobs.al' },
                { key: 'social_instagram', label: 'Instagram URL', placeholder: 'https://instagram.com/jobs.al' },
                { key: 'social_linkedin', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/company/jobs-al' },
                { key: 'social_twitter', label: 'X / Twitter URL', placeholder: 'https://x.com/jobsal' },
                { key: 'social_youtube', label: 'YouTube URL', placeholder: 'https://youtube.com/@jobsal' },
                { key: 'social_tiktok', label: 'TikTok URL', placeholder: 'https://tiktok.com/@jobs.al' },
              ].map((f) => (
                <div key={f.key} className="space-y-2">
                  <Label htmlFor={f.key}>{f.label}</Label>
                  <Input
                    id={f.key}
                    type="url"
                    value={settings[f.key] || ''}
                    onChange={(e) => handleInputChange(f.key, e.target.value)}
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
              <Button onClick={() => handleSaveSection('Social', ['social_facebook', 'social_instagram', 'social_linkedin', 'social_twitter', 'social_youtube', 'social_tiktok'])}>
                Save Social Links
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Settings */}
        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>Cloudflare R2 Storage</CardTitle>
              <CardDescription>
                Resumes and website images are stored in your Cloudflare R2 bucket. New uploads go there automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Move existing resumes to R2</Label>
                <p className="text-sm text-muted-foreground">
                  Copies every resume uploaded before the R2 switch into the <code>resumes/</code> folder of your R2 bucket and updates each user's link. Safe to run more than once — resumes already in R2 are skipped.
                </p>
              </div>
              <Button onClick={runResumeMigration} disabled={migrating}>
                {migrating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HardDrive className="mr-2 h-4 w-4" />}
                {migrating ? "Migrating..." : "Migrate Resumes to R2"}
              </Button>
              {migrationReport && (
                <div className="rounded-md border p-4 text-sm space-y-1">
                  <p><strong>Total resumes:</strong> {migrationReport.total}</p>
                  <p><strong>Moved to R2:</strong> {migrationReport.migrated}</p>
                  <p><strong>Already in R2 / skipped:</strong> {migrationReport.skipped}</p>
                  <p><strong>Failed:</strong> {migrationReport.failed.length}</p>
                  {migrationReport.failed.length > 0 && (
                    <ul className="mt-2 space-y-1 text-destructive">
                      {migrationReport.failed.map((f) => (
                        <li key={f.id}>{f.path}: {f.error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
