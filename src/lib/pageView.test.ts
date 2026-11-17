import { describe, expect, it } from "vitest";
import { shouldTrackVisit } from "./pageView";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

describe("page visit deduplication", () => {
  it("counts a job once in the same browser session", () => {
    const storage = memoryStorage();
    expect(shouldTrackVisit("job", "job-1", storage)).toBe(true);
    expect(shouldTrackVisit("job", "job-1", storage)).toBe(false);
  });

  it("tracks a company and a different job independently", () => {
    const storage = memoryStorage();
    expect(shouldTrackVisit("company", "company-1", storage)).toBe(true);
    expect(shouldTrackVisit("company", "company-1", storage)).toBe(false);
    expect(shouldTrackVisit("job", "job-2", storage)).toBe(true);
  });
});
