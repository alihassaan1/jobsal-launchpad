import { describe, it, expect } from "vitest";
import { applicationsToCsv } from "./applicationsCsv";

describe("applicationsToCsv", () => {
  it("exports one row per applicant with Albanian characters and escaping", () => {
    const csv = applicationsToCsv([
      { profiles: { full_name: "Arjanë Çela", email: "a@x.al" }, status: "shortlisted", created_at: "2026-11-10T10:00:00Z", cover_letter: 'Hi, "team"' },
    ]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    const lines = csv.slice(1).split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("Arjanë Çela");
    expect(lines[1]).toContain("2026-11-10");
    expect(lines[1]).toContain('"Hi, ""team"""');
  });
  it("neutralises formula injection", () => {
    expect(applicationsToCsv([{ profiles: { full_name: "=HACK()" } }])).toContain("'=HACK()");
  });
});
