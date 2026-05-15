import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Sparkles, X } from "lucide-react";

const AVAILABILITY = [
  { value: "immediate", label: "Available immediately" },
  { value: "one_month", label: "Available in 1 month" },
  { value: "three_months", label: "Available in 3 months" },
  { value: "passive", label: "Open to opportunities (passive)" },
];

export default function CandidateVisibility() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    is_searchable: false,
    headline: "",
    desired_role: "",
    desired_categories: [] as string[],
    desired_locations: [] as string[],
    min_salary: "" as string | "",
    salary_currency: "EUR",
    years_experience: "" as string | "",
    top_skills: [] as string[],
    availability: "passive" as string,
    allow_contact: true,
  });
  const [skillDraft, setSkillDraft] = useState("");
  const [locDraft, setLocDraft] = useState("");
  const [catDraft, setCatDraft] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("candidate_visibility")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setForm({
          is_searchable: !!data.is_searchable,
          headline: data.headline ?? "",
          desired_role: data.desired_role ?? "",
          desired_categories: data.desired_categories ?? [],
          desired_locations: data.desired_locations ?? [],
          min_salary: data.min_salary?.toString() ?? "",
          salary_currency: data.salary_currency ?? "EUR",
          years_experience: data.years_experience?.toString() ?? "",
          top_skills: data.top_skills ?? [],
          availability: (data.availability as string) ?? "passive",
          allow_contact: data.allow_contact ?? true,
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      is_searchable: form.is_searchable,
      headline: form.headline || null,
      desired_role: form.desired_role || null,
      desired_categories: form.desired_categories,
      desired_locations: form.desired_locations,
      min_salary: form.min_salary ? parseInt(form.min_salary) : null,
      salary_currency: form.salary_currency,
      years_experience: form.years_experience ? parseInt(form.years_experience) : null,
      top_skills: form.top_skills,
      availability: form.availability as "immediate" | "one_month" | "three_months" | "passive",
      allow_contact: form.allow_contact,
    };
    const { error } = await supabase.from("candidate_visibility").upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Visibility settings saved");
  };

  const addTag = (val: string, key: "top_skills" | "desired_locations" | "desired_categories", reset: () => void) => {
    const v = val.trim();
    if (!v) return;
    if (form[key].includes(v)) return reset();
    setForm({ ...form, [key]: [...form[key], v] });
    reset();
  };
  const removeTag = (val: string, key: "top_skills" | "desired_locations" | "desired_categories") => {
    setForm({ ...form, [key]: form[key].filter((x) => x !== val) });
  };

  if (loading) return <div className="min-h-screen"><Navigation /><div className="container mx-auto px-4 py-12">Loading…</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Talent Pool Visibility</h1>
          <p className="text-muted-foreground mt-1">Let employers discover you privately. You stay anonymous until you choose to respond.</p>
        </div>

        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-3 flex-shrink-0">
              {form.is_searchable ? <Eye className="h-5 w-5 text-primary" /> : <EyeOff className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg">Open to opportunities</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    When ON, vetted employers can find you in search. Your name, email and phone stay hidden until they unlock your profile (which uses one of their monthly credits).
                  </p>
                </div>
                <Switch checked={form.is_searchable} onCheckedChange={(v) => setForm({ ...form, is_searchable: v })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Your professional profile</CardTitle>
            <CardDescription>This is what employers see in search results (anonymized).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Professional headline</Label>
              <Input placeholder="e.g., Senior Backend Engineer · 6 yrs · Tirana" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Desired role / title</Label>
                <Input placeholder="e.g., Software Engineer" value={form.desired_role} onChange={(e) => setForm({ ...form, desired_role: e.target.value })} />
              </div>
              <div>
                <Label>Years of experience</Label>
                <Input type="number" min={0} value={form.years_experience} onChange={(e) => setForm({ ...form, years_experience: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Top skills</Label>
              <div className="flex gap-2">
                <Input placeholder="Add a skill and press Enter" value={skillDraft} onChange={(e) => setSkillDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(skillDraft, "top_skills", () => setSkillDraft("")); }}} />
                <Button type="button" variant="outline" onClick={() => addTag(skillDraft, "top_skills", () => setSkillDraft(""))}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.top_skills.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1">{s}<button onClick={() => removeTag(s, "top_skills")}><X className="h-3 w-3" /></button></Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Preferred categories</Label>
              <div className="flex gap-2">
                <Input placeholder="e.g., Engineering, Marketing" value={catDraft} onChange={(e) => setCatDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(catDraft, "desired_categories", () => setCatDraft("")); }}} />
                <Button type="button" variant="outline" onClick={() => addTag(catDraft, "desired_categories", () => setCatDraft(""))}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.desired_categories.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1">{s}<button onClick={() => removeTag(s, "desired_categories")}><X className="h-3 w-3" /></button></Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Preferred locations</Label>
              <div className="flex gap-2">
                <Input placeholder="e.g., Tirana, Remote" value={locDraft} onChange={(e) => setLocDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(locDraft, "desired_locations", () => setLocDraft("")); }}} />
                <Button type="button" variant="outline" onClick={() => addTag(locDraft, "desired_locations", () => setLocDraft(""))}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.desired_locations.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1">{s}<button onClick={() => removeTag(s, "desired_locations")}><X className="h-3 w-3" /></button></Badge>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Min salary</Label>
                <Input type="number" min={0} value={form.min_salary} onChange={(e) => setForm({ ...form, min_salary: e.target.value })} />
              </div>
              <div>
                <Label>Currency</Label>
                <Select value={form.salary_currency} onValueChange={(v) => setForm({ ...form, salary_currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="ALL">ALL</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Availability</Label>
                <Select value={form.availability} onValueChange={(v) => setForm({ ...form, availability: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AVAILABILITY.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2 border-t">
              <Switch checked={form.allow_contact} onCheckedChange={(v) => setForm({ ...form, allow_contact: v })} />
              <div>
                <Label>Allow employers to contact me by email</Label>
                <p className="text-xs text-muted-foreground">If OFF, employers can only view your profile but cannot message you.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-muted">
          <CardContent className="p-4 flex items-start gap-3 text-sm">
            <Lock className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <p className="text-muted-foreground">
              <strong className="text-foreground">Your privacy is protected.</strong> Your name, email, phone and resume are never shown publicly. Only employers with an active Talent Pool subscription can search opted-in candidates, and unlocking your profile counts against their monthly quota.
            </p>
          </CardContent>
        </Card>

        <Button onClick={save} disabled={saving} className="w-full sm:w-auto">{saving ? "Saving…" : "Save settings"}</Button>
      </main>
    </div>
  );
}
