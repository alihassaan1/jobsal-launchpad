export interface AdminApplication {
  id: string; created_at: string; status: string; viewed_at: string | null; ai_match_score: number | null;
  resume_url: string | null; cover_letter: string | null; notes: string | null; extracted_data: any;
  applicant_id: string; applicant_name: string | null; applicant_email: string | null; applicant_phone: string | null;
  applicant_location: string | null; applicant_linkedin: string | null; applicant_signed_up: string | null;
  job_id: string | null; job_title: string | null; job_slug: string | null;
  company_id: string | null; company_name: string | null; company_slug: string | null;
}

export interface AppFilters {
  search?: string; from?: string; to?: string; companyId?: string; jobId?: string; status?: string; notViewed?: boolean;
}

const DAY = 86_400_000;

/** An application counts as viewed once the employer opened it or moved it past "applied". */
export const isViewed = (a: Pick<AdminApplication, "viewed_at" | "status">) => !!a.viewed_at || a.status !== "applied";

export function filterApplications(apps: AdminApplication[], f: AppFilters): AdminApplication[] {
  const q = f.search?.trim().toLowerCase();
  const from = f.from ? new Date(f.from + "T00:00:00").getTime() : null;
  const to = f.to ? new Date(f.to + "T23:59:59.999").getTime() : null;
  return apps.filter((a) => {
    if (q && !`${a.applicant_name ?? ""} ${a.applicant_email ?? ""}`.toLowerCase().includes(q)) return false;
    const t = new Date(a.created_at).getTime();
    if (from !== null && t < from) return false;
    if (to !== null && t > to) return false;
    if (f.companyId && a.company_id !== f.companyId) return false;
    if (f.jobId && a.job_id !== f.jobId) return false;
    if (f.status && a.status !== f.status) return false;
    if (f.notViewed && isViewed(a)) return false;
    return true;
  });
}

export function applicationStats(apps: AdminApplication[], now = new Date()) {
  const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
  const n = now.getTime();
  const within = (ms: number) => apps.filter((a) => n - new Date(a.created_at).getTime() <= ms).length;
  const viewed = apps.filter(isViewed).length;
  return {
    today: apps.filter((a) => new Date(a.created_at) >= startToday).length,
    last7: within(7 * DAY),
    last30: within(30 * DAY),
    total: apps.length,
    uniqueApplicants: new Set(apps.map((a) => a.applicant_id)).size,
    viewedPct: apps.length ? Math.round((viewed / apps.length) * 100) : 0,
    staleUnviewed: apps.filter((a) => !isViewed(a) && n - new Date(a.created_at).getTime() > 3 * DAY).length,
  };
}

export interface ApplicantGroup {
  applicant_id: string; name: string | null; email: string | null; phone: string | null;
  count: number; latest: string; jobs: { title: string | null; company: string | null }[]; apps: AdminApplication[];
}

export function groupByApplicant(apps: AdminApplication[]): ApplicantGroup[] {
  const m = new Map<string, ApplicantGroup>();
  for (const a of apps) {
    let g = m.get(a.applicant_id);
    if (!g) {
      g = { applicant_id: a.applicant_id, name: a.applicant_name, email: a.applicant_email, phone: a.applicant_phone, count: 0, latest: a.created_at, jobs: [], apps: [] };
      m.set(a.applicant_id, g);
    }
    g.count++; g.apps.push(a); g.jobs.push({ title: a.job_title, company: a.company_name });
    if (a.created_at > g.latest) g.latest = a.created_at;
  }
  return [...m.values()].sort((x, y) => y.count - x.count || (y.latest > x.latest ? 1 : -1));
}
