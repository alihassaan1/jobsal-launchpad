import { describe, expect, it } from "vitest";
import { monthKey, recentMonthBuckets } from "./revenuePeriods";

describe("monthKey", () => {
  it("uses the date's own calendar month, not the UTC one", () => {
    // Local midnight on Nov 1. In Europe/Tirane (UTC+1) this instant is
    // 2026-10-31T23:00Z, so toISOString().slice(0,7) would say "2026-10".
    const nov1 = new Date(2026, 10, 1);
    expect(monthKey(nov1)).toBe("2026-11");
    expect(monthKey(new Date(2026, 0, 1))).toBe("2026-01");
    expect(monthKey(new Date(2026, 11, 31))).toBe("2026-12");
  });
});

describe("recentMonthBuckets", () => {
  it("returns six buckets whose label and key name the same month", () => {
    const buckets = recentMonthBuckets(new Date(2026, 10, 10));
    expect(buckets).toHaveLength(6);
    expect(buckets[0]).toEqual({ key: "2026-06", label: "Jun" });
    expect(buckets[5]).toEqual({ key: "2026-11", label: "Nov" });
    for (const b of buckets) {
      expect(b.key).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it("ends with the current month so this month's sales are on the chart", () => {
    const now = new Date(2026, 10, 10);
    const buckets = recentMonthBuckets(now);
    expect(buckets[buckets.length - 1].key).toBe(monthKey(now));
    expect(buckets.some((b) => b.key === monthKey(now))).toBe(true);
  });

  it("walks back exactly five months from the current one", () => {
    const buckets = recentMonthBuckets(new Date(2026, 10, 10));
    expect(buckets.map((b) => b.key)).toEqual([
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
      "2026-11",
    ]);
  });

  it("puts each month's revenue under its own label", () => {
    // Same aggregation the Revenue page does: bucket by month key, sum the
    // completed payments whose date starts with that key.
    const paid = [
      { date: "2026-10-04", amount: 39 },
      { date: "2026-10-22", amount: 59 },
      { date: "2026-11-02", amount: 1200 },
      { date: "2026-11-09", amount: 19 },
    ];
    const chart = recentMonthBuckets(new Date(2026, 10, 10)).map(({ key, label }) => ({
      month: label,
      revenue: paid.filter((t) => t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0),
    }));

    const nov = chart.find((c) => c.month === "Nov");
    const oct = chart.find((c) => c.month === "Oct");
    expect(nov?.revenue).toBe(1219);
    expect(oct?.revenue).toBe(98);
    expect(chart.find((c) => c.month === "Jun")?.revenue).toBe(0);
  });
});
