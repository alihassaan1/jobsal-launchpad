import { useEffect, useMemo, useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Lock, Unlock, MapPin, Briefcase, Mail, Sparkles, Crown, AlertCircle } from "lucide-react";

interface Row {
  user_id: string;
  headline: string | null;
  desired_role: string | null;
  desired_categories: string[] | null;
  desired_locations: string[] | null;
  min_salary: number | null;
  salary_currency: string | null;
  years_experience: number | null;
  top_skills: string[] | null;
  availability: string | null;
  allow_contact: boolean;
  initial: string | null;
  profile_location: string | null;
  avatar_url: string | null;
}

export default function EmployerTalentPool() {
  const { user, loading: authLoading, userRole } = useAuth();
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [quota, setQuota] = useState<{ limit: number; used: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [skill, setSkill] = useState("");
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("any");
  const [minYears, setMinYears] = useState("");

  // Outreach dialog
  const [contactCandidate, setContactCandidate] = useState<{ id: string; name: string } | null>(null);
  const [outSubject, setOutSubject] = useState("");
  const [outMessage, setOutMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Find company owned by this user
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!company) {
        setHasAccess(false);
        setLoading(false);
        return;
      }
      setCompanyId(company.id);

      // Check active subscription with talent pool access
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("status, plan:plan_id (talent_pool_access, talent_pool_views_limit)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle() as any;

      const planAccess = sub?.plan?.talent_pool_access === true;
      const limit = sub?.plan?.talent_pool_views_limit ?? 0;
      setHasAccess(planAccess);

      if (planAccess) {
        const monthBucket = new Date().toISOString().slice(0, 7);
        const { count } = await supabase
          .from("resume_unlocks")
          .select("id", { count: "exact", head: true })
          .eq("company_id", company.id)
          .eq("month_bucket", monthBucket);
        setQuota({ limit, used: count ?? 0 });

        // Load already-unlocked candidate ids this month (lifetime is fine — they paid)
        const { data: unlockRows } = await supabase
          .from("resume_unlocks")
          .select("candidate_user_id")
          .eq("company_id", company.id);
        setUnlocked(new Set((unlockRows ?? []).map((r) => r.candidate_user_id)));

        await loadCandidates();
      }
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadCandidates = async () => {
    const { data, error } = await supabase
      .from("searchable_candidates")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) { toast.error(error.message); return; }
    setRows((data ?? []) as Row[]);
  };

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (q) {
        const hay = `${r.headline ?? ""} ${r.desired_role ?? ""} ${(r.top_skills ?? []).join(" ")}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      if (skill) {
        if (!(r.top_skills ?? []).some((s) => s.toLowerCase().includes(skill.toLowerCase()))) return false;
      }
      if (location) {
        const locs = [...(r.desired_locations ?? []), r.profile_location ?? ""].join(" ").toLowerCase();
        if (!locs.includes(location.toLowerCase())) return false;
      }
      if (availability !== "any" && r.availability !== availability) return false;
      if (minYears && (r.years_experience ?? 0) < parseInt(minYears)) return false;
      return true;
    });
  }, [rows, q, skill, location, availability, minYears]);

  const unlock = async (candidateId: string) => {
    if (!companyId) return;
    const { data, error } = await supabase.functions.invoke("unlock-candidate", {
      body: { company_id: companyId, candidate_user_id: candidateId },
    });
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error ?? error?.message ?? "Unlock failed");
      return;
    }
    setUnlocked(new Set([...unlocked, candidateId]));
    if (quota) setQuota({ ...quota, used: (data as any)?.unlock?.already_unlocked ? quota.used : quota.used + 1 });
    toast.success("Profile unlocked");
    return data;
  };

  const openContact = async (candidateId: string) => {
    // Need to fetch name — we'll use the unlocked profile if already unlocked
    if (!unlocked.has(candidateId)) {
      const ok = window.confirm("Contacting will first unlock this profile (uses 1 credit). Continue?");
      if (!ok) return;
      const data = await unlock(candidateId);
      if (!data) return;
      setContactCandidate({ id: candidateId, name: (data as any)?.profile?.full_name ?? "Candidate" });
    } else {
      setContactCandidate({ id: candidateId, name: "Candidate" });
    }
    setOutSubject("Opportunity at our company");
    setOutMessage("Hi,\n\nI came across your profile on Jobs.al and would love to connect about a role we're hiring for.\n\nWould you be open to a quick chat?\n\nBest regards,");
  };

  const sendMessage = async () => {
    if (!contactCandidate || !companyId) return;
    setSending(true);
    const { data, error } = await supabase.functions.invoke("send-candidate-outreach", {
      body: {
        company_id: companyId,
        candidate_user_id: contactCandidate.id,
        subject: outSubject,
        message: outMessage,
        reply_to: user?.email,
      },
    });
    setSending(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error ?? error?.message ?? "Failed to send");
      return;
    }
    toast.success("Message sent");
    setContactCandidate(null);
  };

  if (authLoading || loading) {
    return <div className="min-h-screen"><Navigation /><div className="container mx-auto px-4 py-12">Loading…</div></div>;
  }

  if (hasAccess === false) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <Card className="border-primary/30">
            <CardContent className="p-8 text-center">
              <Crown className="h-12 w-12 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Talent Pool is a premium feature</h1>
              <p className="text-muted-foreground mb-6">Search Albania's largest opted-in CV database, unlock candidate profiles, and reach out directly. Available on Pro and Corporate plans.</p>
              <div className="flex gap-3 justify-center">
                <Link to="/pricing"><Button>View Plans</Button></Link>
                <Link to="/employer/subscription"><Button variant="outline">My Subscription</Button></Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><Sparkles className="h-7 w-7 text-primary" />Talent Pool</h1>
            <p className="text-muted-foreground mt-1">Search opted-in candidates across Albania.</p>
          </div>
          {quota && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 flex items-center gap-3">
                <Unlock className="h-5 w-5 text-primary" />
                <div className="text-sm">
                  <div className="font-semibold">Profile views this month</div>
                  <div className="text-muted-foreground">
                    {quota.used} / {quota.limit === -1 ? "Unlimited" : quota.limit}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <Label>Keyword</Label>
              <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Role, headline, skill" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
            </div>
            <div><Label>Skill</Label><Input value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="React" /></div>
            <div><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Tirana" /></div>
            <div>
              <Label>Min years</Label>
              <Input type="number" min={0} value={minYears} onChange={(e) => setMinYears(e.target.value)} />
            </div>
            <div className="md:col-span-5">
              <Label>Availability</Label>
              <Select value={availability} onValueChange={setAvailability}>
                <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="immediate">Immediately</SelectItem>
                  <SelectItem value="one_month">Within 1 month</SelectItem>
                  <SelectItem value="three_months">Within 3 months</SelectItem>
                  <SelectItem value="passive">Passive (open to offers)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground mb-3">{filtered.length} candidate{filtered.length === 1 ? "" : "s"} found</div>

        {filtered.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
            No candidates match your filters yet. The talent pool grows as more job seekers opt in.
          </CardContent></Card>
        ) : (
          <div className="grid gap-4">
            {filtered.map((r) => {
              const isUnlocked = unlocked.has(r.user_id);
              return (
                <Card key={r.user_id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5 flex flex-col md:flex-row gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold flex-shrink-0">
                      {isUnlocked ? (r.initial ?? "?").toUpperCase() : "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {isUnlocked ? "" : <Lock className="inline h-4 w-4 mr-1 text-muted-foreground" />}
                            {r.headline || r.desired_role || "Candidate"}
                          </h3>
                          {r.desired_role && r.headline && <p className="text-sm text-muted-foreground">{r.desired_role}</p>}
                        </div>
                        {r.availability && (
                          <Badge variant={r.availability === "immediate" ? "default" : "secondary"} className="capitalize">
                            {r.availability.replace("_", " ")}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
                        {r.years_experience != null && <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{r.years_experience} yrs</span>}
                        {(r.profile_location || (r.desired_locations ?? []).length > 0) && (
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{r.profile_location || (r.desired_locations ?? []).join(", ")}</span>
                        )}
                        {r.min_salary && <span>≥ {r.salary_currency} {r.min_salary.toLocaleString()}</span>}
                      </div>
                      {(r.top_skills ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {(r.top_skills ?? []).slice(0, 8).map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
                        </div>
                      )}
                    </div>
                    <div className="flex md:flex-col gap-2 md:w-44 flex-shrink-0">
                      {!isUnlocked ? (
                        <Button onClick={() => unlock(r.user_id)} className="flex-1"><Unlock className="h-4 w-4 mr-1" />Unlock</Button>
                      ) : (
                        <Button variant="outline" disabled className="flex-1"><Unlock className="h-4 w-4 mr-1" />Unlocked</Button>
                      )}
                      {r.allow_contact && (
                        <Button variant="outline" onClick={() => openContact(r.user_id)} className="flex-1"><Mail className="h-4 w-4 mr-1" />Contact</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Contact dialog */}
      <Dialog open={!!contactCandidate} onOpenChange={(o) => !o && setContactCandidate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message {contactCandidate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Subject</Label><Input value={outSubject} onChange={(e) => setOutSubject(e.target.value)} /></div>
            <div><Label>Message</Label><Textarea rows={8} value={outMessage} onChange={(e) => setOutMessage(e.target.value)} /></div>
            <p className="text-xs text-muted-foreground">The candidate will receive an email with your reply-to address. They can respond directly to you.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactCandidate(null)}>Cancel</Button>
            <Button onClick={sendMessage} disabled={sending || !outSubject || !outMessage}>{sending ? "Sending…" : "Send message"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
