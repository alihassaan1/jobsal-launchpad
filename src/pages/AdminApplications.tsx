import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LoadingState } from "@/components/admin/LoadingState";
import { AdminApplication, applicationStats, filterApplications, groupByApplicant, isViewed } from "@/lib/adminApplications";
import { downloadCsv, rowsToCsv } from "@/lib/applicationsCsv";
import { signDocumentPath } from "@/lib/documents";

const PAGE = 50;
const STATUSES = ["applied", "viewed", "shortlisted", "interview", "rejected", "hired"];
const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");
const ALL = "__all";

async function openResume(ref: string) {
  const win = window.open("", "_blank");
  try {
    const idx = ref.indexOf("/resumes/");
    const path = idx >= 0 ? ref.substring(idx + 9) : ref;
    let url: string;
    if (path.startsWith("resumes/")) {
      const { data, error } = await supabase.functions.invoke("r2-storage", { body: { action: "presign_get", key: path } });
      if (error || !data?.url) throw new Error(data?.error || "Could not open CV");
      url = data.url;
    } else {
      const { data, error } = await supabase.storage.from("resumes").createSignedUrl(path, 600);
      if (error || !data?.signedUrl) throw new Error("Could not open CV");
      url = data.signedUrl;
    }
    if (win) win.location.href = url; else window.location.href = url;
  } catch (e: any) {
    win?.close();
    toast.error(e.message || "Could not open CV");
  }
}

