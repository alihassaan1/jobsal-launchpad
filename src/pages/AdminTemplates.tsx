import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  is_premium: boolean;
  is_active: boolean;
}

export default function AdminTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("resume_templates")
        .select("*")
        .order("name");

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast.error("Failed to load templates");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateTemplate = async (id: string, field: "is_premium" | "is_active", value: boolean) => {
    setUpdating(id);
    try {
      const { error } = await supabase
        .from("resume_templates")
        .update(field === "is_premium" ? { is_premium: value } : { is_active: value })
        .eq("id", id);

      if (error) throw error;

      setTemplates(templates.map(t => 
        t.id === id ? { ...t, [field]: value } : t
      ));

      toast.success(`Template ${field === 'is_premium' ? 'premium status' : 'activation'} updated`);
    } catch (error: any) {
      toast.error("Failed to update template");
      console.error(error);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Resume Template Management</h1>
          <p className="text-muted-foreground mt-2">
            Control which templates are available to free and premium users
          </p>
        </div>

        <div className="grid gap-6">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                <CardDescription>
                  {template.description} • Category: {template.category}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id={`active-${template.id}`}
                      checked={template.is_active}
                      onCheckedChange={(checked) =>
                        updateTemplate(template.id, "is_active", checked)
                      }
                      disabled={updating === template.id}
                    />
                    <Label htmlFor={`active-${template.id}`} className="cursor-pointer">
                      {template.is_active ? "Active" : "Inactive"}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Switch
                      id={`premium-${template.id}`}
                      checked={template.is_premium}
                      onCheckedChange={(checked) =>
                        updateTemplate(template.id, "is_premium", checked)
                      }
                      disabled={updating === template.id}
                    />
                    <Label htmlFor={`premium-${template.id}`} className="cursor-pointer">
                      {template.is_premium ? "Premium Only" : "Free for All"}
                    </Label>
                  </div>

                  {updating === template.id && (
                    <Loader2 className="w-4 h-4 animate-spin ml-auto" />
                  )}
                </div>

                <div className="mt-4 text-sm text-muted-foreground">
                  {!template.is_active && "⚠️ Template is currently disabled"}
                  {template.is_active && !template.is_premium && "✓ Available to all users"}
                  {template.is_active && template.is_premium && "★ Premium users only"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No templates found
          </CardContent>
        </Card>
      )}
    </div>
  );
}
