import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { KeyRound, Loader2, Plus, Trash2, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type Member = { user_id: string; role: string; email?: string | null; full_name?: string | null; joined?: string };

async function callFn(name: string, body: Record<string, unknown>) {
  const { data: s } = await supabase.auth.getSession();
  const token = s.session?.access_token;
  if (!token) throw new Error("Your admin session expired. Sign in again.");
  const { data, error } = await supabase.functions.invoke(name, { body, headers: { Authorization: `Bearer ${token}` } });
  let msg = (data as any)?.error;
  if (error && !msg) {
    try { msg = (await (error as any).context?.clone().json())?.error; } catch { /* ignore */ }
    msg = msg || error.message;
  }
  if (msg) throw new Error(msg);
  return data as any;
}

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");

export function CompanyDetailSheet({ company, open, onOpenChange, onChanged }: {
  company: any | null; open: boolean; onOpenChange: (o: boolean) => void; onChanged: () => void;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "", password: "Login@123", role: "recruiter" });
  const [resetFor, setResetFor] = useState<Member | null>(null);
  const [newPw, setNewPw] = useState("Login@123");
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(null);

  const load = async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const [m, j, o] = await Promise.all([
        supabase.from("company_members").select("user_id, role, created_at").eq("company_id", company.id),
        supabase.from("jobs").select("id, title, slug, location, is_active, payment_status, views_count, applications_count, created_at").eq("company_id", company.id).order("created_at", { ascending: false }),
        supabase.from("client_package_offers").select("*").eq("company_id", company.id).order("created_at", { ascending: false }),
      ]);
      const rows: Member[] = ((m.data || []) as any[]).map((r) => ({ user_id: r.user_id, role: r.role, joined: r.created_at }));
      if (company.owner_id && !rows.some((r) => r.user_id === company.owner_id)) rows.unshift({ user_id: company.owner_id, role: "owner" });
      const ids = rows.map((r) => r.user_id);
      if (ids.length) {
        const [{ data: profs }, { data: s }] = await Promise.all([
          supabase.from("profiles").select("id, email, full_name").in("id", ids),
          supabase.from("subscriptions").select("user_id, plan_slug, tier, status, current_period_end, job_posts_limit").in("user_id", ids).eq("status", "active"),
        ]);
        const byId = Object.fromEntries((profs || []).map((p: any) => [p.id, p]));
        rows.forEach((r) => { r.email = byId[r.user_id]?.email; r.full_name = byId[r.user_id]?.full_name; });
        setSubs((s || []).map((x: any) => ({ ...x, email: byId[x.user_id]?.email })));
      } else setSubs([]);
      rows.sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0));
      setMembers(rows);
      setJobs(j.data || []);
      setOffers(o.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (open) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open, company?.id]);

  const addUser = async () => {
    setBusy("add");
    try {
      const r = await callFn("admin-manage-company-user", { action: "add", company_id: company.id, ...form });
      toast.success(r.created ? "Account created and linked" : "Existing account linked to company");
      if (r.created) setCreds({ email: form.email.trim().toLowerCase(), password: r.password });
      setAddOpen(false);
      setForm({ email: "", full_name: "", password: "Login@123", role: "recruiter" });
      await load(); onChanged();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };

  const setRole = async (m: Member, role: string) => {
    setBusy(m.user_id);
    try { await callFn("admin-manage-company-user", { action: "set_role", company_id: company.id, user_id: m.user_id, role }); toast.success("Role updated"); await load(); onChanged(); }
    catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };

  const remove = async (m: Member) => {
    if (!confirm(`Remove ${m.email} from ${company.name}? Their account stays, but they lose access to this company.`)) return;
    setBusy(m.user_id);
    try { await callFn("admin-manage-company-user", { action: "remove", company_id: company.id, user_id: m.user_id }); toast.success("Removed from company"); await load(); onChanged(); }
    catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };

  const resetPw = async () => {
    if (!resetFor?.email) return;
    setBusy("reset");
    try {
      await callFn("admin-reset-password", { email: resetFor.email, password: newPw });
      setCreds({ email: resetFor.email, password: newPw });
      setResetFor(null);
      toast.success("Password reset");
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };

  const activeJobs = jobs.filter((j) => j.is_active);
  const payLink = (o: any) => `https://jobs.al/pay/${o.id}?t=${o.pay_token}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {company && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 flex-wrap">
                {company.name}
                {company.is_verified ? <Badge>Verified</Badge> : <Badge variant="secondary">Unverified</Badge>}
              </SheetTitle>
              <SheetDescription>
                {company.location || "No location"} · {members.length} users · {activeJobs.length} active jobs
                {company.slug && (<> · <a className="underline" href={`/companies/${company.slug}`} target="_blank" rel="noreferrer">Public page</a></>)}
              </SheetDescription>
            </SheetHeader>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <Tabs defaultValue="users" className="mt-6">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="users">Users ({members.length})</TabsTrigger>
                  <TabsTrigger value="package">Package</TabsTrigger>
                  <TabsTrigger value="jobs">Jobs ({jobs.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-3 mt-4">
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1" />Add user</Button>
                  </div>
                  {members.map((m) => (
                    <div key={m.user_id} className="border rounded-md p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{m.full_name || m.email || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground truncate">{m.email}</div>
                        {m.user_id === company.owner_id && <div className="text-xs text-muted-foreground mt-0.5">Main account (holds the company package)</div>}
                      </div>
                      <Select value={m.role} onValueChange={(v) => setRole(m, v)} disabled={busy === m.user_id || m.user_id === company.owner_id}>
                        <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="recruiter">Recruiter</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" title="Reset password" onClick={() => { setResetFor(m); setNewPw("Login@123"); }}><KeyRound className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" title="Remove from company" disabled={m.user_id === company.owner_id || busy === m.user_id} onClick={() => remove(m)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">Owner and Recruiter can post jobs and use the company package. Viewer can only see.</p>
                </TabsContent>

                <TabsContent value="package" className="space-y-3 mt-4">
                  {offers.length === 0 && subs.length === 0 && <p className="text-sm text-muted-foreground">No package. This company uses the free monthly job or pays per job.</p>}
                  {offers.map((o) => {
                    const expired = new Date(o.expires_at) < new Date();
                    return (
                      <div key={o.id} className="border rounded-md p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium">{o.package_name || "Private package"}</div>
                          <Badge variant={o.status === "paid" && !expired ? "default" : "secondary"}>{expired && o.status === "paid" ? "expired" : o.status === "offered" ? "awaiting payment" : o.status}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Price: <b>€{(o.amount_cents / 100).toLocaleString("en", { minimumFractionDigits: 2 })}</b></div>
                          <div>Job posts: <b>{o.credits_used} used / {o.credit_limit}</b></div>
                          <div>Valid: {fmt(o.starts_at)} → {fmt(o.expires_at)}</div>
                          <div>Paid: {fmt(o.paid_at)}</div>
                        </div>
                        {o.status === "offered" && o.pay_token && (
                          <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(payLink(o)); toast.success("Payment link copied"); }}>
                            <Copy className="h-4 w-4 mr-1" />Copy payment link
                          </Button>
                        )}
                      </div>
                    );
                  })}
                  {subs.map((s, i) => (
                    <div key={i} className="border rounded-md p-4 text-sm">
                      <div className="font-medium">Monthly plan: {s.plan_slug || s.tier}</div>
                      <div className="text-muted-foreground">{s.email} · {s.job_posts_limit ?? "—"} jobs/month · renews {fmt(s.current_period_end)}</div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">Create new private packages in Admin → Packages.</p>
                </TabsContent>

                <TabsContent value="jobs" className="space-y-2 mt-4">
                  {jobs.length === 0 && <p className="text-sm text-muted-foreground">No jobs posted yet.</p>}
                  {jobs.map((j) => (
                    <div key={j.id} className="border rounded-md p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{j.title}</div>
                        <div className="text-xs text-muted-foreground">{j.location} · posted {fmt(j.created_at)} · {j.views_count || 0} views · {j.applications_count || 0} applicants</div>
                      </div>
                      <Badge variant={j.is_active ? "default" : "secondary"}>{j.is_active ? "Active" : j.payment_status === "awaiting_payment" ? "Awaiting payment" : "Inactive"}</Badge>
                      {j.is_active && <a href={`/jobs/${j.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>}
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            )}
          </>
        )}

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add user to {company?.name}</DialogTitle>
              <DialogDescription>Creates a new employer account, or links the account if this email is already registered.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Full name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
              <div><Label>Temporary password (new accounts only)</Label><Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
              <div><Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="recruiter">Recruiter</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={addUser} disabled={busy === "add" || !form.email}>{busy === "add" && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Add user</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!resetFor} onOpenChange={(o) => !o && setResetFor(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset password</DialogTitle>
              <DialogDescription>{resetFor?.email}</DialogDescription>
            </DialogHeader>
            <div><Label>New password</Label><Input value={newPw} onChange={(e) => setNewPw(e.target.value)} /></div>
            <DialogFooter>
              <Button onClick={resetPw} disabled={busy === "reset" || newPw.length < 6}>{busy === "reset" && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Reset password</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!creds} onOpenChange={(o) => !o && setCreds(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Login details</DialogTitle>
              <DialogDescription>Send these to the user. They can sign in at jobs.al/auth.</DialogDescription>
            </DialogHeader>
            <pre className="bg-muted rounded p-3 text-sm whitespace-pre-wrap">{`Email: ${creds?.email}\nPassword: ${creds?.password}\nLogin: https://jobs.al/auth`}</pre>
            <DialogFooter>
              <Button onClick={() => { navigator.clipboard.writeText(`Email: ${creds?.email}\nPassword: ${creds?.password}\nLogin: https://jobs.al/auth`); toast.success("Copied"); }}><Copy className="h-4 w-4 mr-1" />Copy</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
