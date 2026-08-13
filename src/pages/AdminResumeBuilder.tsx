import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Sparkles, Palette, FileText } from "lucide-react";
import {
  useResumeAISettings,
  RESUME_AI_DEFAULTS,
  type ResumeAISettings,
} from "@/hooks/useResumeAISettings";

const FEATURE_TOGGLES: Array<{ key: string; label: string; description: string }> = [
  {
    key: "resume_ai_enabled",
    label: "AI features enabled",
    description: "Master switch. When off, all AI buttons are hidden from the resume builder.",
  },
  {
    key: "resume_ai_summary_enabled",
    label: "Professional summary generator",
    description: "Lets job seekers generate a summary from their profile details.",
  },
  {
    key: "resume_ai_experience_enabled",
    label: "Work experience bullets",
    description: "Generates achievement-focused bullet points for each role.",
  },
  {
    key: "resume_ai_skills_enabled",
    label: "Skill suggestions",
    description: "Suggests in-demand skills based on the candidate's job title.",
  },
  {
    key: "resume_ai_cover_letter_enabled",
    label: "Cover letter generator",
    description: "Allows AI-written cover letters from resume data.",
  },
];

const MODELS = [
  { value: "deepseek-chat", label: "DeepSeek Chat (cheapest, default)" },
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash (Lovable AI)" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro (highest quality)" },
];

export default function AdminResumeBuilder() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useResumeAISettings();
  const [draft, setDraft] = useState<ResumeAISettings>(RESUME_AI_DEFAULTS);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (settings) setDraft(settings);
  }, [settings]);

  const { data: usage } = useQuery({
    queryKey: ["resume-ai-usage"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("ai_agent_logs")
        .select("status, total_tokens, cost, content_type, created_at")
        .like("content_type", "resume_%")
        .gte("created_at", since)
        .limit(5000);

      if (error) throw error;
      const rows = data || [];
      return {
        calls: rows.length,
        failed: rows.filter((r) => r.status !== "success").length,
        tokens: rows.reduce((sum, r) => sum + (r.total_tokens || 0), 0),
        cost: rows.reduce((sum, r) => sum + Number(r.cost || 0), 0),
      };
    },
  });

  const { data: resumeStats } = useQuery({
    queryKey: ["resume-builder-stats"],
    queryFn: async () => {
      const [total, uploaded, templates] = await Promise.all([
        supabase.from("resumes").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase
          .from("resumes")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true)
          .eq("is_uploaded", true),
        supabase
          .from("resume_templates")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
      ]);
      return {
        total: total.count || 0,
        uploaded: uploaded.count || 0,
        built: (total.count || 0) - (uploaded.count || 0),
        templates: templates.count || 0,
      };
    },
  });

  const saveSetting = async (key: string, value: string) => {
    setSaving(key);
    setDraft((prev) => ({ ...prev, [key]: value }));
    try {
      const { error } = await supabase
        .from("admin_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["resume-ai-settings"] });
      toast.success("Setting saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save setting");
      if (settings) setDraft(settings);
    } finally {
      setSaving(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Resume Builder</h1>
        <p className="text-muted-foreground mt-2">
          Control the AI features, model and usage limits of the resume builder.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resumes created</CardDescription>
            <CardTitle className="text-2xl">{resumeStats?.total ?? "—"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {resumeStats ? `${resumeStats.built} built · ${resumeStats.uploaded} uploaded` : ""}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>AI calls (30 days)</CardDescription>
            <CardTitle className="text-2xl">{usage?.calls ?? "—"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {usage ? `${usage.failed} failed` : ""}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tokens (30 days)</CardDescription>
            <CardTitle className="text-2xl">{usage ? usage.tokens.toLocaleString() : "—"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {usage ? `$${usage.cost.toFixed(4)} spent` : ""}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active templates</CardDescription>
            <CardTitle className="text-2xl">{resumeStats?.templates ?? "—"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/templates">
                <Palette className="mr-2 h-4 w-4" /> Manage templates
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> AI features
          </CardTitle>
          <CardDescription>
            Turn individual AI helpers on or off. Changes apply immediately for all users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {FEATURE_TOGGLES.map((feature) => (
            <div key={feature.key} className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor={feature.key} className="cursor-pointer">
                  {feature.label}
                </Label>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {saving === feature.key && <Loader2 className="h-4 w-4 animate-spin" />}
                <Switch
                  id={feature.key}
                  checked={draft[feature.key] === "true"}
                  disabled={saving === feature.key}
                  onCheckedChange={(checked) =>
                    saveSetting(feature.key, checked ? "true" : "false")
                  }
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Model &amp; limits
          </CardTitle>
          <CardDescription>Choose the generation model and cap daily usage per user.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>AI model</Label>
            <Select
              value={draft.resume_ai_model}
              onValueChange={(value) => saveSetting("resume_ai_model", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resume_ai_daily_limit">Daily AI generations per user</Label>
            <div className="flex gap-2">
              <Input
                id="resume_ai_daily_limit"
                type="number"
                min={0}
                value={draft.resume_ai_daily_limit}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, resume_ai_daily_limit: e.target.value }))
                }
              />
              <Button
                variant="outline"
                disabled={saving === "resume_ai_daily_limit"}
                onClick={() => {
                  const parsed = parseInt(draft.resume_ai_daily_limit, 10);
                  saveSetting(
                    "resume_ai_daily_limit",
                    String(Number.isFinite(parsed) && parsed >= 0 ? parsed : 20)
                  );
                }}
              >
                Save
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Set 0 for unlimited.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