export default function AdminApplications() {
  const [params, setParams] = useSearchParams();
  const [apps, setApps] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");
  const [notViewed, setNotViewed] = useState(false);
  const [grouped, setGrouped] = useState(false);
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<AdminApplication | null>(null);
  const [docs, setDocs] = useState<any[] | null>(null);
  const companyId = params.get("company") || "";
  const jobId = params.get("job") || "";

  useEffect(() => {
    (async () => {
      const all: AdminApplication[] = [];
      for (let off = 0; ; off += 1000) {
        const { data, error } = await (supabase.rpc as any)("admin_list_applications").range(off, off + 999);
        if (error) { toast.error("Failed to load applications"); break; }
        all.push(...(data || []));
        if (!data || data.length < 1000) break;
      }
      setApps(all);
      setLoading(false);
    })();
  }, []);

  const setParam = (k: string, v: string) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v); else p.delete(k);
    if (k === "company") p.delete("job");
    setParams(p, { replace: true });
  };

  useEffect(() => setPage(0), [search, from, to, status, notViewed, grouped, companyId, jobId]);

  const stats = useMemo(() => applicationStats(apps), [apps]);
  const filtered = useMemo(() => filterApplications(apps, { search, from, to, companyId, jobId, status, notViewed }), [apps, search, from, to, companyId, jobId, status, notViewed]);
  const groups = useMemo(() => (grouped ? groupByApplicant(filtered) : []), [grouped, filtered]);
  const companies = useMemo(() => [...new Map(apps.filter((a) => a.company_id).map((a) => [a.company_id!, a.company_name || "Unnamed"])).entries()].sort((a, b) => a[1].localeCompare(b[1])), [apps]);
  const jobs = useMemo(() => [...new Map(apps.filter((a) => a.job_id && (!companyId || a.company_id === companyId)).map((a) => [a.job_id!, `${a.job_title || "Untitled"} · ${a.company_name || ""}`])).entries()].sort((a, b) => a[1].localeCompare(b[1])), [apps, companyId]);
  const totalRows = grouped ? groups.length : filtered.length;
  const pages = Math.max(1, Math.ceil(totalRows / PAGE));
  const applicantTotals = useMemo(() => { const m = new Map<string, number>(); apps.forEach((a) => m.set(a.applicant_id, (m.get(a.applicant_id) || 0) + 1)); return m; }, [apps]);

  const openDetail = async (a: AdminApplication) => {
    setDetail(a); setDocs(null);
    const { data, error } = await (supabase.rpc as any)("admin_application_documents", { _application_id: a.id });
    setDocs(error ? [] : data || []);
  };

  const exportCsv = () => {
    const rows: unknown[][] = grouped
      ? [["Name", "Email", "Phone", "Applications", "Jobs"], ...groups.map((g) => [g.name, g.email, g.phone, g.count, g.jobs.map((j) => `${j.title} (${j.company})`).join(" | ")])]
      : [["Name", "Email", "Phone", "Job", "Company", "Applied", "Status", "Viewed by employer", "Viewed on", "AI match"],
         ...filtered.map((a) => [a.applicant_name, a.applicant_email, a.applicant_phone, a.job_title, a.company_name, a.created_at.slice(0, 10), a.status, isViewed(a) ? "yes" : "no", a.viewed_at?.slice(0, 10) ?? "", a.ai_match_score ?? ""])];
    downloadCsv(rowsToCsv(rows), `applications-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  if (loading) return <LoadingState />;

  const cards: [string, string | number][] = [
    ["Today", stats.today], ["Last 7 days", stats.last7], ["Last 30 days", stats.last30], ["Total", stats.total],
    ["Unique applicants", stats.uniqueApplicants], ["Viewed by employer", `${stats.viewedPct}%`], ["Unviewed > 3 days", stats.staleUnviewed],
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Applications</h1>
        <p className="text-muted-foreground">All applications across every company and job (read-only).</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {cards.map(([l, v]) => (
          <Card key={l}><CardHeader className="pb-1"><CardTitle className="text-xs font-medium text-muted-foreground">{l}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{v}</div></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Input placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
            <Select value={companyId || ALL} onValueChange={(v) => setParam("company", v === ALL ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Company" /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>All companies</SelectItem>{companies.map(([id, n]) => <SelectItem key={id} value={id}>{n}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={jobId || ALL} onValueChange={(v) => setParam("job", v === ALL ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Job" /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>All jobs</SelectItem>{jobs.map(([id, n]) => <SelectItem key={id} value={id}>{n}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={status || ALL} onValueChange={(v) => setStatus(v === ALL ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>All statuses</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2"><Switch id="nv" checked={notViewed} onCheckedChange={setNotViewed} /><Label htmlFor="nv">Not viewed by employer</Label></div>
            <div className="flex items-center gap-2"><Switch id="gb" checked={grouped} onCheckedChange={setGrouped} /><Label htmlFor="gb">Group by applicant</Label></div>
            <span className="text-sm text-muted-foreground">{totalRows} {grouped ? "applicants" : "applications"}</span>
            <Button variant="outline" size="sm" className="ml-auto" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
          </div>

          <div className="overflow-x-auto">
            {grouped ? (
              <Table>
                <TableHeader><TableRow><TableHead>Applicant</TableHead><TableHead>Phone</TableHead><TableHead>Applications</TableHead><TableHead>Jobs applied to</TableHead><TableHead>Latest</TableHead></TableRow></TableHeader>
                <TableBody>
                  {groups.slice(page * PAGE, (page + 1) * PAGE).map((g) => (
                    <TableRow key={g.applicant_id} className="cursor-pointer" onClick={() => openDetail(g.apps[0])}>
                      <TableCell><div className="font-medium">{g.name || "—"}</div><div className="text-xs text-muted-foreground">{g.email}</div></TableCell>
                      <TableCell>{g.phone || "—"}</TableCell>
                      <TableCell><Badge variant={g.count > 1 ? "default" : "outline"}>{g.count}</Badge></TableCell>
                      <TableCell className="max-w-md text-sm">{g.jobs.map((j, i) => <div key={i}>{j.title} <span className="text-muted-foreground">· {j.company}</span></div>)}</TableCell>
                      <TableCell>{fmt(g.latest)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Applicant</TableHead><TableHead>Phone</TableHead><TableHead>Job</TableHead><TableHead>Company</TableHead>
                  <TableHead>Applied</TableHead><TableHead>Status</TableHead><TableHead>Viewed</TableHead><TableHead>AI match</TableHead><TableHead>CV</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.slice(page * PAGE, (page + 1) * PAGE).map((a) => (
                    <TableRow key={a.id} className="cursor-pointer" onClick={(e) => { if ((e.target as HTMLElement).closest("a,button")) return; openDetail(a); }}>
                      <TableCell><div className="font-medium">{a.applicant_name || "—"}</div><div className="text-xs text-muted-foreground">{a.applicant_email}</div></TableCell>
                      <TableCell>{a.applicant_phone || "—"}</TableCell>
                      <TableCell>{a.job_slug ? <Link to={`/jobs/${a.job_slug}`} target="_blank" className="text-primary hover:underline">{a.job_title}</Link> : a.job_title || "—"}</TableCell>
                      <TableCell>{a.company_slug ? <Link to={`/companies/${a.company_slug}`} target="_blank" className="text-primary hover:underline">{a.company_name}</Link> : a.company_name || "—"}</TableCell>
                      <TableCell>{fmt(a.created_at)}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{a.status}</Badge></TableCell>
                      <TableCell>{isViewed(a) ? <span>Yes{a.viewed_at && <span className="block text-xs text-muted-foreground">{fmt(a.viewed_at)}</span>}</span> : <span className="text-muted-foreground">No</span>}</TableCell>
                      <TableCell>{a.ai_match_score != null ? `${Math.round(Number(a.ai_match_score))}%` : "—"}</TableCell>
                      <TableCell>{a.resume_url ? <Button size="sm" variant="ghost" onClick={() => openResume(a.resume_url!)}><FileText className="h-4 w-4" /></Button> : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
            <span className="text-sm">Page {page + 1} of {pages}</span>
            <Button variant="outline" size="sm" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {detail && (
            <>
              <SheetHeader><SheetTitle>{detail.applicant_name || detail.applicant_email}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-5 text-sm">
                <section className="grid grid-cols-2 gap-2">
                  <div><div className="text-muted-foreground">Email</div>{detail.applicant_email}</div>
                  <div><div className="text-muted-foreground">Phone</div>{detail.applicant_phone || "—"}</div>
                  <div><div className="text-muted-foreground">Location</div>{detail.applicant_location || "—"}</div>
                  <div><div className="text-muted-foreground">LinkedIn</div>{detail.applicant_linkedin ? <a href={detail.applicant_linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Profile</a> : "—"}</div>
                  <div><div className="text-muted-foreground">Signed up</div>{fmt(detail.applicant_signed_up)}</div>
                  <div><div className="text-muted-foreground">Total applications</div>{applicantTotals.get(detail.applicant_id) || 0}</div>
                </section>
                <section className="rounded-md border p-3">
                  <div className="font-medium">{detail.job_title} · {detail.company_name}</div>
                  <div className="text-muted-foreground">Applied {fmt(detail.created_at)} · <span className="capitalize">{detail.status}</span> · Viewed: {isViewed(detail) ? `yes ${detail.viewed_at ? fmt(detail.viewed_at) : ""}` : "no"}{detail.ai_match_score != null && ` · AI match ${Math.round(Number(detail.ai_match_score))}%`}</div>
                  {detail.resume_url && <Button size="sm" variant="outline" className="mt-2" onClick={() => openResume(detail.resume_url!)}><FileText className="mr-2 h-4 w-4" />Open CV</Button>}
                </section>
                <section><h3 className="mb-1 font-semibold">Cover letter</h3><p className="whitespace-pre-wrap text-muted-foreground">{detail.cover_letter || "—"}</p></section>
                <section><h3 className="mb-1 font-semibold">Attached documents</h3>
                  {docs === null ? <Loader2 className="h-4 w-4 animate-spin" /> : docs.length === 0 ? <p className="text-muted-foreground">None</p> :
                    docs.map((d) => (
                      <Button key={d.id} variant="link" className="h-auto p-0 block" onClick={async () => { try { window.open(await signDocumentPath(d.file_path), "_blank"); } catch (e: any) { toast.error(e.message); } }}>
                        {d.title || d.file_name} <span className="text-muted-foreground">({String(d.doc_type).replace("_", " ")})</span>
                      </Button>
                    ))}
                </section>
                <section><h3 className="mb-1 font-semibold">Employer notes</h3><p className="whitespace-pre-wrap text-muted-foreground">{detail.notes || "—"}</p></section>
                <section><h3 className="mb-1 font-semibold">Extracted data</h3>
                  {detail.extracted_data ? <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(detail.extracted_data, null, 2)}</pre> : <p className="text-muted-foreground">—</p>}
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
