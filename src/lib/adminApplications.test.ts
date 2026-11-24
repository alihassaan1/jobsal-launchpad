import { describe, it, expect } from "vitest";
import { applicationStats, filterApplications, groupByApplicant, type AdminApplication } from "./adminApplications";

const now = new Date("2026-11-24T12:00:00");
const mk = (id: string, applicant: string, daysAgo: number, extra: Partial<AdminApplication> = {}): AdminApplication => ({
  id, applicant_id: applicant, created_at: new Date(now.getTime() - daysAgo * 86_400_000).toISOString(),
  status: "applied", viewed_at: null, ai_match_score: null, resume_url: null, cover_letter: null, notes: null, extracted_data: null,
  applicant_name: applicant, applicant_email: `${applicant}@x.al`, applicant_phone: null, applicant_location: null, applicant_linkedin: null,
  applicant_signed_up: null, job_id: "j1", job_title: "Job", job_slug: "job", company_id: "c1", company_name: "Co", company_slug: "co", ...extra,
});

describe("admin applications", () => {
  const apps = [mk("1", "ana", 0), mk("2", "ana", 5, { viewed_at: now.toISOString() }), mk("3", "ben", 10, { company_id: "c2" }), mk("4", "ben", 40, { status: "shortlisted" })];

  it("counts summary cards", () => {
    expect(applicationStats(apps, now)).toEqual({ today: 1, last7: 2, last30: 3, total: 4, uniqueApplicants: 2, viewedPct: 50, staleUnviewed: 1 });
  });
  it("filters not viewed by employer and by company", () => {
    expect(filterApplications(apps, { notViewed: true }).map((a) => a.id)).toEqual(["1", "3"]);
    expect(filterApplications(apps, { companyId: "c2" }).map((a) => a.id)).toEqual(["3"]);
  });
  it("groups one row per applicant", () => {
    const g = groupByApplicant(apps);
    expect(g.map((x) => [x.applicant_id, x.count])).toEqual([["ana", 2], ["ben", 2]]);
  });
});
